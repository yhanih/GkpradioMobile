import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    MessageSquare,
    PlayCircle,
    TrendingUp,
    Clock,
    ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        threads: 0,
        episodes: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersCount, threadsCount, episodesCount] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('communitythreads').select('*', { count: 'exact', head: true }),
                    supabase.from('episodes').select('*', { count: 'exact', head: true }),
                ]);

                setStats({
                    users: usersCount.count || 0,
                    threads: threadsCount.count || 0,
                    episodes: episodesCount.count || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total Users', value: stats.users, icon: Users, color: '#3b82f6' },
        { name: 'Community Threads', value: stats.threads, icon: MessageSquare, color: '#10b981' },
        { name: 'Podcast Episodes', value: stats.episodes, icon: PlayCircle, color: '#8b5cf6' },
        { name: 'Growth Rate', value: '+12%', icon: TrendingUp, color: '#f59e0b' },
    ];

    return (
        <div className="animate-in">
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>System Overview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back to your GKP Radio control center.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {statCards.map((card) => (
                    <div key={card.name} className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: `${card.color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <card.icon color={card.color} size={24} />
                            </div>
                            <ArrowUpRight size={16} color="var(--text-muted)" />
                        </div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>{card.name}</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{loading ? '...' : card.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
                        <Clock size={18} color="var(--text-muted)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ display: 'flex', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, marginRight: '1rem' }}>
                                    {i === 1 ? 'S' : i === 2 ? 'A' : 'M'}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>New Podcast Episode</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 hours ago • by Admin</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>System Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem' }}>Database</span>
                            <span style={{ backgroundColor: '#10b98120', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem' }}>Storage</span>
                            <span style={{ backgroundColor: '#10b98120', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem' }}>Push Service</span>
                            <span style={{ backgroundColor: '#10b98120', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
