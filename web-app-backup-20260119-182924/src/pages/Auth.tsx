import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: authError } = await signIn(email, password);
                if (authError) throw authError;
                navigate('/community');
            } else {
                const { error: authError } = await signUp(email, password, fullName);
                if (authError) throw authError;
                setError('Registration successful! Please check your email to verify.');
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background"></div>

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <div className="auth-logo">
                        <Sparkles size={32} color="white" />
                    </div>
                    <h1>{isLogin ? 'Welcome Back' : 'Join Community'}</h1>
                    <p>{isLogin ? 'Sign in to your GKP account' : 'Create an account to join the conversation'}</p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            className="error-msg"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <label>Full Name</label>
                            <div className="input-field-wrap">
                                <User size={18} />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-field-wrap">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-field-wrap">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-switch">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
