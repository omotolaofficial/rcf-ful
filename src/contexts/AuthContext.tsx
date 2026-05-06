import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth, authReady, db, googleAuthProvider } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminProfile {
  email: string;
  role: AdminRole;
  displayName?: string;
}



interface AuthContextType {
  user: User | null;
  loading: boolean;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  adminProfile: null,
  isAdmin: false,
  isSuperAdmin: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    let unsubscribe = () => {};

    void (async () => {
      try {
        await authReady;
      } finally {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!isMounted) return;

          let nextAdminProfile: AdminProfile | null = null;

          if (currentUser) {
            let isAdminDocFound = false;
            try {
              const adminDoc = await getDocFromServer(doc(db, 'admins', currentUser.uid));
              if (adminDoc.exists()) {
                const profile = adminDoc.data() as Partial<AdminProfile>;
                nextAdminProfile = {
                  email: profile.email || currentUser.email || '',
                  role: profile.role === 'super_admin' ? 'super_admin' : 'admin',
                  displayName: profile.displayName || currentUser.displayName || undefined
                };
                isAdminDocFound = true;
              }
            } catch (e) {
              console.error('Error checking admin status:', e);
            }

            if (!isAdminDocFound && currentUser.email) {
              const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
                .split(',')
                .map((e: string) => e.trim().toLowerCase())
                .filter(Boolean);
              
              if (envAdmins.includes(currentUser.email.toLowerCase())) {
                nextAdminProfile = {
                  email: currentUser.email,
                  role: 'super_admin',
                  displayName: currentUser.displayName || undefined
                };
              }
            }
          }

          if (!isMounted) return;
          setUser(currentUser);
          setAdminProfile(nextAdminProfile);
          setLoading(false);
        });
      }
    })();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await authReady;
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = Boolean(adminProfile);
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{ user, loading, adminProfile, isAdmin, isSuperAdmin, signInWithGoogle, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
