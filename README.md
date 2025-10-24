# AdChain SDK React Native Example

AdChain SDK의 React Native 통합 예제 앱입니다. Expo 환경에서 광고 오퍼월 기능을 구현하는 방법을 데모합니다.

## 📱 주요 기능

### 홈 탭
- **SDK 초기화**: 앱 시작 시 자동으로 AdChain SDK 초기화
- **사용자 로그인/로그아웃**: `AdchainSDK.login()` / `logout()` 호출
- **모달 오퍼월**: `AdchainSDK.openOfferwall()` - 전체 화면 오퍼월 팝업

### 혜택 탭
- **임베디드 오퍼월**: `AdchainOfferwallView` 컴포넌트 - 탭 내부에 직접 임베드
- **WebView ↔ Native 이벤트 브릿지**:
  - `onCustomEvent`: WebView에서 Native로 이벤트 전송 (예: toast, navigation, share)
  - `onDataRequest`: WebView에서 Native 데이터 요청 (예: user_points, user_profile)
- **Android 백버튼 처리**: WebView 내부 네비게이션 스택 자동 처리

## 🚀 빠른 시작

### 1. 설치

```bash
# 의존성 설치
npm ci

# iOS Pod 설치 (macOS만)
cd ios
pod install
cd ..
```

### 2. SDK 설정

`app.json` 파일에서 AdChain SDK 설정:

```json
{
  "expo": {
    "plugins": [
      [
        "@1selfworld/adchain-sdk-react-native/app.plugin",
        {
          "android": {
            "appKey": "YOUR_ANDROID_APP_KEY",
            "appSecret": "YOUR_ANDROID_APP_SECRET"
          },
          "ios": {
            "appKey": "YOUR_IOS_APP_KEY",
            "appSecret": "YOUR_IOS_APP_SECRET"
          },
          "environment": "TEST"  // "PROD" 또는 "TEST"
        }
      ]
    ]
  }
}
```

> ⚠️ **주의**: 실제 앱 개발 시 appKey/appSecret은 환경 변수로 관리하고 `.gitignore`에 추가하세요.

### 3. 실행

#### iOS
```bash
npm run ios
```

#### Android (자동화 스크립트 - 권장)
```bash
./run-android.sh
```

이 스크립트는 다음을 자동으로 처리합니다:
- ✅ 에뮬레이터 연결 확인
- ✅ Metro 서버 시작
- ✅ ADB 포트 포워딩
- ✅ Gradle 빌드 및 APK 설치
- ✅ 앱 실행

#### Android (수동)
```bash
npm run android
```

## 📚 SDK 연동 가이드

### Step 1: SDK 초기화

SDK를 초기화하는 두 가지 방법이 있습니다:

#### 방법 1: 자동 초기화 (권장)

앱 시작 시 `app.json` 설정을 자동으로 읽어 초기화:

```tsx
import AdchainSDK from '@1selfworld/adchain-sdk-react-native';

useEffect(() => {
  AdchainSDK.autoInitialize()
    .then(() => {
      console.log('✅ SDK initialized');
    })
    .catch((error) => {
      console.error('❌ SDK init failed:', error);
    });
}, []);
```

> **참고**: `autoInitialize()`는 `app.json`의 플러그인 설정을 자동으로 읽어 SDK를 초기화합니다.

#### 방법 2: 수동 초기화

특정 시점에 수동으로 초기화하거나 테스트 목적으로 사용:

```tsx
import { Platform } from 'react-native';

const handleInitialize = async () => {
  await AdchainSDK.initialize({
    appKey: Platform.OS === 'ios' ? 'YOUR_IOS_KEY' : 'YOUR_ANDROID_KEY',
    appSecret: 'YOUR_SECRET',
    environment: 'TEST'
  });
  console.log('✅ SDK initialized');
};
```

**참고**: 이 샘플 앱은 **방법 1 (자동 초기화)** 을 사용합니다. `src/App.tsx`를 참고하세요.

### Step 2: 사용자 로그인

오퍼월을 사용하기 전에 사용자를 로그인해야 합니다:

```tsx
const handleLogin = async () => {
  try {
    await AdchainSDK.login({ userId: 'user-12345' });
    console.log('✅ Logged in');
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
};
```

**샘플 앱 구현**: `src/screens/HomeScreen.tsx`

