안녕하세요. 주신 샘플 내용 확인하고 현재 똑닥 앱 구조에서 추가 수정이 필요한 부분 확인해서 가이드 드립니다.
보시면서, 궁금하신 점이나 애매한 내용 있으시면 언제든지 알려주세요.


1. SafeArea 처리
현재 TEST앱을 실행하면, 혜택 탭에 들어갈때 AOS의 경우 상단이 위쪽으로 너무 붙어서 출력되는 이슈가 있습니다.
그래서, 저희 샘플앱에서는 SafeArea와 관련된 처리를 적용하였는데, 내용 한번 확인 부탁드리고, 적용이 가능할지 체크 부탁드립니다.
IOS/AOS 모두 적용되는게 좋을 것 같습니다.


# AdChain SDK React Native - 개발자 가이드

> **실전 적용 가이드**: SDK 통합 시 필수 구현 사항과 샘플 코드 참조 위치를 안내합니다.

**최종 업데이트**: 2025-10-29

---

## 📑 목차

1. [SafeArea 처리](#1-safearea-처리)
2. [Android 백버튼 처리](#2-android-백버튼-처리)
3. [SDK 초기화 시점](#3-sdk-초기화-시점)
4. [광고추적 ID (IDFA/GAID)](#4-광고추적-id-idfagaid)
5. [로그인 (사용자 정보 전달)](#5-로그인-사용자-정보-전달)
6. [탭 전환 시 리프레시](#6-탭-전환-시-리프레시)
7. [WebView 양방향 통신](#7-webview-양방향-통신)
8. [구현 상태 요약](#8-구현-상태-요약)

---

## 1. SafeArea 처리

### ⚠️ 중요: 오퍼월 뷰에 SafeArea 중복 적용 금지

### 문제
AdchainOfferwallView를 별도 SafeAreaView로 감싸면 레이아웃 충돌 발생

---

### 패턴 1: 전체 앱 SafeArea (현재 샘플 방식)

#### 올바른 구조

```typescript
// App.tsx (최상위)
<SafeAreaProvider>
  <SafeAreaView style={{ flex: 1 }}>
    <TabNavigation />  {/* 여기서 오퍼월 포함 */}
  </SafeAreaView>
</SafeAreaProvider>

// TabNavigation.tsx (오퍼월 배치)
<View style={styles.container}>
  <AdchainOfferwallView
    style={{ flex: 1, width: '100%' }}
    placementId="tab_embedded_offerwall"
    // ❌ SafeAreaView로 감싸지 않음
  />
</View>
```

#### 잘못된 구조 (피해야 함)

```typescript
// ❌ 중복 SafeArea
<SafeAreaView>  {/* 최상위 */}
  <SafeAreaView>  {/* 오퍼월 탭 */}
    <AdchainOfferwallView />  {/* 레이아웃 깨짐 */}
  </SafeAreaView>
</SafeAreaView>
```

**샘플 코드**:
- `src/App.tsx:7-12` (SafeAreaProvider + SafeAreaView)
- `src/components/TabNavigation.tsx:44-50` (오퍼월 직접 배치, SafeArea 없음)

---

### 패턴 2: 탭별 SafeArea 적용 (권장 - 웹뷰 최적화)

> ✅ **가능 여부**: 탭별 독립 SafeArea 적용 **가능**하며, 오히려 웹뷰의 경우 더 권장됩니다.

#### 방법 A: Benefits 탭에만 SafeArea 추가

```typescript
// App.tsx - SafeAreaView 제거
import { SafeAreaProvider } from 'react-native-safe-area-context';

<SafeAreaProvider>
  <View style={{ flex: 1 }}>  {/* ← SafeAreaView 제거 */}
    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    <TabNavigation />
  </View>
</SafeAreaProvider>

// TabNavigation.tsx - 탭별 SafeArea 적용
import { SafeAreaView } from 'react-native-safe-area-context';

{activeTab === 'benefits' ? (
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    {/* ⬆️ 상단/좌우만 SafeArea (하단은 탭바가 처리) */}
    <AdchainOfferwallView
      style={{ flex: 1, width: '100%' }}
      placementId="tab_embedded_offerwall"
    />
  </SafeAreaView>
) : (
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    {/* Home 탭도 동일한 SafeArea 적용 */}
    <ScrollView>
      <HomeScreen />
    </ScrollView>
  </SafeAreaView>
)}
```

**장점**:
- iOS 노치/Dynamic Island 영역 정확히 회피
- Android 상태바/네비게이션 바 영역 보호
- 탭바는 자연스럽게 하단 SafeArea 차지
- 탭별로 SafeArea 정책 개별 제어 가능

#### 방법 B: edges prop으로 세밀 제어

```typescript
// Benefits 탭 - 상단만 SafeArea
<SafeAreaView style={{ flex: 1 }} edges={['top']}>
  <AdchainOfferwallView style={{ flex: 1, width: '100%' }} />
</SafeAreaView>

// Home 탭 - 전체 SafeArea
<SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
  <ScrollView><HomeScreen /></ScrollView>
</SafeAreaView>

// 전체 화면 모달 - SafeArea 무시
<SafeAreaView style={{ flex: 1 }} edges={[]}>
  <AdchainOfferwallView style={{ flex: 1, width: '100%' }} />
</SafeAreaView>
```

#### edges prop 상세 설명

| edge | 적용 영역 | 예시 (iOS) | 예시 (Android) |
|------|-----------|-----------|----------------|
| `top` | 상단 | 노치, Dynamic Island, 상태바 | 상태바 |
| `bottom` | 하단 | 홈 인디케이터 | 네비게이션 바 |
| `left` | 왼쪽 | 랜드스케이프 노치 (왼쪽) | - |
| `right` | 오른쪽 | 랜드스케이프 노치 (오른쪽) | - |

**기본값** (생략 시): `['top', 'bottom', 'left', 'right']` (전체)

---

### 고객 앱 적용 시 확인 사항

#### 1. 전체 앱 구조 확인 (App.tsx 또는 루트 컴포넌트)

```typescript
// ✅ 확인 1: SafeAreaProvider 존재 여부
<SafeAreaProvider>
  {/* 앱 전체 */}
</SafeAreaProvider>

// ✅ 확인 2: SafeAreaView 위치 및 개수
// - 최상위에만 있는가?
// - 여러 곳에 중복되어 있는가?

// ✅ 확인 3: 네비게이션 구조
// - React Navigation Stack?
// - React Navigation Tabs?
// - 커스텀 탭 구현?
```

#### 2. 혜택 탭 구현 확인

```typescript
// ✅ 확인 4: 탭 컴포넌트 계층 구조
// - SafeAreaView가 몇 겹으로 중첩되어 있는가?
// - AdchainOfferwallView는 어디에 배치되는가?

// ✅ 확인 5: 레이아웃 스타일
// - flex: 1 사용 여부
// - 절대 위치(absolute) 사용 여부
// - 부모 컨테이너 크기 제약
```

#### 3. 문제 진단

| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| 상단이 위쪽에 붙음 (Android) | SafeArea 없음 | 패턴 2 적용 (`edges={['top']}`) |
| 하단이 잘림 (iPhone X 이상) | 하단 SafeArea 없음 | `edges={['top', 'bottom']}` |
| 좌우 여백이 너무 큼 | 중복 SafeArea | SafeAreaView 중복 제거 |
| 웹뷰가 화면 일부만 차지 | flex 누락 | `style={{ flex: 1, width: '100%' }}` |

---

### 권장 패턴 요약

#### ✅ 단일 네비게이션 앱 (현재 샘플)
→ **패턴 1** 사용 (전체 앱 SafeArea)

#### ✅ React Navigation Tabs + 여러 화면
→ **패턴 2 방법 A** 사용 (탭별 SafeArea, `edges={['top', 'left', 'right']}`)

#### ✅ 웹뷰 전용 화면 (전체 화면 오퍼월)
→ **패턴 2 방법 B** 사용 (`edges={['top']}` 또는 `edges={[]}`)

---

### 실전 예제: React Navigation 통합

```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      {/* ⬇️ SafeAreaView 없음 (각 화면에서 개별 적용) */}
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Benefits" component={BenefitsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// BenefitsScreen.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdchainOfferwallView } from '@1selfworld/adchain-sdk-react-native';

export default function BenefitsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      {/* ⬆️ 상단/좌우만 SafeArea, 하단은 Tab.Navigator가 처리 */}
      <AdchainOfferwallView
        style={{ flex: 1, width: '100%' }}
        placementId="tab_embedded_offerwall"
      />
    </SafeAreaView>
  );
}

// HomeScreen.tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      {/* Home 화면도 동일한 패턴 */}
      <ScrollView>
        {/* 콘텐츠 */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 2. Android 백버튼 처리

### 문제
WebView 내부 페이지 탐색 후 백버튼 누르면 앱이 종료됨

### ⚠️ 주의: 첫 페이지에서 백버튼 처리
Benefits 탭에서 백버튼을 무조건 막으면, 사용자가 첫 페이지에서도 앱 종료를 못 하는 문제 발생

---

### ✅ 권장 해결 방법 (v1.0.42+)

네이티브 SDK가 WebView 상태를 확인하고 이벤트로 알려주는 방식:

```typescript
const [shouldAllowExit, setShouldAllowExit] = useState(false);

// BackHandler 등록
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (activeTab === 'benefits') {
      const viewId = findNodeHandle(offerwallViewRef.current);
      if (viewId) {
        UIManager.dispatchViewManagerCommand(viewId, 'handleBackPress', []);
        return true; // 일단 막고, 네이티브 이벤트로 판단
      }
    }
    return false;
  });
  return () => backHandler.remove();
}, [activeTab]);

// 앱 종료 처리
useEffect(() => {
  if (shouldAllowExit) {
    setTimeout(() => BackHandler.exitApp(), 100);
  }
}, [shouldAllowExit]);

// View에 이벤트 핸들러 연결
<AdchainOfferwallView
  ref={offerwallViewRef}
  placementId="tab_embedded_offerwall"
  onBackPressOnFirstPage={() => {
    // WebView가 첫 페이지일 때만 호출됨
    console.log('첫 페이지에서 백버튼 → 앱 종료');
    setShouldAllowExit(true);
  }}
  onBackNavigated={() => {
    // WebView가 뒤로 갔을 때 호출됨
    console.log('WebView 뒤로가기 성공');
    setShouldAllowExit(false);
  }}
/>
```

**동작 원리**:
1. 백버튼 누름 → `handleBackPress` 명령 전송
2. 네이티브에서 WebView 스택 확인:
   - 스택 1개 (첫 페이지) → `onBackPressOnFirstPage` 이벤트 발생
   - 스택 2개 이상 → `onBackNavigated` 이벤트 발생
3. React Native에서 이벤트 받아 앱 종료 여부 결정

**장점**:
- ✅ 정확한 WebView 상태 반영
- ✅ 네이티브에서 판단하므로 타이밍 이슈 없음
- ✅ Activity 스타일과 동일한 UX

---

### 📊 Activity vs View 백버튼 처리 비교

| 방식 | 백버튼 처리 | 첫 페이지 판단 | 앱 종료 |
|------|-------------|----------------|---------|
| **Activity** (모달) | 자동 (`onBackPressed`) | ✅ `webView.canGoBack()` | ✅ 자동 |
| **View** (임베디드) - 이전 | 수동 (`BackHandler`) | ❌ 불가능 | ❌ 막힘 |
| **View** (임베디드) - v1.0.42+ | 수동 + 이벤트 | ✅ 이벤트로 전달 | ✅ 가능 |

**샘플 코드**: `src/components/TabNavigation.tsx:21-73`

---

## 3. SDK 초기화 시점

### 권장 방법
앱 시작 시 자동 초기화 (샘플은 데모용 버튼 방식 사용)

### 적용 코드

```typescript
// App.tsx에서 앱 시작 시
useEffect(() => {
  const initSDK = async () => {
    await AdchainSDK.initialize({
      appKey: Platform.OS === 'ios' ? 'YOUR_IOS_KEY' : 'YOUR_ANDROID_KEY',
      appSecret: 'YOUR_SECRET',
      environment: __DEV__ ? 'TEST' : 'PROD'
    });

    // 중복 초기화 방지
    const isReady = await AdchainSDK.isInitialized();
    if (!isReady) {
      console.error('SDK initialization failed');
    }
  };
  initSDK();
}, []);
```

### 설정 파일

`app.json` 플러그인 설정 (prebuild 시 네이티브 코드 생성):

```json
{
  "plugins": [
    ["@1selfworld/adchain-sdk-react-native/app.plugin", {
      "android": { "appKey": "...", "appSecret": "..." },
      "ios": { "appKey": "...", "appSecret": "..." },
      "environment": "PRODUCTION"
    }]
  ]
}
```

**주의**: app.json과 코드의 키 값을 동일하게 유지

**샘플 코드**: `src/screens/HomeScreen.tsx:84-127` (폴링 방식 완료 확인 참조)

---

## 4. 광고추적 ID (IDFA/GAID)

### ⚠️ 현재 상태
iOS 권한 문구만 존재, 실제 요청 코드 없음

### 필수 작업

#### iOS ATT 권한 요청

```bash
npm install react-native-tracking-transparency
```

```typescript
// HomeScreen.tsx의 handleInitialize 함수 내
import { requestTrackingPermission } from 'react-native-tracking-transparency';

if (Platform.OS === 'ios') {
  const trackingStatus = await requestTrackingPermission();
  console.log('Tracking permission:', trackingStatus);
}
```

#### Android 광고 ID 권한

`android/app/src/main/AndroidManifest.xml`에 추가:

```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
```

#### iOS Privacy Manifest 수정

`ios/example/PrivacyInfo.xcprivacy`:

```xml
<key>NSPrivacyTracking</key>
<true/>  <!-- false → true로 변경 -->
```

### 참고
- 대부분의 광고 SDK는 내부적으로 IDFA/GAID를 자동 수집
- 위 권한 설정만으로 충분할 수 있음 (SDK 문서 확인 필요)

**샘플 코드**: `ios/example/Info.plist:47-48` (권한 문구 참조)

---

## 5. 로그인 (사용자 정보 전달)

### 목적
- 맞춤형 광고 추천 (성별/나이 기반)
- 리워드 적립 (userId 기반)
- 중복 참여 방지

### 적용 코드

```typescript
// 기존 앱 로그인 완료 후
await AdchainSDK.login({
  userId: userInfo.id,
  gender: userInfo.gender === 'M' ? 'MALE' : 'FEMALE',
  birthYear: new Date(userInfo.birthDate).getFullYear()
});

// 로그아웃 시
await AdchainSDK.logout();
```

### 익명 사용자 지원

```typescript
import DeviceInfo from 'react-native-device-info';

const deviceId = await DeviceInfo.getUniqueId();
await AdchainSDK.login({
  userId: `anon_${deviceId}`,
  gender: 'MALE',  // 기본값
  birthYear: 1990  // 기본값
});
```

### 주의사항
- userId에 이메일, 전화번호 등 민감 정보 사용 금지
- 앱 로그아웃 시 SDK도 로그아웃 필수 (다른 사용자 리워드 적립 방지)

**샘플 코드**: `src/screens/HomeScreen.tsx:129-190` (로그인), `253-293` (UI 폼)

---

## 6. 탭 전환 시 리프레시

### ❌ 현재 상태
미구현 (탭 전환 시 오퍼월이 이전 상태 유지)

### 구현 방법

#### Option A: useEffect 리프레시 (권장)

```typescript
const TabNavigation = () => {
  const [activeTab, setActiveTab] = useState('home');
  const offerwallViewRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'benefits' && offerwallViewRef.current) {
      const viewId = findNodeHandle(offerwallViewRef.current);
      if (viewId && Platform.OS === 'android') {
        UIManager.dispatchViewManagerCommand(
          viewId,
          'loadOfferwall',
          ['tab_embedded_offerwall']
        );
      }
    }
  }, [activeTab]);

  return (
    // ...JSX
  );
};
```

#### Option B: key prop으로 리마운트

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const handleTabChange = (tab) => {
  if (tab === 'benefits') {
    setRefreshKey(prev => prev + 1);
  }
  setActiveTab(tab);
};

<AdchainOfferwallView
  key={refreshKey}  // key 변경 시 컴포넌트 재생성
  {...props}
/>
```

### 주의사항
- 과도한 리프레시 방지 (쿨다운 타이머 30초 권장)
- iOS 동작 확인 필요 (샘플은 Android 위주)

**샘플 코드**: `src/components/TabNavigation.tsx:111, 119` (탭 전환 로직)

---

## 7. WebView 양방향 통신

### 개요
- **WebView → App**: `onCustomEvent` (사용자 액션, 네비게이션 요청)
- **App → WebView**: `onDataRequest` (포인트, 프로필 정보)

### 적용 코드

```typescript
<AdchainOfferwallView
  // WebView → App 이벤트 수신
  onCustomEvent={(eventType, payload) => {
    if (eventType === 'show_toast') {
      Toast.show({ text1: payload.message });
    }
    else if (eventType === 'navigate') {
      navigation.navigate(payload.screen, payload.params);
    }
    else if (eventType === 'share') {
      Share.open({ title: payload.title, url: payload.url });
    }
    else if (eventType === 'reward_earned') {
      updateUserPoints(payload.userId, payload.amount);
    }
  }}

  // App → WebView 데이터 제공
  onDataRequest={(requestType) => {
    if (requestType === 'user_points') {
      return { points: userPoints, currency: 'KRW' };
    }
    if (requestType === 'user_profile') {
      return { userId, nickname, level };
    }
    return null;
  }}
/>
```

### 지원 이벤트 타입
- `show_toast`: 토스트 메시지
- `navigate`: 화면 이동
- `share`: 공유 기능
- `reward_earned`: 리워드 적립 (커스텀)

### 보안 주의사항

```typescript
// 허용된 이벤트만 처리
const ALLOWED_EVENTS = ['show_toast', 'navigate', 'share', 'reward_earned'];

onCustomEvent={(eventType, payload) => {
  if (!ALLOWED_EVENTS.includes(eventType)) {
    console.warn('Unauthorized event:', eventType);
    return;
  }
  // 처리 로직
}}

// 민감 정보 노출 금지
onDataRequest={(requestType) => {
  // ❌ 금지: 비밀번호, API 토큰, 결제 정보
  // ✅ 허용: 포인트, 공개 프로필 정보
}}
```

**샘플 코드**: `src/components/TabNavigation.tsx:54-98` (Alert로 데모)

---

## 8. 구현 상태 요약

| 항목 | 상태 | 샘플 코드 위치 | 우선순위 |
|------|------|----------------|----------|
| **SafeArea 처리** | ✅ 완전 구현 | `App.tsx:7-12`, `TabNavigation.tsx:44-50` | **높음** |
| **Android 백버튼** | ✅ 완전 구현 | `TabNavigation.tsx:21-39` | 낮음 |
| **SDK 초기화** | ✅ 완전 구현 | `HomeScreen.tsx:84-127` | 낮음 |
| **광고추적 ID** | ⚠️ 부분 구현 | `Info.plist:47-48` | **높음** |
| **로그인** | ✅ 완전 구현 | `HomeScreen.tsx:129-190` | 낮음 |
| **탭 전환 리프레시** | ❌ 미구현 | - | **높음** |
| **WebView 통신** | ✅ 완전 구현 | `TabNavigation.tsx:54-98` | 중간 |

### 범례
- ✅ 완전 구현: 실제 앱 적용 가능
- ⚠️ 부분 구현: 핵심 로직 누락
- ❌ 미구현: 새로 작성 필요

---

## 우선순위별 작업

### 🔴 높음 (필수)
1. **광고추적 ID 완전 구현** (1-2시간)
   - iOS ATT 권한 요청 코드
   - Android AD_ID 권한 추가
2. **탭 전환 리프레시** (2-3시간)
   - useEffect로 리프레시 로직 추가
   - 쿨다운 타이머 설정

### 🟡 중간 (권장)
3. **WebView 이벤트 고도화** (3-4시간)
   - Alert → Toast/Modal
   - React Navigation 연동
   - Share API 구현

### 🟢 낮음 (선택)
4. **SDK 초기화 개선** (2-3시간)
   - App.tsx 자동 초기화
   - 환경별 설정 분리

---

## 샘플 앱 실행

```bash
# iOS
npm ci
cd ios && pod install && cd ..
npm run ios

# Android
npm ci
./run-android.sh
```

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-10-29
