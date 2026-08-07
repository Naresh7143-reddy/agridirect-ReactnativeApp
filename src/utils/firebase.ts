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
    
    // Use PlayIntegrity on Android (Google Play Services)
    // Use DeviceCheck on iOS (Apple services)
    let provider;
    if (Platform.OS === 'android') {
      provider = new appCheckModule.PlayIntegrityProvider();
    } else if (Platform.OS === 'ios') {
      provider = new appCheckModule.DeviceCheckProvider();
    } else {
      if (__DEV__) console.warn('[Firebase] AppCheck provider not supported on this platform');
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmationResult = any;
export type FirebaseUser = any;
export type RemoteMessage = any;
export type FirebaseAuthTypes = any;
export type FirebaseMessagingTypes = any;
