import { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getCurrentUser, getSession, signIn, signUp, signOut } from '@/lib/supabase';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get initial session with timeout and error handling
    const initAuth = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<{ session: null }>((resolve) => {
          setTimeout(() => {
            console.warn('Supabase session timeout - continuing without auth');
            resolve({ session: null });
          }, 1500); // 1.5 second timeout for faster load
        });

        const sessionPromise = getSession();
        
        const { session } = await Promise.race([sessionPromise, timeoutPromise]);
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Failed to get session:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
    }
  }, []);

  const refreshUser = async () => {
    const { user } = await getCurrentUser();
    setUser(user);
  };

  const authSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (!error) {
      await refreshUser();
    }
    return { error };
  };

  const authSignUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await signUp(email, password, metadata);
    if (!error && data?.session) {
      // Session was created immediately (no email confirmation required)
      setSession(data.session);
      setUser(data.session.user);
      await refreshUser();
    } else if (!error && data?.user && !data?.session) {
      // User created but needs email confirmation
      // Try to sign in immediately anyway in case confirmation is disabled
      const { error: signInError } = await signIn(email, password);
      if (!signInError) {
        await refreshUser();
      }
    }
    return { error };
  };

  const authSignOut = async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setLocation('/');
  };

  const value = {
    user,
    session,
    loading,
    signIn: authSignIn,
    signUp: authSignUp,
    signOut: authSignOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}