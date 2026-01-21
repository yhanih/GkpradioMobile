import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { User, Settings, LogOut, Heart, MessageSquare, Bell, Moon, Sun, Share2, ExternalLink, HelpCircle, Shield, Star, FileText, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Hub.css';

const Hub = () => {
    const { user, signOut } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [stats, setStats] = useState({ posts: 0, likes: 0, saved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load preferences from localStorage
        const notificationsPref = localStorage.getItem('notificationsEnabled') !== 'false';
        setNotificationsEnabled(notificationsPref);

        if (user) {
            fetchUserStats();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUserStats = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const [postsResult, likesResult] = await Promise.all([
                supabase
                    .from('communitythreads')
                    .select('id', { count: 'exact', head: true })
                    .eq('userid', user.id),
                supabase
                    .from('community_thread_likes')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),
            ]);

            setStats({
                posts: postsResult.count || 0,
                likes: likesResult.count || 0,
                saved: likesResult.count || 0, // Using likes as proxy for saved
            });
        } catch (err) {
            console.error('Error fetching user stats:', err);
        } finally {
            setLoading(false);
        }
    };


    const toggleNotifications = () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        localStorage.setItem('notificationsEnabled', newValue.toString());
        
        if (newValue && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission !== 'granted') {
                    setNotificationsEnabled(false);
                    localStorage.setItem('notificationsEnabled', 'false');
                }
            });
        }
    };

    const handleSignOut = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            await signOut();
            navigate('/');
        }
    };

    const handleShareApp = async () => {
        const shareData = {
            title: 'GKP Radio',
            text: 'Check out GKP Radio - Faith-based content, live radio, and community!',
            url: window.location.origin,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareData.url);
            alert('Link copied to clipboard!');
        }
    };

    const openLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const getUserInitials = () => {
        if (!user?.email) return 'GK';
        const parts = user.email.split('@')[0].split(/[._-]/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return user.email.slice(0, 2).toUpperCase();
    };

    return (
        <div className="hub-page">
            <div className="hub-container">
                {/* Header Section */}
                <motion.div
                    className="hub-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {user ? (
                        <div className="profile-section">
                            <div className="profile-avatar-large">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="" />
                                ) : (
                                    <span className="avatar-initials">{getUserInitials()}</span>
                                )}
                            </div>
                            <div className="profile-info">
                                <h1>Welcome back!</h1>
                                <p>{user.email}</p>
                            </div>

                            {!loading && (
                                <div className="stats-row">
                                    <div className="stat-item">
                                        <div className="stat-value">{stats.posts}</div>
                                        <div className="stat-label">Posts</div>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <div className="stat-value">{stats.likes}</div>
                                        <div className="stat-label">Likes</div>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <div className="stat-value">{stats.saved}</div>
                                        <div className="stat-label">Saved</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="guest-section">
                            <div className="hub-icon-container">
                                <User size={48} />
                            </div>
                            <h1>GKP Radio</h1>
                            <p>Settings & More</p>
                        </div>
                    )}
                </motion.div>

                {/* Account Section */}
                {user && (
                    <section className="hub-section">
                        <h2 className="section-title">Account</h2>
                        <div className="settings-card">
                            <SettingItem
                                icon={<User size={20} />}
                                label="My Profile"
                                subtitle="Edit your profile and preferences"
                                onClick={() => navigate('/profile')}
                            />
                            <div className="divider"></div>
                            <SettingItem
                                icon={<Heart size={20} />}
                                label="Liked Posts"
                                subtitle={`${stats.saved} posts you've liked`}
                                onClick={() => navigate('/community')}
                            />
                        </div>
                    </section>
                )}

                {/* Preferences Section */}
                <section className="hub-section">
                    <h2 className="section-title">Preferences</h2>
                    <div className="settings-card">
                        <SettingItem
                            icon={<Bell size={20} />}
                            label="Browser Notifications"
                            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
                            onClick={toggleNotifications}
                            rightElement={
                                <ToggleSwitch
                                    value={notificationsEnabled}
                                    onChange={toggleNotifications}
                                />
                            }
                        />
                        <div className="divider"></div>
                        <SettingItem
                            icon={darkMode ? <Moon size={20} /> : <Sun size={20} />}
                            label="Dark Mode"
                            subtitle={darkMode ? 'On' : 'Off'}
                            onClick={toggleDarkMode}
                            rightElement={
                                <ToggleSwitch
                                    value={darkMode}
                                    onChange={toggleDarkMode}
                                />
                            }
                        />
                    </div>
                </section>

                {/* About Section */}
                <section className="hub-section">
                    <h2 className="section-title">About</h2>
                    <div className="settings-card">
                        <SettingItem
                            icon={<Share2 size={20} />}
                            label="Share App"
                            subtitle="Share GKP Radio with friends"
                            onClick={handleShareApp}
                        />
                        <div className="divider"></div>
                        <SettingItem
                            icon={<Star size={20} />}
                            label="Rate Us"
                            subtitle="Help us improve"
                            onClick={() => openLink('https://godkingdomprinciplesradio.com')}
                        />
                        <div className="divider"></div>
                        <SettingItem
                            icon={<HelpCircle size={20} />}
                            label="Help & Support"
                            subtitle="Get help with the app"
                            onClick={() => openLink('mailto:support@gkpradio.com')}
                        />
                        <div className="divider"></div>
                        <SettingItem
                            icon={<Mail size={20} />}
                            label="Send Feedback"
                            subtitle="We'd love to hear from you"
                            onClick={() => openLink('mailto:feedback@gkpradio.com')}
                        />
                    </div>
                </section>

                {/* Legal Section */}
                <section className="hub-section">
                    <h2 className="section-title">Legal</h2>
                    <div className="settings-card">
                        <SettingItem
                            icon={<Shield size={20} />}
                            label="Privacy Policy"
                            subtitle="How we protect your data"
                            onClick={() => openLink('https://godkingdomprinciplesradio.com/privacy-policy')}
                        />
                        <div className="divider"></div>
                        <SettingItem
                            icon={<FileText size={20} />}
                            label="Terms of Service"
                            subtitle="Terms and conditions"
                            onClick={() => openLink('https://godkingdomprinciplesradio.com/terms')}
                        />
                    </div>
                </section>

                {/* Sign Out Section */}
                {user && (
                    <section className="hub-section">
                        <div className="settings-card">
                            <SettingItem
                                icon={<LogOut size={20} />}
                                label="Sign Out"
                                subtitle="Sign out of your account"
                                onClick={handleSignOut}
                                destructive
                            />
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

interface SettingItemProps {
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
    icon, 
    label, 
    subtitle, 
    onClick, 
    rightElement,
    destructive 
}) => {
    return (
        <div 
            className={`setting-item ${destructive ? 'destructive' : ''}`}
            onClick={onClick}
        >
            <div className="setting-left">
                <div className={`setting-icon ${destructive ? 'destructive' : ''}`}>
                    {icon}
                </div>
                <div className="setting-text">
                    <div className="setting-label">{label}</div>
                    {subtitle && <div className="setting-subtitle">{subtitle}</div>}
                </div>
            </div>
            {rightElement || <ExternalLink size={18} className="setting-chevron" />}
        </div>
    );
};

interface ToggleSwitchProps {
    value: boolean;
    onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onChange }) => {
    return (
        <div 
            className={`toggle-switch ${value ? 'on' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
        >
            <div className="toggle-slider"></div>
        </div>
    );
};

export default Hub;
