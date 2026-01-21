import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Settings, LogOut, MessageSquare, Heart, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: 'Conversations', value: '0', icon: <MessageSquare size={16} /> },
        { label: 'Likes Received', value: '0', icon: <Heart size={16} /> },
        { label: 'Days Joined', value: '0', icon: <Clock size={16} /> }
    ]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    if (!user) {
        navigate('/auth');
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // 1. Get thread count
            const { count: threadCount } = await supabase
                .from('communitythreads')
                .select('*', { count: 'exact', head: true })
                .eq('userid', user.id);

            // 2. Get total likes received (this requires a join or a specific function, usually complex in raw supabase without a view)
            // For now, let's get the number of likes the user HAS GIVEN as a proxy or just stick to post count if strictly following mobile
            // Actually, let's just get the count of posts for now as the most reliable stat.

            const daysJoined = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

            setStats([
                { label: 'Conversations', value: (threadCount || 0).toString(), icon: <MessageSquare size={16} /> },
                { label: 'Likes Given', value: '...', icon: <Heart size={16} /> }, // Placeholder for complex query
                { label: 'Days Joined', value: daysJoined.toString(), icon: <Clock size={16} /> }
            ]);

            // 3. Fetch recent activity (latest threads)
            const { data: threads } = await supabase
                .from('communitythreads')
                .select('*')
                .eq('userid', user.id)
                .order('createdat', { ascending: false })
                .limit(5);

            if (threads) {
                setRecentActivity(threads.map(t => ({
                    id: t.id,
                    type: 'post',
                    title: `Posted in ${t.category}`,
                    subtitle: `"${t.title.substring(0, 40)}${t.title.length > 40 ? '...' : ''}"`,
                    time: new Date(t.createdat).toLocaleDateString()
                })));
            }
        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <motion.div
                    className="profile-header-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="profile-avatar-large">
                        {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="" />
                        ) : (
                            <User size={64} color="white" />
                        )}
                    </div>
                    <div className="profile-info">
                        <h1>{user.user_metadata?.full_name || user.email?.split('@')[0]}</h1>
                        <p>{user.email}</p>
                    </div>

                    <div className="profile-stats">
                        {stats.map(stat => (
                            <div key={stat.label} className="stat-item">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="profile-actions">
                        <button className="profile-btn secondary">
                            <Settings size={18} />
                            Edit Profile
                        </button>
                        <button className="profile-btn secondary" onClick={handleSignOut}>
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                <div className="profile-section">
                    <h2>Recent Activity</h2>
                    <div className="activity-list">
                        {recentActivity.length > 0 ? (
                            recentActivity.map(item => (
                                <div key={item.id} className="activity-item">
                                    <div className="activity-icon">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="activity-content">
                                        <div style={{ color: 'white', fontWeight: 600 }}>{item.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.subtitle} • {item.time}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
