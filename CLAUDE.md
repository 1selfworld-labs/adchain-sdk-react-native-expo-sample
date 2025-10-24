# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

AdChain SDK React Native 예제 앱입니다. `@1selfworld/adchain-sdk-react-native` 패키지를 통합하여 광고 오퍼월 기능을 데모하는 Expo 기반 애플리케이션입니다.

**핵심 기능**:
- AdChain SDK 명시적 초기화 (HomeScreen의 "SDK 초기화" 버튼)
- 사용자 로그인/로그아웃
- 오퍼월 열기 (모달 방식)
- 임베디드 오퍼월 뷰 (탭 통합)
- WebView ↔ Native 양방향 이벤트 브릿지

**패키지 사용 규칙**:
- npm 레지스트리의 공식 `@1selfworld/adchain-sdk-react-native` 패키지만 사용
- 로컬 SDK 패키지 사용 금지 (의존성 꼬임 방지)
- Sample 내 SDK 코드 복사 금지 (중복 관리 방지)

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Expo CLI
- iOS: Xcode 15+, CocoaPods
- Android: Android Studio, JDK 17+

### 의존성 설치
```bash
npm ci
```

### iOS 설정
```bash
cd ios
pod install
cd ..
```

## 실행 명령어

### iOS
```bash
npm run ios
# 또는
npx expo run:ios
```

### Android

**방법 1: 자동화 스크립트 (권장)**
```bash
./run-android.sh
```

이 스크립트는 다음을 자동으로 처리합니다:
1. 에뮬레이터 연결 확인
2. 기존 Metro 서버 종료
3. ADB 포트 포워딩 (8081)
4. Metro 번들러 시작
5. Gradle 빌드 및 APK 설치
6. 앱 실행

**방법 2: Expo CLI**
```bash
npm run android
# 또는
npx expo run:android
```

### Metro 번들러만 시작
```bash
npm start
# 또는
npx expo start
```

## 디버깅

### Metro 로그 확인
```bash
tail -f /tmp/metro-adchain.log  # run-android.sh 사용 시
```

### Android 로그 확인
```bash
adb logcat | grep ReactNativeJS
```

### iOS 로그 확인
Xcode Console에서 확인

## 코드 아키텍처

### 디렉토리 구조
```
src/
├── App.tsx                         # 앱 엔트리포인트 (SDK 초기화 없음)
├── components/
│   ├── TabNavigation.tsx           # 홈/혜택 탭 네비게이션
│   └── Toast.tsx                   # Toast 알림 컴포넌트
└── screens/
    └── HomeScreen.tsx              # SDK 초기화, 로그인/로그아웃, 오퍼월 데모

참고: AdchainOfferwallView는 npm 패키지에서 import하여 사용
```

### 주요 컴포넌트 흐름

**1. SDK 초기화 (HomeScreen의 명시적 버튼)**
```tsx
// HomeScreen.tsx
const handleInitialize = async () => {
  await AdchainSDK.autoInitialize();
  // app.json의 플랫폼별 credentials 자동 읽음
  // → iOS: Info.plist의 AdChainAppKey/AdChainAppSecret
  // → Android: build.gradle의 ADCHAIN_APP_KEY/ADCHAIN_APP_SECRET
};
```

사용자가 "SDK 초기화" 버튼을 눌러 명시적으로 SDK를 활성화합니다.
App.tsx에서는 자동 초기화를 수행하지 않습니다.

**2. 네이티브 뷰 통합 (npm 패키지의 AdchainOfferwallView)**
```tsx
import { AdchainOfferwallView } from '@1selfworld/adchain-sdk-react-native';
```

- `requireNativeComponent`로 네이티브 UI 컴포넌트 연결
- Android: `UIManager.dispatchViewManagerCommand`로 `loadOfferwall` 명령 전송
- iOS: `placementId` prop으로 직접 전달
- React ref forwarding 지원 (부모 컴포넌트에서 네이티브 명령 호출 가능)

**3. 이벤트 브릿지 (TabNavigation의 Benefits 탭)**
```tsx
onCustomEvent={(eventType, payload) => {
  // WebView → App 이벤트 처리
  // 예: "show_toast", "navigate", "share"
}}

onDataRequest={(requestType, params) => {
  // App → WebView 데이터 제공
  // 예: "user_points", "user_profile"
  return responseData;
}}
```

