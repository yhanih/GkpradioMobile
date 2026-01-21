
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const ensureUserProfile = async (authUser: User) => {
        try {
            console.log('Ensuring user profile for:', authUser.id, authUser.email);

            const updates: Database['public']['Tables']['users']['Insert'] = {
                id: authUser.id,
                email: authUser.email!,
                fullname: authUser.user_metadata?.full_name || null,
            };

            const { error } = await supabase.from('users').upsert(updates, { onConflict: 'id' });

            if (error) {
                console.error('Error upserting user profile:', error);
            } else {
                console.log('User profile ensured successfully');
            }
        } catch (error) {
            console.error('Error ensuring user profile:', error);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await ensureUserProfile(session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user && _event === 'SIGNED_IN') {
                await ensureUserProfile(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!error && data.user) {
                await ensureUserProfile(data.user);
            }

            return { error };
        } catch (error) {
            console.error('Error signing in:', error);
            return { error };
        }
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (!error && data.user) {
                await ensureUserProfile(data.user);
            }

            return { error };
        } catch (error) {
            console.error('Error signing up:', error);
            return { error };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            return { error };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { error };
        }
    };

    const updatePassword = async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });
            return { error };
        } catch (error) {
            console.error('Error updating password:', error);
            return { error };
        }
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
