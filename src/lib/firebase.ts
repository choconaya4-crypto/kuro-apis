import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your-firebase-api-key' &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
}

let app;
let auth;
let googleProvider;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    console.warn('Firebase not configured. Please update .env with Firebase credentials.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, googleProvider };

// Admin emails from environment
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@kurocodex.ai').split(',').map(e => e.trim());

// Check if email is admin
export function isAdmin(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

// Sign in with Google
export async function signInWithGoogle() {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    return { success: false, error: 'Firebase not configured. Please add Firebase credentials to .env file.' };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return { success: false, error: error.message || 'Failed to sign in with Google' };
  }
}

// Sign out
export async function signOut() {
  if (!auth) return { success: false, error: 'Auth not initialized' };

  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
}

// Get Firebase ID token
export async function getIdToken(): Promise<string | null> {
  if (!auth) return null;

  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

// Auth state listener - wrap with safety check
export function onAuthStateChangedSafe(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { onAuthStateChanged };
export type { FirebaseUser };