**4. Android 백버튼 처리 (`TabNavigation.tsx:26-43`)**
- Benefits 탭 활성화 시 `BackHandler` 리스너 등록
- `UIManager.dispatchViewManagerCommand(viewId, 'handleBackPress')`로 네이티브에 위임
- 네이티브 WebView 내부 네비게이션 스택 처리

## SDK 설정 파일

### `app.json` - Expo 플러그인 설정
```json
"plugins": [
  ["@1selfworld/adchain-sdk-react-native/app.plugin", {
    "android": { "appKey": "...", "appSecret": "..." },
    "ios": { "appKey": "...", "appSecret": "..." },
    "environment": "TEST"  // "PROD" 또는 "TEST"
  }]
]
```

플러그인은 prebuild 시 다음을 자동 생성:
- **iOS**: `ios/example/Info.plist`에 `AdChainAppKey`, `AdChainAppSecret`, `AdChainEnvironment` 추가
- **Android**: `android/app/build.gradle`에 `buildConfigField` 추가

### iOS 네이티브 의존성
`ios/Podfile:20`에서 직접 Git Pod 사용:
```ruby
pod 'AdChainSDK', :git => 'https://github.com/1selfworld-labs/adchain-sdk-ios-release.git', :tag => 'v1.0.42'
```

**이유**: CocoaPods Trunk에 퍼블리시되지 않음

### Android 네이티브 의존성
`android/build.gradle:28-29`에서 Maven 저장소 추가:
```gradle
maven { url 'https://releases.adjoe.io/maven' }
```

## 주의사항

### 1. React Native 신규 아키텍처 (New Architecture)
`app.json:9`에서 `"newArchEnabled": true` 활성화됨. 모든 네이티브 코드는 Fabric/TurboModules 호환이어야 함.

### 2. placementId 규칙
- 모달 오퍼월: 임의의 문자열 가능 (예: `"test-placement"`)
- 임베디드 오퍼월: WebView URL에 포함되므로 URL-safe 문자 권장 (예: `"tab_embedded_offerwall"`)

### 3. TypeScript 타입
SDK 타입 정의는 `@1selfworld/adchain-sdk-react-native` 패키지에서 제공. 커스텀 네이티브 뷰는 `AdchainOfferwallView.tsx`에서 인터페이스 정의.

### 4. Android 빌드
- Gradle 버전: `android/build.gradle` 참조
- 최소 SDK: 확인 필요 (`android/app/build.gradle`)
- ProGuard/R8: 릴리스 빌드 시 SDK 난독화 규칙 확인

### 5. 환경 변수
**절대 커밋 금지**:
- `.env` 파일 (사용 시)
- `app.json`의 실제 프로덕션 appKey/appSecret

현재 `app.json`의 값은 테스트용 더미 데이터입니다.

## 테스트

현재 테스트 스크립트 없음. 추가 시:
```bash
npm test
```

## 빌드

### Android APK
```bash
cd android
./gradlew assembleRelease
```
출력: `android/app/build/outputs/apk/release/app-release.apk`

### iOS Archive
Xcode에서:
1. Product → Archive
2. Organizer에서 Export

또는 Fastlane 사용 (설정 필요)

## 패키지 의존성 업데이트

### SDK 업데이트
```bash
npm update @1selfworld/adchain-sdk-react-native
```

**iOS Pod 업데이트도 필요**:
```bash
cd ios
pod update AdChainSDK
cd ..
```

### Expo SDK 업데이트
```bash
npx expo upgrade
```

## 문제 해결

### Metro 번들러 캐시 문제
```bash
npx expo start --clear
```

### Android 빌드 실패
```bash
cd android
./gradlew clean
cd ..
rm -rf android/app/build
```

### iOS Pod 설치 오류
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### 앱이 실행되지만 SDK 초기화 실패
1. `app.json` 플러그인 설정 확인
2. `npx expo prebuild --clean` 재실행 (네이티브 코드 재생성)
3. iOS: Info.plist에 `AdChainAppKey` 존재 확인
4. Android: `build.gradle`에 `ADCHAIN_APP_KEY` 존재 확인