### Step 3-A: 모달 오퍼월 열기

전체 화면 팝업 방식:

```tsx
const handleOpenOfferwall = async () => {
  try {
    await AdchainSDK.openOfferwall('home_button_click');
    console.log('✅ Offerwall opened');
  } catch (error) {
    console.error('❌ Failed to open offerwall:', error);
  }
};
```

**Parameters**:
- `placementId`: 분석 및 트래킹을 위한 배치 ID (예: "home_button_click", "reward_tab")

**샘플 앱 구현**: `src/screens/HomeScreen.tsx`

### Step 3-B: 임베디드 오퍼월 뷰

탭이나 화면 내부에 임베드하는 방식:

```tsx
import { AdchainOfferwallView } from '@1selfworld/adchain-sdk-react-native';

<AdchainOfferwallView
  placementId="benefits_tab_offerwall"
  style={{ flex: 1, width: '100%' }}
  onOfferwallOpened={() => console.log('Offerwall opened')}
  onOfferwallClosed={() => console.log('Offerwall closed')}
  onOfferwallError={(error) => console.error('Error:', error)}
  onRewardEarned={(amount) => console.log('Earned:', amount)}
/>
```

> **중요**: `AdchainOfferwallView`는 SDK 패키지(`@1selfworld/adchain-sdk-react-native`)에서 직접 제공됩니다. 별도로 래퍼 컴포넌트를 만들 필요가 없습니다.

**Props**:
| Prop | Type | Required | 설명 |
|------|------|----------|------|
| `placementId` | `string` | ✅ | 배치 ID |
| `style` | `ViewStyle` | ❌ | 뷰 스타일 |
| `onOfferwallOpened` | `() => void` | ❌ | 오퍼월 열림 콜백 |
| `onOfferwallClosed` | `() => void` | ❌ | 오퍼월 닫힘 콜백 |
| `onOfferwallError` | `(error: string) => void` | ❌ | 에러 콜백 |
| `onRewardEarned` | `(amount: number) => void` | ❌ | 리워드 적립 콜백 |

**샘플 앱 구현**: `src/components/TabNavigation.tsx`

### Step 4: 로그아웃

```tsx
const handleLogout = async () => {
  try {
    await AdchainSDK.logout();
    console.log('✅ Logged out');
  } catch (error) {
    console.error('❌ Logout failed:', error);
  }
};
```

**샘플 앱 구현**: `src/screens/HomeScreen.tsx`

## 🔥 고급 기능: WebView ↔ Native 이벤트 브릿지

AdChain SDK v1.0.41+부터 WebView와 Native 앱 간 양방향 통신을 지원합니다.

### 1. Custom Event (WebView → Native)

WebView에서 Native 앱으로 이벤트를 전송할 수 있습니다:

```tsx
<AdchainOfferwallView
  placementId="benefits_tab"
  onCustomEvent={(eventType, payload) => {
    console.log('Event from WebView:', eventType, payload);

    // 이벤트 타입별 처리
    if (eventType === 'show_toast') {
      Alert.alert('메시지', payload.message);
    } else if (eventType === 'navigate') {
      navigation.navigate(payload.screen);
    } else if (eventType === 'share') {
      Share.share({ title: payload.title, url: payload.url });
    }
  }}
/>
```

**샘플 앱 구현**: `src/components/TabNavigation.tsx`

### 2. Data Request (Native → WebView)

WebView가 Native 앱에 데이터를 요청할 수 있습니다:

```tsx
<AdchainOfferwallView
  placementId="benefits_tab"
  onDataRequest={(requestType, params) => {
    console.log('Data request from WebView:', requestType, params);

    // 요청 타입별 응답
    if (requestType === 'user_points') {
      return { points: 12345, currency: 'KRW' };
    } else if (requestType === 'user_profile') {
      return { userId: 'user-123', nickname: 'Player1', level: 42 };
    } else if (requestType === 'app_version') {
      return { version: '1.0.0', buildNumber: 100 };
    }

    return null; // 데이터 없음
  }}
/>
```

**샘플 앱 구현**: `src/components/TabNavigation.tsx`

**반환값**:
- 데이터가 있으면 객체 반환 → WebView로 전송됨
- 데이터가 없으면 `null` 또는 `undefined` 반환

### 3. Android 백버튼 처리

