import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/notifications';
import { normalizeAvatarSeed } from '../components/ui/avatar/avatarVariants';
import { saveProfileFields, syncAvatarFromAuthMetadata } from '../lib/profileAvatarStyle';
import { applyPendingTermsAcceptance, recordTermsAcceptance } from '../lib/termsAcceptance';

/** Deep link used in confirmation / magic-link emails (must match Supabase Auth redirect allowlist). */
const EMAIL_AUTH_REDIRECT = 'gkpradio://auth/callback';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    avatarSeed?: string
  ) => Promise<{
    error: any;
    needsEmailVerification?: boolean;
    /** Email likely already registered — Supabase sends no signup mail (empty identities). */
    signupEmailNotProvisioned?: boolean;
  }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: any }>;
  /** After signup: verify 6-digit code from email (requires `{{ .Token }}` in Supabase “Confirm signup” template). */
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  /** Reload profile fields (e.g. after editing avatar style on Profile screen). */
  refreshUser: () => Promise<void>;
  /** Persist Terms of Service / Community Guidelines acceptance (18+ UGC gate). */
  acceptCommunityTerms: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const savePushToken = async (userId: string) => {
    if (Platform.OS === 'web') return;
    try {
      const token = await registerForPushNotifications();
      if (token) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Failed to save push token:', e);
    }
  };

  const clearPushToken = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', userId);
    } catch (e) {
      console.warn('Failed to clear push token:', e);
    }
  };

  const mapUser = async (sessionUser: any | null) => {
    if (!sessionUser) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,avatar_seed,bio,created_at,terms_accepted_at')
      .eq('id', sessionUser.id)
      .maybeSingle();

    const avatarseed = normalizeAvatarSeed(
      profile?.avatar_seed ??
        (typeof sessionUser.user_metadata?.avatar_seed === 'string'
          ? sessionUser.user_metadata.avatar_seed
          : null),
      sessionUser.id,
    );

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      fullname: profile?.full_name || sessionUser.user_metadata?.full_name || null,
      avatarurl: profile?.avatar_url || null,
      avatarseed,
      bio: profile?.bio || null,
      created_at: profile?.created_at || sessionUser.created_at || null,
      terms_accepted_at: profile?.terms_accepted_at ?? null,
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(await mapUser(data.session?.user ?? null));
        if (data.session?.user?.id) {
          savePushToken(data.session.user.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(await mapUser(nextSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) return { error };
      setSession(data.session);
      setUser(await mapUser(data.user));
      if (data.user?.id) {
        savePushToken(data.user.id);
        await applyPendingTermsAcceptance(data.user.id);
      }
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    avatarSeed?: string,
  ) => {
    const resolvedAvatarSeed = normalizeAvatarSeed(avatarSeed);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            full_name: fullName || '',
            avatar_seed: resolvedAvatarSeed,
          },
          emailRedirectTo: EMAIL_AUTH_REDIRECT,
        },
      });
      if (error) {
        return { error };
      }

      const identities = data.user?.identities;
      // With "Confirm email" on, duplicate signups return 200 + user with identities: [] (no mail sent).
      if (
        data.user &&
        !data.session &&
        Array.isArray(identities) &&
        identities.length === 0
      ) {
        return { error: null, signupEmailNotProvisioned: true };
      }

      const hasEmailIdentity =
        !Array.isArray(identities) ||
        identities.some((row: { provider?: string }) => row?.provider === 'email');

      if (data.user?.id && hasEmailIdentity) {
        const { error: profileError } = await saveProfileFields(data.user.id, {
          full_name: fullName?.trim() || null,
          avatar_seed: resolvedAvatarSeed,
        });
        if (profileError) {
          console.warn('[Auth] profile save after signUp:', profileError.message);
        }
      }

      if (data.session) {
        setSession(data.session);
        setUser(await mapUser(data.session.user));
        if (data.session.user?.id) {
          await applyPendingTermsAcceptance(data.session.user.id);
        }
        return { error: null, needsEmailVerification: false };
      }

      // Supabase returns no session when email confirmation is required before first sign-in.
      const needsEmailVerification = Boolean(data.user && hasEmailIdentity);
      return { error: null, needsEmailVerification };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      if (user?.id) {
        await clearPushToken(user.id);
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: 'gkpradio://reset-password',
    });
    return { error };
  };

  const resendSignupConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizeEmail(email),
      options: { emailRedirectTo: EMAIL_AUTH_REDIRECT },
    });
    return { error };
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    try {
      const e = normalizeEmail(email);
      const digits = token.replace(/\D/g, '');
      const { data, error } = await supabase.auth.verifyOtp({
        email: e,
        token: digits,
        type: 'email',
      });
      if (error) {
        return { error };
      }
      if (data.session) {
        setSession(data.session);
        const sessionUser = data.session.user;
        if (sessionUser?.id) {
          await syncAvatarFromAuthMetadata(
            sessionUser.id,
            sessionUser.user_metadata,
            typeof sessionUser.user_metadata?.full_name === 'string'
              ? sessionUser.user_metadata.full_name
              : null,
          );
          savePushToken(sessionUser.id);
          await applyPendingTermsAcceptance(sessionUser.id);
        }
        setUser(await mapUser(sessionUser));
      }
      return { error: null };
    } catch (error) {
      console.error('[Auth] verifyEmailOtp:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    setUser(await mapUser(session.user));
  };

  const acceptCommunityTerms = async () => {
    if (!session?.user?.id) {
      return { error: new Error('You must be signed in to accept the terms.') };
    }
    try {
      await recordTermsAcceptance(session.user.id);
      setUser(await mapUser(session.user));
      return { error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Could not save terms acceptance.');
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        resendSignupConfirmation,
        verifyEmailOtp,
        signOut,
        resetPassword,
        updatePassword,
        refreshUser,
        acceptCommunityTerms,
      }}
    >
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
