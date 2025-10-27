# Migration Guide: v1.0.12

## 개요

AdChain SDK v1.0.12부터 Expo 플러그인이 **adjoe Maven 저장소를 자동으로 추가**합니다.
이제 `android/build.gradle`에 수동으로 저장소를 추가할 필요가 없습니다.

## 📋 변경 사항

### 이전 (v1.0.11 이하)

❌ **수동 설정 필요**

`android/build.gradle` 파일을 직접 수정해야 했습니다:

```gradle
allprojects {
  repositories {
    maven { url 'https://www.jitpack.io' }
    maven { url 'https://releases.adjoe.io/maven' }  // ← 수동 추가 필요
  }
}
```

**문제점**:
- `npx expo prebuild` 실행 시 설정이 사라짐
- 새로운 개발자가 빌드 오류를 겪음
- 문서를 놓치면 `adjoe-sdk-android` 의존성 오류 발생

### 현재 (v1.0.12 이상)

✅ **자동 설정**

Expo 플러그인이 prebuild 시 자동으로 추가합니다:

```gradle
allprojects {
  repositories {
    maven { url 'https://releases.adjoe.io/maven' }  // ← 플러그인이 자동 추가
    maven { url(reactNativeAndroidDir) }
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}
```

**장점**:
- ✅ 수동 설정 불필요
- ✅ prebuild 시에도 자동 적용
- ✅ 빌드 오류 방지
- ✅ 새로운 개발자 온보딩 간소화

## 🚀 마이그레이션 단계

### Step 1: SDK 버전 업데이트

```bash
npm install @1selfworld/adchain-sdk-react-native@^1.0.12
```

또는 `package.json` 직접 수정:

```json
{
  "dependencies": {
    "@1selfworld/adchain-sdk-react-native": "^1.0.12"
  }
}
```

### Step 2: 수동 설정 제거 (선택사항)

`android/build.gradle`을 열고 다음 라인을 **제거**합니다:

```diff
allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
-   maven { url 'https://releases.adjoe.io/maven' }  // ← 이 라인 제거
  }
}
```

> **참고**: 제거하지 않아도 동작하지만, 플러그인이 자동으로 추가하므로 중복됩니다.

### Step 3: 네이티브 폴더 재생성

```bash
rm -rf android ios
npx expo prebuild
```

### Step 4: 빌드 확인

**Android**:
```bash
npm run android
# 또는
./run-android.sh
```

**iOS**:
```bash
npm run ios
```

### Step 5: 검증

빌드가 성공하면 `android/build.gradle`을 열어 확인:

```gradle
allprojects {
  repositories {
    maven { url 'https://releases.adjoe.io/maven' }  // ← 플러그인이 추가했는지 확인
    ...
  }
}
```

## 🐛 트러블슈팅

### 문제 1: 빌드 시 adjoe SDK를 찾을 수 없음

**증상**:
```
Could not find io.adjoe:adjoe-sdk-android:3.3.2
```

**해결**:
1. SDK 버전 확인:
   ```bash
   npm list @1selfworld/adchain-sdk-react-native
   # 출력: @1selfworld/adchain-sdk-react-native@1.0.12 이상이어야 함
   ```

2. prebuild 재실행:
   ```bash
   rm -rf android ios
   npx expo prebuild
   ```

3. `android/build.gradle`에 adjoe 저장소가 있는지 확인

### 문제 2: 중복 저장소 경고

**증상**:
빌드는 성공하지만 `android/build.gradle`에 adjoe Maven 저장소가 2번 나타남

**해결**:
수동으로 추가한 라인을 제거하세요. 플러그인이 자동으로 추가합니다.

### 문제 3: 캐시 문제

**증상**:
prebuild 후에도 빌드 실패

**해결**:
```bash
# Android 캐시 클리어
cd android
./gradlew clean
rm -rf .gradle build
cd ..

# Metro 캐시 클리어
npx expo start --clear

# 재빌드
npm run android
```

## 📦 Bare React Native 프로젝트

Expo를 사용하지 않는 Bare React Native 프로젝트에서는 여전히 수동 설정이 필요합니다.

`android/build.gradle`:
```gradle
allprojects {
  repositories {
    maven { url 'https://www.jitpack.io' }
    maven { url 'https://releases.adjoe.io/maven' }  // 수동 추가
  }
}
```

`android/settings.gradle`:
```gradle
dependencyResolutionManagement {
  repositories {
    maven { url 'https://www.jitpack.io' }
  }
}
```

## 🔗 관련 링크

- [v1.0.12 릴리스 노트](https://github.com/1selfworld-labs/adchain-sdk-react-native/releases/tag/v1.0.12)
- [npm 패키지](https://www.npmjs.com/package/@1selfworld/adchain-sdk-react-native)
- [샘플 앱 README](./README.md)
- [이슈 보고](https://github.com/1selfworld-labs/adchain-sdk-react-native/issues)

## ❓ 질문이 있으신가요?

- GitHub Issues: https://github.com/1selfworld-labs/adchain-sdk-react-native/issues
- 기술 지원: contacts@1self.world

---

**업데이트 날짜**: 2025-10-27