임베디드 오퍼월에서 Android 백버튼을 WebView 내부 네비게이션에 위임:

```tsx
const offerwallViewRef = useRef(null);

// BackHandler 리스너 등록
useEffect(() => {
  if (Platform.OS !== 'android') return;

  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (activeTab === 'benefits' && offerwallViewRef.current) {
      const viewId = findNodeHandle(offerwallViewRef.current);
      if (viewId) {
        UIManager.dispatchViewManagerCommand(
          viewId,
          'handleBackPress',
          []
        );
        return true; // 기본 동작 막기
      }
    }
    return false; // 기본 동작 허용
  });

  return () => backHandler.remove();
}, [activeTab]);

// Ref 전달
<AdchainOfferwallView
  ref={offerwallViewRef}
  placementId="benefits_tab"
/>
```

**샘플 앱 구현**: `src/components/TabNavigation.tsx`

## 📂 프로젝트 구조

```
adchain-sdk-react-native-example/
├── src/
│   ├── App.tsx                      # 앱 엔트리, SDK 자동 초기화
│   ├── components/
│   │   ├── TabNavigation.tsx        # 홈/혜택 탭 네비게이션, 임베디드 오퍼월
│   │   └── Toast.tsx                # 토스트 알림 컴포넌트
│   └── screens/
│       └── HomeScreen.tsx           # 로그인/로그아웃, 모달 오퍼월
├── android/                         # Android 네이티브 코드
├── ios/                             # iOS 네이티브 코드
├── app.json                         # Expo 설정 (SDK 플러그인 포함)
├── package.json
└── run-android.sh                   # Android 자동 실행 스크립트
```

> **참고**: `AdchainOfferwallView`는 SDK 패키지에서 직접 import합니다. 별도의 래퍼 파일이 필요하지 않습니다.

## 🛠️ 개발 도구

### 로그 확인

**Metro 번들러 로그**:
```bash
tail -f /tmp/metro-adchain.log  # run-android.sh 사용 시
```

**Android 로그**:
```bash
adb logcat | grep ReactNativeJS
```

**iOS 로그**:
- Xcode Console에서 확인

### 캐시 클리어

Metro 번들러 캐시 문제 시:
```bash
npx expo start --clear
```

### Android 빌드 클리어

```bash
cd android
./gradlew clean
cd ..
```

### iOS Pod 재설치

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

## 🔍 트러블슈팅

### SDK 초기화 실패

**증상**: "SDK not initialized" 에러 발생

**해결**:
1. `app.json`의 플러그인 설정 확인 (appKey, appSecret, environment)
2. 네이티브 코드 재생성:
   ```bash
   npx expo prebuild --clean
   ```
3. iOS: Podfile에 AdChainSDK Git Pod이 추가되었는지 확인
   ```bash
   grep "AdChainSDK" ios/Podfile
   ```
4. Android: settings.gradle에 JitPack repository가 추가되었는지 확인
   ```bash
   grep "jitpack" android/settings.gradle
   ```

> **참고**: SDK 플러그인은 iOS Info.plist나 Android build.gradle에 직접 키를 주입하지 않습니다. 대신 `app.json`의 `extra` 필드를 통해 런타임에 설정을 읽습니다.

### Android 빌드 에러

**증상**: Gradle 빌드 실패

**해결**:
1. Android Studio에서 프로젝트 Sync
2. JDK 버전 확인 (JDK 17 권장)
3. Gradle 캐시 클리어:
   ```bash
   cd android
   ./gradlew clean
   rm -rf .gradle build
   cd ..
   ```

### iOS Pod 설치 에러

**증상**: `pod install` 실패

**해결**:
1. CocoaPods 업데이트:
   ```bash
   sudo gem install cocoapods
   ```
2. Pod 캐시 클리어:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock ~/Library/Caches/CocoaPods
   pod install --repo-update
   cd ..
   ```

### Metro 번들러 포트 충돌

**증상**: "Port 8081 already in use"

**해결**:
```bash
killall node
npx expo start
```

### TypeScript 타입 오류

**증상**: `AdchainOfferwallView` import 시 타입 오류

**해결**:
```tsx
// ✅ 올바른 import
import { AdchainOfferwallView } from '@1selfworld/adchain-sdk-react-native';

