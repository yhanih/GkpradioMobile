import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Check if user is admin after login
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (userError || userData.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
            <div className="glass animate-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--primary-light)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem' }}>
                        <LogIn size={32} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Admin Portal</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>God Kingdom Principles Radio</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@gkpradio.com"
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '1rem', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
