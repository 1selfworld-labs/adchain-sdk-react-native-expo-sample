#!/bin/bash

# Android 개발 환경 자동 실행 스크립트
# iOS처럼 "한 방에" 실행되도록 자동화

set -e  # 에러 발생 시 중단

echo "🚀 AdChain SDK React Native Example - Android 실행"
echo "=================================================="

# 1. 에뮬레이터 확인
echo ""
echo "📱 Step 1/6: Android 에뮬레이터 확인 중..."
if ! adb devices | grep -q "emulator.*device"; then
  echo "❌ Android 에뮬레이터가 실행 중이지 않습니다!"
  echo ""
  echo "다음 중 하나를 실행해주세요:"
  echo "  1. Android Studio에서 에뮬레이터 실행"
  echo "  2. 명령어로 실행: emulator -avd <AVD_NAME>"
  echo ""
  exit 1
fi
echo "✅ 에뮬레이터 연결됨"

# 2. 기존 Metro 종료
echo ""
echo "🔄 Step 2/6: 기존 Metro 서버 종료 중..."
killall node 2>/dev/null || true
sleep 1
echo "✅ Metro 서버 정리 완료"

# 3. 포트 포워딩 설정
echo ""
echo "🔌 Step 3/6: Metro 포트 포워딩 설정 중..."
adb reverse tcp:8081 tcp:8081
echo "✅ 포트 포워딩 완료 (8081)"

# 4. Metro 서버 시작
echo ""
echo "📦 Step 4/6: Metro 번들러 시작 중..."
npx expo start > /tmp/metro-adchain.log 2>&1 &
METRO_PID=$!
echo "✅ Metro 서버 시작됨 (PID: $METRO_PID)"
sleep 3

# 5. Android 빌드 & 설치
echo ""
echo "🔨 Step 5/6: Android 앱 빌드 & 설치 중..."
cd android
./gradlew assembleDebug --quiet
adb install -r ./app/build/outputs/apk/debug/app-debug.apk
cd ..
echo "✅ 빌드 & 설치 완료"

# 6. 앱 실행
echo ""
echo "🎯 Step 6/6: 앱 실행 중..."
adb shell pm clear adchainexposdk.example > /dev/null 2>&1 || true
sleep 1
adb shell am start -n adchainexposdk.example/.MainActivity > /dev/null 2>&1
echo "✅ 앱 실행됨"

echo ""
echo "=================================================="
echo "✅ Android 앱이 성공적으로 실행되었습니다!"
echo ""
echo "📋 유용한 명령어:"
echo "  • Metro 로그 확인: tail -f /tmp/metro-adchain.log"
echo "  • Android 로그 확인: adb logcat | grep ReactNativeJS"
echo "  • Metro 종료: killall node"
echo "  • 앱 재시작: adb shell am start -n adchainexposdk.example/.MainActivity"
echo ""
echo "💡 팁: 코드 수정 후 Metro가 자동으로 핫 리로드합니다."
echo "=================================================="
