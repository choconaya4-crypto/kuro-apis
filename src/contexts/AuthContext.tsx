import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { onAuthStateChangedSafe, signInWithGoogle, signOut, isAdmin, isFirebaseConfigured, auth, type FirebaseUser } from '../lib/firebase';
import type { User } from '../types/database';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChangedSafe(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);

        // Create user object from Firebase user
        const adminStatus = isAdmin(fbUser.email);
        const userData: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          username: fbUser.displayName || fbUser.email?.split('@')[0] || 'user',
          role: adminStatus ? 'admin' : 'user',
          api_key: `firebase_${fbUser.uid}`, // Temporary, will be overwritten by backend
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        setUser(userData);
        localStorage.setItem('kurocodex_user', JSON.stringify(userData));
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('kurocodex_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    if (!isFirebaseConfigured() || !auth) {
      return { success: false, error: 'Firebase not configured' };
    }
    const result = await signInWithGoogle();
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(result.user);

      const adminStatus = isAdmin(result.user.email);
      const userData: User = {
        id: result.user.uid,
        email: result.user.email || '',
        username: result.user.displayName || result.user.email?.split('@')[0] || 'user',
        role: adminStatus ? 'admin' : 'user',
        api_key: `firebase_${result.user.uid}`,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      setUser(userData);
      localStorage.setItem('kurocodex_user', JSON.stringify(userData));

      return { success: true };
    } catch (error: any) {
      console.error('Email login error:', error);

      let errorMessage = 'Login gagal';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti.';
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('kurocodex_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, loginWithEmail, logout, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
