/**
 * AgriDirect — Firebase Cloud Messaging (FCM) Setup
 *
 * All Firebase/notifee imports are wrapped in try/catch so the app
 * compiles and runs even when native modules aren't linked yet.
 */

import { Platform } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';

// ─── Notification types ───────────────────────────────────────────────────────

export type NotificationType =
  | 'ORDER_RECEIVED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PACKED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_CONFIRMED'
  | 'GENERAL';

export interface NotificationData {
  type: NotificationType;
  orderId?: string;
  title?: string;
  body?: string;
  [key: string]: string | undefined;
}

// ─── Navigation ref ───────────────────────────────────────────────────────────

let _navigationRef: NavigationContainerRef<any> | null = null;

export const setNotificationNavigationRef = (
  ref: NavigationContainerRef<any>,
): void => {
  _navigationRef = ref;
};

// ─── Navigation handler ───────────────────────────────────────────────────────

export const handleNotificationNavigation = (data: NotificationData): void => {
  if (!_navigationRef?.isReady()) return;
  const { type, orderId } = data;
  switch (type) {
    case 'ORDER_RECEIVED':
      (_navigationRef as any).navigate('FarmerOrders');
      break;
    case 'ORDER_ACCEPTED':
    case 'ORDER_PACKED':
      if (orderId) (_navigationRef as any).navigate('BuyerOrderDetail', { orderId });
      break;
    case 'ORDER_PICKED_UP':
      if (orderId) (_navigationRef as any).navigate('OrderTracking', { orderId });
      break;
    case 'ORDER_DELIVERED':
      if (orderId) (_navigationRef as any).navigate('OrderDetail', { orderId, showRating: true });
      break;
    case 'PAYMENT_CONFIRMED':
      if (orderId) (_navigationRef as any).navigate('OrderDetail', { orderId });
      break;
    default:
      break;
  }
};

// ─── Permission request ───────────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    const authStatus = await messaging().requestPermission();
    return authStatus === 1 || authStatus === 2;
  } catch {
    return false;
  }
};

// ─── Android channel setup ────────────────────────────────────────────────────

export const CHANNEL_IDS = {
  ORDERS: 'agridirect_orders',
  PAYMENTS: 'agridirect_payments',
  GENERAL: 'agridirect_general',
  PROMOTIONS: 'agridirect_promotions',
} as const;

export const createAndroidChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.createChannels([
      { id: CHANNEL_IDS.ORDERS,      name: 'Orders',      importance: 4 },
      { id: CHANNEL_IDS.PAYMENTS,    name: 'Payments',    importance: 4 },
      { id: CHANNEL_IDS.GENERAL,     name: 'General',     importance: 3 },
      { id: CHANNEL_IDS.PROMOTIONS,  name: 'Promotions',  importance: 2 },
    ]);
  } catch {
    // notifee not linked yet
  }
};

// ─── Get FCM token ────────────────────────────────────────────────────────────

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
    await requestNotificationPermission();
    return await messaging().getToken();
  } catch {
    return null;
  }
};

// ─── Foreground message listener ──────────────────────────────────────────────

export const registerForegroundMessageHandler = (
  onToast: (title: string, body: string, type: NotificationType) => void,
): (() => void) => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    return messaging().onMessage(async (remoteMessage: any) => {
      const data = (remoteMessage.data ?? {}) as NotificationData;
      const title = remoteMessage.notification?.title ?? data.title ?? 'AgriDirect';
      const body  = remoteMessage.notification?.body  ?? data.body  ?? '';
      const type  = (data.type as NotificationType) ?? 'GENERAL';
      onToast(title, body, type);
    });
  } catch {
    return () => {};
  }
};

// ─── Background tap handler ───────────────────────────────────────────────────

export const registerBackgroundNotificationHandler = (): void => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      const data = (remoteMessage.data ?? {}) as NotificationData;
      setTimeout(() => handleNotificationNavigation(data), 500);
    });
  } catch {
    // Firebase not configured
  }
};

// ─── Token refresh listener ───────────────────────────────────────────────────

export const registerTokenRefreshHandler = (
  onNewToken: (token: string) => void,
): (() => void) => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    return messaging().onTokenRefresh(onNewToken);
  } catch {
    return () => {};
  }
};

// ─── Cold-start notification ──────────────────────────────────────────────────

export const checkInitialNotification =
  async (): Promise<NotificationData | null> => {
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      const msg = await messaging().getInitialNotification();
      if (msg?.data) return msg.data as NotificationData;
    } catch {}
    return null;
  };

// ─── Headless background handler (index.js) ───────────────────────────────────

export const registerHeadlessTask = (): void => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (_msg: any) => {});
  } catch {
    // Firebase not configured
  }
};
