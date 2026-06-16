/**
 * AgriDirect — App Root
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { store, persistor } from './src/store';
import { queryClient } from './src/lib/queryClient';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { Colors } from './src/theme/colors';
import ENV from './src/config/env';

// Keep Render backend awake — pings every 10 min so no cold start during demo
function useKeepBackendAwake() {
  useEffect(() => {
    const ping = () => fetch(`${ENV.API_URL}/health`).catch(() => {});
    ping(); // immediate ping on app open
    const interval = setInterval(ping, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, []);
}

export default function App() {
  useKeepBackendAwake();
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          }
          persistor={persistor}
        >
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <AppNavigator />
              <OfflineBanner />
              <Toast />
            </SafeAreaProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
