import { useState } from 'react';
import { StyleSheet, Text, View, Button, Platform } from 'react-native';
import AdchainSDK from '@1selfworld/adchain-sdk-react-native';
import Toast from '../components/Toast';

export default function HomeScreen() {
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Toast 상태 관리
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const handleInitialize = async () => {
    if (isInitializing) {
      console.log('[HomeScreen] ⏸️ Already initializing, skipping...');
      return;
    }

    setIsInitializing(true);
    try {
      console.log('[HomeScreen] 🔵 Starting SDK initialization...');

      // 수동 초기화 (app.json 값과 동일)
      const result = await AdchainSDK.initialize({
        appKey: Platform.OS === 'ios' ? '123456784' : '123456783',
        appSecret: 'abcdefghigjk',
        environment: 'TEST'
      });
      console.log('[HomeScreen] ✅ SDK initialized, result:', result);

      // 네이티브 SDK 실제 상태 확인 (재시도 로직)
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 10; // 최대 10회 (2초)

      while (!isReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms 대기
        isReady = await AdchainSDK.isInitialized();
        attempts++;
        console.log(`[HomeScreen] 🔍 Checking SDK status (attempt ${attempts}/${maxAttempts}): ${isReady}`);
      }

      if (isReady) {
        setSdkInitialized(true);
        showToast('SDK initialized!', 'success');
      } else {
        console.error('[HomeScreen] ⚠️ SDK initialization timed out after 2 seconds');
        showToast('SDK initialization is taking longer than expected. Please wait a moment and try login.', 'warning');
      }
    } catch (error: any) {
      console.error('[HomeScreen] ❌ SDK initialization failed:', error);
      showToast(error.message, 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) {
      console.log('[HomeScreen] ⏸️ Already logging in, skipping...');
      return;
    }

    setIsLoggingIn(true);
    try {
      console.log('[HomeScreen] 🔵 Starting login...');

      // 로그인 전에 한 번 더 확인
      const isReady = await AdchainSDK.isInitialized();
      console.log('[HomeScreen] 🔍 Pre-login check - SDK isInitialized:', isReady);

      if (!isReady) {
        showToast('SDK is not ready yet. Please initialize first or wait a moment.', 'error');
        return;
      }

      await AdchainSDK.login({ userId: 'test-user-123' });
      console.log('[HomeScreen] ✅ Login successful');
      setLoggedIn(true);
      showToast('Logged in!', 'success');
    } catch (error: any) {
      console.error('[HomeScreen] ❌ Login failed:', error);
      showToast(error.message, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AdchainSDK.logout();
      setLoggedIn(false);
      showToast('Logged out!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleOpenOfferwall = async () => {
    try {
      await AdchainSDK.openOfferwall('test-placement');
      showToast('Offerwall opened!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <Text style={styles.title}>AdChain Expo SDK Test</Text>

      <Text style={styles.status}>
        SDK: {isInitializing ? '⏳ Initializing...' : sdkInitialized ? '✅ Initialized' : '❌ Not Initialized'}
      </Text>
      <Text style={styles.status}>
        User: {isLoggingIn ? '⏳ Logging in...' : loggedIn ? '✅ Logged In' : '❌ Logged Out'}
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="1. SDK 초기화"
          onPress={handleInitialize}
          disabled={sdkInitialized || isInitializing}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="2. 로그인"
          onPress={handleLogin}
          disabled={!sdkInitialized || loggedIn || isLoggingIn}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          disabled={!sdkInitialized || !loggedIn}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="3. 오퍼월 열기"
          onPress={handleOpenOfferwall}
          disabled={!loggedIn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 15,
    width: '100%',
  },
});
