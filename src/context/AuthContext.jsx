import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db, isFirebaseConfigured } from '../services/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return () => {};
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser && db) {
        try {
          const snap = await get(ref(db, `admins/${nextUser.uid}`));
          setIsAdmin(snap.val() === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  async function login(email, password) {
    if (!auth) {
      const msg = 'Firebase Auth is not configured. Check .env or use Demo Mode.';
      setAuthError(msg);
      throw new Error(msg);
    }
    setAuthError('');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        authLoading,
        authError,
        setAuthError,
        login,
        logout,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
