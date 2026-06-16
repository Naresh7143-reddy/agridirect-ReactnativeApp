/**
 * AgriDirect — Firebase Initialisation
 *
 * @react-native-firebase/app auto-reads google-services.json (Android)
 * and GoogleService-Info.plist (iOS).
 *
 * Project: agri-8b32f  |  Package: com.agridirect
 */

// Dynamic requires so the app doesn't crash before Firebase native
// modules are linked (e.g. first Metro start without pod install).

let _auth: any = null;
let _messaging: any = null;

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

// ─── Proxy objects (safe to import even without native modules) ───────────────

export const firebaseAuth: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getAuth();
    if (!instance) return () => Promise.reject(new Error('Firebase not ready'));
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const firebaseMessaging: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getMessaging();
    if (!instance) return () => Promise.reject(new Error('Firebase not ready'));
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

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
