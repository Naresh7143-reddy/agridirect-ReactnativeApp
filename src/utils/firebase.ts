/**
 * AgriDirect — Firebase Initialisation
 *
 * @react-native-firebase/app auto-reads google-services.json (Android)
 * and GoogleService-Info.plist (iOS).
 *
 * Project: agri-8b32f  |  Package: com.agridirect
 *
 * AppCheck: Initialized with PlayIntegrity (Android) and DeviceCheck (iOS)
 * to handle reCAPTCHA validation for Phone Authentication on mobile.
 */

// Dynamic requires so the app doesn't crash before Firebase native
// modules are linked (e.g. first Metro start without pod install).

let _auth: any = null;
let _messaging: any = null;
let _appCheck: any = null;
let _appCheckInitialized = false;

const getAuth = () => {
  if (!_auth) {
    try { _auth = require('@react-native-firebase/auth').default(); } catch {}
  }
  return _auth;
};

const getMessaging = () => {
  if (!_messaging) {
    try { _messaging = require('@react-native-firebase/messaging').default(); } catch {}
  }
  return _messaging;
};

const getAppCheck = () => {
  if (!_appCheck) {
    try { _appCheck = require('@react-native-firebase/app-check').default(); } catch {}
  }
  return _appCheck;
};

// ─── Proxy objects (safe to import even without native modules) ───────────────

export const firebaseAuth: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getAuth();
    if (!instance) {
      // For function properties return a rejecting stub; for value properties return undefined
      if (prop === 'currentUser') return null;
      return () => Promise.reject(new Error('Firebase not ready'));
    }
    const val = (instance as any)[prop as string];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const firebaseMessaging: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getMessaging();
    if (!instance) {
      return () => Promise.reject(new Error('Firebase not ready'));
    }
    const val = (instance as any)[prop as string];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const firebaseAppCheck: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getAppCheck();
    if (!instance) {
      return () => Promise.reject(new Error('Firebase AppCheck not ready'));
    }
    const val = (instance as any)[prop as string];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

// ─── AppCheck Initialization ──────────────────────────────────────────────────

/**
 * Initializes Firebase AppCheck with PlayIntegrity (Android) or DeviceCheck (iOS).
 * This is REQUIRED for Phone Authentication on mobile to pass reCAPTCHA validation.
 * 
 * Must be called once at app startup before any Firebase services are used.
 */
export const initializeAppCheck = async (): Promise<void> => {
  if (_appCheckInitialized) return;
  
  try {
    const appCheck = getAppCheck();
    if (!appCheck) {
      if (__DEV__) console.warn('[Firebase] AppCheck module not available');
      return;
    }

    const appCheckModule = require('@react-native-firebase/app-check');
    const { Platform } = require('react-native');
    
    let provider;
    if (Platform.OS === 'android') {
      const PlayIntegrityProvider = appCheckModule.PlayIntegrityProvider || appCheckModule.default?.PlayIntegrityProvider;
      if (typeof PlayIntegrityProvider === 'function') {
        provider = new PlayIntegrityProvider();
      } else if (typeof appCheck.newPlayIntegrityProvider === 'function') {
        provider = appCheck.newPlayIntegrityProvider();
      }
    } else if (Platform.OS === 'ios') {
      const DeviceCheckProvider = appCheckModule.DeviceCheckProvider || appCheckModule.default?.DeviceCheckProvider;
      if (typeof DeviceCheckProvider === 'function') {
        provider = new DeviceCheckProvider();
      } else if (typeof appCheck.newDeviceCheckProvider === 'function') {
        provider = appCheck.newDeviceCheckProvider();
      }
    }

    if (!provider) {
      if (__DEV__) console.warn('[Firebase] AppCheck provider not available on this environment');
      return;
    }

    // Initialize with provider (can be called multiple times safely)
    await appCheck.initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });

    _appCheckInitialized = true;
    if (__DEV__) console.log('[Firebase] AppCheck initialized successfully');
  } catch (error: any) {
    console.error('[Firebase] AppCheck initialization failed:', error?.message);
    // Don't throw — AppCheck failure shouldn't crash the app
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatIndianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+91${cleaned}`;
};

export const getFirebaseIdToken = async (forceRefresh = false): Promise<string> => {
  const user = getAuth()?.currentUser;
  if (!user) throw new Error('No Firebase user signed in');
  return user.getIdToken(forceRefresh);
};

export const firebaseSignOut = async (): Promise<void> => {
  const user = getAuth()?.currentUser;
  if (user) await getAuth().signOut();
};

/**
 * Request notification permissions and register FCM token with backend
 */
export const registerFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    const authStatus = await messaging.requestPermission();
    const enabled =
      authStatus === 1 || // AUTHORIZED
      authStatus === 2;   // PROVISIONAL
    if (enabled) {
      const token = await messaging.getToken();
      if (__DEV__) console.log('[FCM Token]:', token);
      try {
        const client = require('../api/client').default;
        await client.post('/api/auth/fcm-token', { token });
      } catch {}
      return token;
    }
  } catch (e: any) {
    if (__DEV__) console.warn('[FCM Registration Error]:', e?.message);
  }
  return null;
};

/**
 * Setup foreground push notification listeners
 */
export const listenFCMNotifications = (onNotification: (msg: any) => void) => {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging.onMessage(async (remoteMessage: any) => {
      if (__DEV__) console.log('[FCM Message Received]:', remoteMessage);
      onNotification(remoteMessage);
    });
  } catch {
    return () => {};
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmationResult = any;
export type FirebaseUser = any;
export type RemoteMessage = any;
export type FirebaseAuthTypes = any;
export type FirebaseMessagingTypes = any;
