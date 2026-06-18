/**
 * AppNavigator — Root navigation container
 *
 * Responsibilities:
 *  - Auth-gated routing (role → navigator)
 *  - Deep link / universal link config
 *  - FCM token registration on mount
 *  - Foreground notification → Toast
 *  - Cold-start notification tap → navigate after mount
 *  - Wires navigationRef to notification utility
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  LinkingOptions,
} from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import { useAppDispatch, useAppSelector } from '../store';
import { setAppReady, setFcmToken } from '../store/appSlice';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../theme/colors';

import { AuthNavigator }    from './AuthNavigator';
import { FarmerNavigator }  from './FarmerNavigator';
import { BuyerNavigator }   from './BuyerNavigator';
import { DeliveryNavigator } from './DeliveryNavigator';
import { AdminNavigator }   from './AdminNavigator';

import {
  getFcmToken,
  createAndroidChannels,
  registerForegroundMessageHandler,
  registerBackgroundNotificationHandler,
  registerTokenRefreshHandler,
  checkInitialNotification,
  setNotificationNavigationRef,
  handleNotificationNavigation,
  type NotificationType,
} from '../utils/notifications';

// ─── Role → Navigator ─────────────────────────────────────────────────────────

const RoleNavigator: React.FC<{ role: string | null }> = ({ role }) => {
  switch (role) {
    case 'FARMER':   return <FarmerNavigator />;
    case 'BUYER':    return <BuyerNavigator />;
    case 'DELIVERY': return <DeliveryNavigator />;
    case 'ADMIN':    return <AdminNavigator />;
    default:         return <AuthNavigator />;
  }
};

// ─── Deep link configuration ──────────────────────────────────────────────────

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['agridirect://', 'https://agridirect.app', 'https://www.agridirect.app'],
  config: {
    screens: {
      // Auth
      Splash:               'splash',
      Onboarding:           'onboarding',
      RoleSelection:        'role',
      PhoneLogin:           'login',
      OTPVerification:      'otp',

      // Buyer stack
      BuyerTabs:            '',
      ProductDetail:        'products/:productId',
      Cart:                 'cart',
      OrderDetail:          'orders/:orderId',
      OrderTracking:        'orders/:orderId/track',
      PaymentSuccess:       'payment/success',
      FarmerPublicProfile:  'farmers/:farmerId',

      // Farmer stack
      FarmerTabs:           'farmer',
      FarmerOrderDetail:    'farmer/orders/:orderId',
      AddProduct:           'farmer/products/new',
      EditProduct:          'farmer/products/:productId/edit',

      // Delivery stack
      DeliveryTabs:         'delivery',
      DeliveryNavigation:   'delivery/navigate/:orderId',
      DeliveryOrderDetail:  'delivery/orders/:orderId',

      // Admin stack
      AdminDrawer:          'admin',
      UserDetail:           'admin/users/:userId',
      AdminOrderDetail:     'admin/orders/:orderId',

      // Common
      Notifications:        'notifications',
      HelpSupport:          'help',
      TermsConditions:      'terms',
      PrivacyPolicy:        'privacy',
    },
  },
};

// ─── Toast type map ───────────────────────────────────────────────────────────

const TOAST_TYPE_MAP: Record<NotificationType, 'success' | 'info' | 'error'> = {
  ORDER_RECEIVED:   'info',
  ORDER_ACCEPTED:   'success',
  ORDER_PACKED:     'info',
  ORDER_PICKED_UP:  'info',
  ORDER_DELIVERED:  'success',
  PAYMENT_CONFIRMED:'success',
  GENERAL:          'info',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, role, isLoading, updateFcmToken } = useAuth();
  const isAppReady = useAppSelector((s) => s.app.isAppReady);

  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let unsubToken: (() => void) | undefined;
    let unsubForeground: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        // 1. Android notification channels
        await createAndroidChannels();

        // 2. FCM device token
        const token = await getFcmToken();
        if (token) {
          dispatch(setFcmToken(token));
          await updateFcmToken(token);
        }

        // 3. Token rotation listener
        unsubToken = registerTokenRefreshHandler(async (newToken) => {
          dispatch(setFcmToken(newToken));
          await updateFcmToken(newToken);
        });

        // 4. Foreground message → Toast
        unsubForeground = registerForegroundMessageHandler(
          (title, body, type) => {
            Toast.show({
              type: TOAST_TYPE_MAP[type] ?? 'info',
              text1: title,
              text2: body,
              position: 'top',
              visibilityTime: 4000,
              topOffset: 52,
              onPress: () => Toast.hide(),
            });
          },
        );

        // 5. Background / quit tap listeners
        registerBackgroundNotificationHandler();
      } catch (e) {
        console.warn('[AppNavigator] Bootstrap error:', e);
      } finally {
        dispatch(setAppReady(true));
      }
    };

    bootstrap();

    return () => {
      unsubToken?.();
      unsubForeground?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation ready callback ──────────────────────────────────────────────

  const onNavigationReady = useCallback(async () => {
    if (navigationRef.current) {
      setNotificationNavigationRef(navigationRef.current);
    }

    // Handle cold-start notification tap
    const initialData = await checkInitialNotification();
    if (initialData) {
      setTimeout(() => handleNotificationNavigation(initialData), 800);
    }
  }, []);

  // ── Loading splash ─────────────────────────────────────────────────────────

  // Only block render until the app bootstrap finishes (FCM + channels).
  // Do NOT gate on isLoading — that causes AuthNavigator to unmount/remount
  // mid-auth-flow which resets the stack to Splash and creates a login loop.
  if (!isAppReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={onNavigationReady}
      onStateChange={
        __DEV__
          ? (state) => {
              const current = state?.routes?.[state.index ?? 0]?.name;
              if (current) console.log('[Nav]', current);
            }
          : undefined
      }
    >
      {isAuthenticated ? <RoleNavigator role={role} /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