// ❌ 잘못된 import (파일이 존재하지 않음)
import AdchainOfferwallView from './components/AdchainOfferwallView';
```

## 📖 API Reference

### AdchainSDK

| Method | Parameters | Return | 설명 |
|--------|-----------|--------|------|
| `autoInitialize()` | - | `Promise<void>` | SDK 자동 초기화 (app.json 읽음) |
| `initialize(config)` | `{ appKey, appSecret, environment }` | `Promise<void>` | SDK 수동 초기화 |
| `login(params)` | `{ userId: string }` | `Promise<void>` | 사용자 로그인 |
| `logout()` | - | `Promise<void>` | 사용자 로그아웃 |
| `openOfferwall(placementId)` | `placementId: string` | `Promise<void>` | 모달 오퍼월 열기 |
| `isInitialized()` | - | `Promise<boolean>` | SDK 초기화 상태 확인 |
| `isLoggedIn()` | - | `Promise<boolean>` | 로그인 상태 확인 |

### AdchainOfferwallView

| Prop | Type | Required | 설명 |
|------|------|----------|------|
| `placementId` | `string` | ✅ | 배치 ID |
| `style` | `ViewStyle` | ❌ | 뷰 스타일 |
| `onOfferwallOpened` | `() => void` | ❌ | 오퍼월 열림 콜백 |
| `onOfferwallClosed` | `() => void` | ❌ | 오퍼월 닫힘 콜백 |
| `onOfferwallError` | `(error: string) => void` | ❌ | 에러 콜백 |
| `onRewardEarned` | `(amount: number) => void` | ❌ | 리워드 적립 콜백 |
| `onCustomEvent` | `(eventType: string, payload: any) => void` | ❌ | WebView 커스텀 이벤트 콜백 |
| `onDataRequest` | `(requestType: string, params: any) => any` | ❌ | WebView 데이터 요청 콜백 |

## 🎯 placementId 가이드

`placementId`는 사용자가 오퍼월에 진입한 경로를 추적하기 위한 식별자입니다.

**권장 네이밍**:
```
{screen}_{ui_element}_{action}
```

**예시**:
- `home_button_click` - 홈 화면의 버튼 클릭
- `benefits_tab_embedded` - 혜택 탭의 임베디드 뷰
- `profile_reward_banner` - 프로필 화면의 리워드 배너
- `daily_mission_completed` - 일일 미션 완료 후

## 📦 Dependencies

- **AdChain SDK**: `@1selfworld/adchain-sdk-react-native` ^1.0.11
- **Expo**: ~53.0.0
- **React Native**: 0.79.6
- **React**: 19.0.0
- **TypeScript**: ~5.8.3

## 💡 추가 리소스

### Toast 컴포넌트

이 샘플 앱은 사용자 피드백을 위한 간단한 토스트 알림 컴포넌트를 포함합니다:

```tsx
// src/components/Toast.tsx
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Dimensions } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

// ... 구현 내용은 src/components/Toast.tsx 참고
```

**사용 예시**:
```tsx
const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

<Toast
  visible={toast.visible}
  message={toast.message}
  type={toast.type}
  onHide={() => setToast({ ...toast, visible: false })}
/>

// Toast 표시
setToast({ visible: true, message: 'Logged in!', type: 'success' });
```

### SDK 플러그인 동작 방식

AdChain SDK 플러그인은 다음 작업을 자동으로 수행합니다:

1. **withAdchainConfig**: `app.json`의 `extra` 필드에 SDK 설정 주입
2. **withAdchainIOS**:
   - Podfile에 AdChainSDK Git Pod 추가
   - Info.plist에 NSUserTrackingUsageDescription 추가
3. **withAdchainAndroid**:
   - settings.gradle에 JitPack repository 추가

검증 방법:
```bash
# iOS
cat ios/Podfile | grep AdChainSDK

# Android
cat android/settings.gradle | grep jitpack
```

## 📄 License

이 예제 앱은 MIT 라이선스로 제공됩니다.

## 🤝 Support

문제가 발생하거나 질문이 있으신 경우:
1. [GitHub Issues](https://github.com/1selfworld-labs/adchain-sdk-react-native-expo-sample/issues)에 문의
2. [SDK 문서](https://github.com/1selfworld-labs/adchain-sdk-react-native) 확인
3. 기술 지원팀 연락: contacts@1self.world

---

**Made with ❤️ by AdChain Team**
