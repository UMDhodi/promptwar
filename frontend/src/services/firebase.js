import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "test-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Initialize anonymous sign-in for frictionless flow
 */
export async function signInFrictionless() {
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.error("Auth error", error);
    return null;
  }
}
