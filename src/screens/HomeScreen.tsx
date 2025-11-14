import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdchainSDK from '@1selfworld/adchain-sdk-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from '../components/Toast';

interface LoginData {
  userId: string;
  gender: 'MALE' | 'FEMALE';
  birthYear: number;
}

const STORAGE_KEY = 'ADCHAIN_LOGIN_DATA_EXPO';

export default function HomeScreen() {
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Login form fields
  const [userId, setUserId] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [birthYear, setBirthYear] = useState('1990');

  // Toast 상태 관리
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Load saved login data and sync SDK state on mount
  useEffect(() => {
    initializeComponentState();
  }, []);

  const initializeComponentState = async () => {
    // 1. Load saved login data
    await loadSavedLoginData();

    // 2. Sync SDK state (for tab navigation state persistence)
    try {
      const isInit = await AdchainSDK.isInitialized();
      const isLoggedInSDK = await AdchainSDK.isLoggedIn();

      console.log('[HomeScreen] 🔄 Syncing SDK state - isInitialized:', isInit, ', isLoggedIn:', isLoggedInSDK);

      setSdkInitialized(isInit);
      setLoggedIn(isLoggedInSDK);
    } catch (error) {
      console.error('[HomeScreen] Failed to sync SDK state:', error);
    }
  };

  const loadSavedLoginData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const loginData: LoginData = JSON.parse(savedData);
        setUserId(loginData.userId);
        setGender(loginData.gender);
        setBirthYear(loginData.birthYear.toString());
        console.log('[HomeScreen] Loaded saved login data:', loginData);
      }
    } catch (error) {
      console.error('[HomeScreen] Failed to load saved login data:', error);
    }
  };

  const saveLoginData = async (data: LoginData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('[HomeScreen] Saved login data:', data);
    } catch (error) {
      console.error('[HomeScreen] Failed to save login data:', error);
    }
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
        environment: 'STAGING',
      });
      console.log('[HomeScreen] ✅ SDK initialized, result:', result);

      // 네이티브 SDK 실제 상태 확인 (재시도 로직)
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 10; // 최대 10회 (2초)

      while (!isReady && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms 대기
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
    if (!userId.trim()) {
      Alert.alert('오류', 'User ID를 입력해주세요.');
      return;
    }

    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('오류', '올바른 출생년도를 입력해주세요.');
      return;
    }

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

      // Save login data
      const loginData: LoginData = {
        userId: userId.trim(),
        gender,
        birthYear: year,
      };
      await saveLoginData(loginData);

      // Login with all fields
      const loginParams = {
        userId: loginData.userId,
        gender: loginData.gender,
        birthYear: loginData.birthYear,
      };

      console.log('[HomeScreen] 📤 Calling SDK.login() with parameters:');
      console.log('  - userId:', loginParams.userId, '(type:', typeof loginParams.userId, ')');
      console.log('  - gender:', loginParams.gender, '(type:', typeof loginParams.gender, ')');
      console.log('  - birthYear:', loginParams.birthYear, '(type:', typeof loginParams.birthYear, ')');
      console.log('  - Full params object:', JSON.stringify(loginParams, null, 2));

      await AdchainSDK.login(loginParams);
      console.log('[HomeScreen] ✅ Login successful with:', loginData);
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

  const handleOpenNestAds = async () => {
    try {
      await AdchainSDK.openOfferwallNestAds('test-nestads-placement');
      showToast('NestAds Offerwall opened!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

        <Text style={styles.title}>AdChain Expo SDK Test</Text>

        <Text style={styles.status}>
          SDK: {isInitializing ? '⏳ Initializing...' : sdkInitialized ? '✅ Initialized' : '❌ Not Initialized'}
        </Text>
        <Text style={styles.status}>
          User: {isLoggingIn ? '⏳ Logging in...' : loggedIn ? '✅ Logged In' : '❌ Logged Out'}
        </Text>

        {!sdkInitialized && (
          <TouchableOpacity
            style={[styles.initButton, isInitializing && styles.buttonDisabled]}
            onPress={handleInitialize}
            disabled={isInitializing}
          >
            <Text style={styles.initButtonText}>Initialize SDK</Text>
          </TouchableOpacity>
        )}

        {sdkInitialized && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>✓ SDK Initialized</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder='사용자 ID를 입력하세요'
            placeholderTextColor='#999'
            autoCapitalize='none'
            editable={!isLoggingIn}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>MALE</Text>
            <Switch
              value={gender === 'FEMALE'}
              onValueChange={(value) => setGender(value ? 'FEMALE' : 'MALE')}
              disabled={isLoggingIn}
              trackColor={{ false: '#007AFF', true: '#FF69B4' }}
              thumbColor='#FFF'
            />
            <Text style={styles.genderLabel}>FEMALE</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birth Year</Text>
          <TextInput
            style={styles.input}
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder='출생년도 (예: 1990)'
            placeholderTextColor='#999'
            keyboardType='numeric'
            maxLength={4}
            editable={!isLoggingIn}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, (!sdkInitialized || isLoggingIn) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!sdkInitialized || isLoggingIn}
        >
          {isLoggingIn ? <ActivityIndicator color='#FFF' /> : <Text style={styles.loginButtonText}>로그인</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, (!sdkInitialized || !loggedIn) && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={!sdkInitialized || !loggedIn}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.offerwallButton, !loggedIn && styles.buttonDisabled]}
          onPress={handleOpenOfferwall}
          disabled={!loggedIn}
        >
          <Text style={styles.offerwallButtonText}>오퍼월 열기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nestadsButton, !loggedIn && styles.buttonDisabled]}
          onPress={handleOpenNestAds}
          disabled={!loggedIn}
        >
          <Text style={styles.nestadsButtonText}>NestAds 오퍼월 열기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    width: '30%',
    fontWeight: '600',
    color: '#666',
  },
  input: {
    width: '70%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 10,
  },
  initButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  initButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBannerText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  offerwallButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  offerwallButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nestadsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  nestadsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
});
