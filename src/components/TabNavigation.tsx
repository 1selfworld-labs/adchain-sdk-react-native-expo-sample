import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import { AdchainOfferwallView } from '@1selfworld/adchain-sdk-react-native';
import HomeScreen from '../screens/HomeScreen';

const TabNavigation = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'benefits'>('home');
  const offerwallViewRef = useRef(null);

  // Handle back button for Benefits tab
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab === 'benefits' && offerwallViewRef.current) {
        const viewId = findNodeHandle(offerwallViewRef.current);
        if (viewId) {
          console.log('[TabNavigation] Back button pressed in Benefits tab, calling handleBackPress');
          UIManager.dispatchViewManagerCommand(
            viewId,
            'handleBackPress',
            []
          );
          return true; // Prevent default back behavior
        }
      }
      return false; // Allow default back behavior for other tabs
    });

    return () => backHandler.remove();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* Benefits 탭일 때는 ScrollView 없이 전체 화면 사용 */}
      {activeTab === 'benefits' ? (
        <View style={styles.contentContainer} pointerEvents="box-none">
          <AdchainOfferwallView
            ref={offerwallViewRef}
            placementId="tab_embedded_offerwall"
            style={{ flex: 1, width: '100%' }}
            onOfferwallOpened={() => console.log('Offerwall opened in benefits tab')}
            onOfferwallClosed={() => console.log('Offerwall closed in benefits tab')}
            onOfferwallError={(error) => console.error('Offerwall error:', error)}
            onRewardEarned={(amount) => console.log('Reward earned:', amount)}
            onCustomEvent={(eventType, payload) => {
              console.log('[WebView → App] Custom Event:', eventType, payload);

              // 이벤트 타입별 처리 - 시스템 팝업으로 명확하게 표시
              if (eventType === 'show_toast') {
                Alert.alert(
                  '🎉 WebView → App 메시지',
                  `${payload.message || JSON.stringify(payload)}\n\n✅ Sample 앱에서 처리됨 (SDK 아님)`,
                  [{ text: '확인', style: 'default' }]
                );
              } else if (eventType === 'navigate') {
                Alert.alert(
                  '🧭 Navigation 요청',
                  `Target: ${payload.screen || 'unknown'}\n\n✅ Sample 앱에서 처리됨`,
                  [{ text: '확인', style: 'default' }]
                );
              } else if (eventType === 'share') {
                Alert.alert(
                  '📤 Share 요청',
                  `Title: ${payload.title || ''}\nURL: ${payload.url || ''}\n\n✅ Sample 앱에서 처리됨`,
                  [{ text: '확인', style: 'default' }]
                );
              } else {
                Alert.alert(
                  `📨 Custom Event: ${eventType}`,
                  `${JSON.stringify(payload, null, 2)}\n\n✅ Sample 앱에서 처리됨`,
                  [{ text: '확인', style: 'default' }]
                );
              }
            }}
            onDataRequest={(requestType, params) => {
              console.log('[WebView → App] Data Request:', requestType, params);

              // 요청 타입별 응답 데이터
              const responses: Record<string, any> = {
                'user_points': { points: 12345, currency: 'KRW' },
                'user_profile': { userId: 'test_123', nickname: 'TestPlayer', level: 42 },
                'app_version': { version: '1.0.0', buildNumber: 100 }
              };

              const response = responses[requestType] || null;
              console.log('[App → WebView] Data Response:', response);

              return response;
            }}
          />
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          <HomeScreen />
        </ScrollView>
      )}

      {/* 하단 탭 바 (고정) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab('home')}>
          <Text style={[styles.tabText, activeTab === 'home' ? styles.activeTabText : styles.inactiveTabText]}>
            홈
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'benefits' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab('benefits')}>
          <Text style={[styles.tabText, activeTab === 'benefits' ? styles.activeTabText : styles.inactiveTabText]}>
            혜택
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  tabContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#007AFF',
  },
  inactiveTabText: {
    color: '#8E8E93',
  },
});

export default TabNavigation;
