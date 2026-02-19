# CLAUDE.md

## ⚠️ 절대 원칙
- 이 워커는 할당된 디렉토리 내에서만 파일을 수정한다
- 다른 레포의 파일은 읽기만 가능하며, 수정이 필요하면 오케스트레이터에게 보고한다

## Team Context
- **Worker ID**: `expo-sample`
- **Orchestrator**: 상위 디렉토리 (`adchain-sdk/`)
- **담당 범위**: `adchain-sdk-react-native-expo-sample/` (전체)
- **Upstream**: `adchain-sdk-react-native` (npm 의존성), `adchain-sdk-ios-release` (Expo Config Plugin이 자동 참조)
- **Downstream**: 없음 (최종 소비자)

### Agent Teams 프로토콜
- 팀 설정 파일: `~/.claude/teams/adchain-sdk/config.json`에서 팀원 목록 확인
- 작업 확인: TaskList → TaskGet으로 할당된 작업의 상세 내용 확인
- 작업 시작: TaskUpdate(status: "in_progress") → 작업 수행
- 작업 완료: TaskUpdate(status: "completed") → TaskList로 다음 작업 확인
- 오케스트레이터 보고: SendMessage(type: "message", recipient: "team-lead", content: "...", summary: "...")
- 다른 워커 문의: SendMessage(type: "message", recipient: "{워커-name}", content: "...", summary: "...")
- 종료 요청 수신 시: SendMessage(type: "shutdown_response", request_id: "{id}", approve: true)

---

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
  await AdchainSDK.initialize({
    appKey: Platform.OS === 'ios' ? '123456784' : '123456783',
    appSecret: 'abcdefghigjk',
    environment: 'TEST'
  });
  // 수동 초기화 방식 사용 (app.json 값과 동일)
  // 네이티브 SDK 상태 확인 후 UI 업데이트
};
```

사용자가 "SDK 초기화" 버튼을 눌러 명시적으로 SDK를 활성화합니다.
App.tsx에서는 어떠한 초기화도 수행하지 않습니다.

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

### iOS 네이티브 의존성 (🚨 중요)

**❌ 절대 수동으로 Podfile을 수정하지 마세요!**

iOS 네이티브 SDK는 **Expo Config Plugin이 자동으로 관리**합니다:

```javascript
// node_modules/@1selfworld/adchain-sdk-react-native/plugin/src/withAdchainIOS.js
// Expo Config Plugin이 prebuild 시 자동으로 Podfile에 추가
pod 'AdChainSDK', :git => 'https://github.com/1selfworld-labs/adchain-sdk-ios-release.git', :tag => 'v1.0.46'
```

**작동 방식**:
1. `@1selfworld/adchain-sdk-react-native` 패키지 설치
2. `npx expo prebuild` 실행
3. Expo Config Plugin (`withAdchainIOS`)이 자동으로 iOS SDK 버전을 Podfile에 주입
4. 각 React Native SDK 버전마다 대응하는 iOS SDK 버전이 플러그인에 하드코딩되어 있음

**버전 매핑** (README 참조):
- React Native SDK v1.0.21 → iOS SDK v1.0.47 (자동)
- React Native SDK v1.0.20 → iOS SDK v1.0.47 (자동)
- React Native SDK v1.0.19 → iOS SDK v1.0.46 (자동)
- React Native SDK v1.0.18 → iOS SDK v1.0.46 (자동)
- React Native SDK v1.0.17 → iOS SDK v1.0.45 (자동)
- React Native SDK v1.0.15 → iOS SDK v1.0.45 (자동)

**올바른 작업 흐름**:
```bash
# 1. React Native SDK 버전 변경
npm install @1selfworld/adchain-sdk-react-native@1.0.18

# 2. Expo prebuild로 네이티브 프로젝트 재생성 (플러그인 자동 실행)
npx expo prebuild --platform ios --clean

# 3. 확인: Podfile에 iOS SDK v1.0.46이 자동 추가되었는지 확인
cat ios/Podfile | grep AdChainSDK
```

**잘못된 작업 흐름** (절대 금지):
```bash
# ❌ Podfile을 직접 수정하지 마세요!
# ❌ pod 'AdChainSDK', :tag => 'v1.0.XX'를 수동으로 추가/변경하지 마세요!
# ❌ 플러그인과 수동 설정이 충돌합니다!
```

**이유**:
- CocoaPods Trunk에 AdChainSDK가 퍼블리시되지 않아 Git Pod 방식 사용
- 버전 관리를 Expo Config Plugin에 위임하여 React Native SDK ↔ iOS SDK 호환성 보장
- 수동 수정 시 SDK 버전 불일치로 빌드 실패 가능

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

### SDK 업데이트 (🚨 올바른 절차)

**1. React Native SDK 업데이트**:
```bash
npm install @1selfworld/adchain-sdk-react-native@latest
# 또는 특정 버전
npm install @1selfworld/adchain-sdk-react-native@1.0.18
```

**2. Expo Prebuild 재실행** (iOS SDK 자동 업데이트):
```bash
npx expo prebuild --platform ios --clean
```

**3. 확인**:
```bash
# React Native SDK 버전 확인
npm list @1selfworld/adchain-sdk-react-native

