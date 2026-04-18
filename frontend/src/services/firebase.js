import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

/**
 * Firebase configuration loaded from environment variables.
 * Falls back to mock values for local/CI environments without real Firebase.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemo-mock-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stadiumiq-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stadiumiq-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stadiumiq-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Singleton pattern — avoid re-initializing on HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics — only in browser context (not SSR)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

// Performance Monitoring
let perf = null;
try {
  perf = getPerformance(app);
} catch (_) {}

export { app, analytics, perf };

/**
 * Logs a named event to Firebase Analytics.
 * @param {string} eventName - e.g. 'facility_navigate', 'chat_message_sent'
 * @param {Object} params - Additional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

/**
 * Initializes anonymous auth session for frictionless onboarding.
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export async function signInFrictionless() {
  try {
    const cred = await signInAnonymously(auth);
    trackEvent('session_start', { method: 'anonymous' });
    return cred.user;
  } catch (error) {
    console.warn('Anonymous auth unavailable (offline/mock mode):', error.code);
    return null;
  }
}

/**
 * Subscribes to auth state changes.
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
