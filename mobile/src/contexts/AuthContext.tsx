import React, { createContext, useContext, useEffect, useState } from 'react';
import { wpClient } from '../lib/wordpress';
import { AppState } from 'react-native';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const token = await wpClient.getToken();
      if (token) {
        const { data, error } = await wpClient.getMe();
        if (data) {
          setUser(data);
          setSession({ token });
        } else {
          await wpClient.logout();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await wpClient.login(email, password);

      if (!error && data) {
        setSession(data);
        const userRes = await wpClient.getMe();
        if (userRes.data) {
          setUser(userRes.data);
        }
      }

      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await wpClient.register(email, password, fullName);

      if (!error) {
        return await signIn(email, password);
      }

      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await wpClient.logout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    console.warn('Reset password not implemented for WordPress yet');
    return { error: 'Please use the website to reset your password' };
  };

  const updatePassword = async (password: string) => {
    console.warn('Update password not implemented for WordPress yet');
    return { error: 'Please use the website to update your password' };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
