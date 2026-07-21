import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  token: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize user with backend
  const syncUserWithBackend = async (idToken: string) => {
    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const fullUser = await res.json();
        setUser(fullUser);
      } else {
        console.error('Failed to sync user with backend:', await res.text());
        setUser(null);
      }
    } catch (err) {
      console.error('Error syncing user with backend:', err);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const profileData = await res.json();
        setUser(prev => prev ? { ...prev, ...profileData } : profileData);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    localStorage.removeItem('sandbox-token'); // Force-clear any legacy sandbox token

    const checkStoredCustomToken = async () => {
      const storedCustomToken = localStorage.getItem('custom-session-token');
      if (storedCustomToken) {
        try {
          const res = await fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${storedCustomToken}` },
          });
          if (res.ok) {
            const profileData = await res.json();
            setToken(storedCustomToken);
            setUser(profileData);
            setLoading(false);
            return true;
          } else {
            localStorage.removeItem('custom-session-token');
          }
        } catch (e) {
          console.warn('Stored custom token validation failed:', e);
          localStorage.removeItem('custom-session-token');
        }
      }
      return false;
    };

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      if (fUser) {
        setFirebaseUser(fUser);
        try {
          const idToken = await fUser.getIdToken(true);
          setToken(idToken);
          await syncUserWithBackend(idToken);
        } catch (err) {
          console.error('Error getting auth ID token:', err);
          setToken(null);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        const hasCustom = await checkStoredCustomToken();
        if (!hasCustom) {
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('sandbox-token');
      localStorage.removeItem('custom-session-token');
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    localStorage.removeItem('sandbox-token');
    try {
      // 1. Try Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;
      setFirebaseUser(fUser);
      const idToken = await fUser.getIdToken(true);
      setToken(idToken);
      await syncUserWithBackend(idToken);
    } catch (firebaseErr: any) {
      console.warn('Firebase login attempt failed or operation disabled. Attempting server auth fallback...', firebaseErr);
      // 2. Fallback to Server Auth
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('custom-session-token', data.token);
          setToken(data.token);
          setUser(data.user);
          return;
        } else {
          throw new Error(data.error || 'Server authentication failed.');
        }
      } catch (serverErr: any) {
        throw new Error(serverErr.message || firebaseErr.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    localStorage.removeItem('sandbox-token');
    try {
      // 1. Try Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;
      setFirebaseUser(fUser);
      const idToken = await fUser.getIdToken(true);
      setToken(idToken);
      await syncUserWithBackend(idToken);
      
      const defaultUsername = 'user_' + Math.random().toString(36).substring(2, 9);
      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fullName,
            username: defaultUsername,
          }),
        });
      } catch (profileErr) {
        console.error('Failed to set user name initially', profileErr);
      }
      await refreshUser();
    } catch (firebaseErr: any) {
      console.warn('Firebase signup attempt failed or operation disabled. Attempting server auth fallback...', firebaseErr);
      // 2. Fallback to Server Auth
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('custom-session-token', data.token);
          setToken(data.token);
          setUser(data.user);
          return;
        } else {
          throw new Error(data.error || 'Server registration failed.');
        }
      } catch (serverErr: any) {
        throw new Error(serverErr.message || firebaseErr.message || 'Sign up failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password reset failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('sandbox-token');
    localStorage.removeItem('custom-session-token');
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Log out failed:', err);
    } finally {
      setFirebaseUser(null);
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        token,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