# iOS SDK 버전 확인 (Podfile.lock)
cat ios/Podfile.lock | grep "AdChainSDK ("
```

**❌ 잘못된 방법**:
```bash
# ❌ pod update AdChainSDK를 직접 실행하지 마세요!
# ❌ Expo Config Plugin이 관리하므로 수동 업데이트 불필요
cd ios
pod update AdChainSDK  # 절대 금지!
```

**이유**: React Native SDK 버전과 iOS SDK 버전이 불일치하면 빌드 실패합니다.

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

---

## 🎓 Lessons Learned (AI 작업 시 주의사항)

### 1. iOS SDK 의존성은 절대 수동으로 건드리지 마세요!

**핵심 원칙**:
> **Expo Config Plugin이 자동으로 iOS SDK 버전을 Podfile에 추가합니다.**

**흔한 실수**:
```bash
# ❌ 잘못된 접근
cd ios
vim Podfile  # AdChainSDK 버전을 직접 수정
pod install
```

**올바른 접근**:
```bash
# ✅ 올바른 접근
npm install @1selfworld/adchain-sdk-react-native@1.0.18
npx expo prebuild --platform ios --clean  # 플러그인이 자동으로 v1.0.46 추가
```

**왜 이렇게 해야 하나요?**
1. React Native SDK와 iOS 네이티브 SDK 버전이 강하게 결합되어 있습니다
2. 각 React Native SDK 버전은 특정 iOS SDK 버전을 요구합니다 (예: v1.0.18 → v1.0.46)
3. Expo Config Plugin (`withAdchainIOS`)이 이 매핑을 관리합니다
4. 수동으로 Podfile을 수정하면 버전 불일치로 빌드 실패가 발생합니다

**자동화 흐름**:
```
npm install v1.0.18
    ↓
npx expo prebuild
    ↓
withAdchainIOS 플러그인 실행
    ↓
Podfile에 v1.0.46 자동 주입
    ↓
pod install 자동 실행
    ↓
✅ 정확한 버전 설치 완료
```

### 2. Podspec 파일의 한계 이해하기

`adchain-sdk-react-native.podspec`에는 버전이 명시되지 않습니다:
```ruby
s.dependency "AdChainSDK"  # 버전 없음!
```

**이유**: CocoaPods Trunk에 AdChainSDK가 퍼블리시되지 않아 Git Pod 방식을 사용해야 하는데, podspec에서는 Git Pod를 지정할 수 없습니다. 따라서 Expo Config Plugin이 Podfile을 직접 수정하는 방식으로 구현되었습니다.

### 3. 버전 업데이트 체크리스트

React Native SDK를 업데이트할 때:

```bash
# 1. React Native SDK 버전 변경
npm install @1selfworld/adchain-sdk-react-native@1.0.18

# 2. node_modules 캐시 문제 방지 (선택적)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 3. Expo prebuild로 네이티브 재생성
npx expo prebuild --platform ios --clean

# 4. 버전 확인
cat ios/Podfile | grep AdChainSDK
# 출력: pod 'AdChainSDK', :git => '...', :tag => 'v1.0.46'

cat ios/Podfile.lock | grep "AdChainSDK ("
# 출력: AdChainSDK (1.0.46)

# 5. 빌드
npx expo run:ios --no-bundler
npx expo run:android --no-bundler
```

### 4. 디버깅 팁

**iOS SDK 버전 불일치 의심 시**:
```bash
# 현재 설치된 iOS SDK 버전 확인
cat ios/Podfile.lock | grep -A5 "AdChainSDK"

# React Native SDK가 요구하는 버전 확인
cat node_modules/@1selfworld/adchain-sdk-react-native/README.md | grep -A10 "버전 호환성"

# 플러그인이 추가하는 버전 확인
cat node_modules/@1selfworld/adchain-sdk-react-native/plugin/src/withAdchainIOS.js | grep "tag.*v"
```

**빌드 실패 시 첫 번째 체크포인트**:
1. Podfile에 AdChainSDK가 2번 선언되어 있지 않은가? (수동 + 플러그인 중복)
2. iOS SDK 버전이 README의 "버전 호환성" 표와 일치하는가?
3. `npx expo prebuild --clean`을 최근에 실행했는가?

---

**기억하세요**:
> "Podfile을 직접 수정하고 싶은 충동이 들면, 먼저 Expo Config Plugin을 확인하세요!"
