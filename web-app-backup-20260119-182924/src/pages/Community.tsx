import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Heart, MessageCircle, User, Share2, MoreHorizontal, Search, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CommunityComposer from '../components/community/CommunityComposer';
import './Community.css';

interface ThreadWithUser {
    id: string;
    title: string;
    content: string;
    category: string;
    createdat: string;
    userid: string;
    username?: string;
    like_count: number;
    comment_count: number;
    user_has_liked?: boolean;
    users?: {
        username: string;
        avatarurl: string;
        fullname: string;
    };
}

const Community = () => {
    const { user } = useAuth();
    const [threads, setThreads] = useState<ThreadWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { id: 'all', label: 'All Feed' },
        { id: 'Testimonies', label: 'Testimonies' },
        { id: 'Prayer Requests', label: 'Prayer Requests' },
        { id: 'General', label: 'General' },
        { id: 'Biblical Wisdom', label: 'Wisdom' }
    ];

    // For infinite scroll
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    const fetchThreads = useCallback(async (isNextPage = false) => {
        try {
            if (!isNextPage) setLoading(true);

            let query = supabase
                .from('communitythreads')
                .select(`
                    *,
                    users:userid (
                        username,
                        avatarurl,
                        fullname
                    )
                `);

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
            }

            if (sortBy === 'newest') {
                query = query.order('createdat', { ascending: false });
            } else {
                query = query.order('like_count', { ascending: false });
            }

            // Pagination logic
            if (isNextPage && threads.length > 0) {
                const lastThread = threads[threads.length - 1];
                if (sortBy === 'newest') {
                    query = query.lt('createdat', lastThread.createdat);
                } else {
                    query = query.lt('like_count', lastThread.like_count);
                }
            }

            const { data, error } = await query.limit(10);

            if (error) throw error;

            let threadsData = data || [];

            if (threadsData.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (user && threadsData.length > 0) {
                const { data: likesData } = await supabase
                    .from('community_thread_likes')
                    .select('thread_id')
                    .eq('user_id', user.id)
                    .in('thread_id', threadsData.map(t => t.id));

                const likedIds = new Set(likesData?.map(l => l.thread_id) || []);
                threadsData = threadsData.map(t => ({
                    ...t,
                    user_has_liked: likedIds.has(t.id)
                }));
            }

            setThreads(prev => isNextPage ? [...prev, ...threadsData] : threadsData);
        } catch (err) {
            console.error('Error fetching threads:', err);
        } finally {
            setLoading(false);
        }
    }, [user, activeCategory, sortBy, threads, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchThreads();
        }, 300);
        return () => clearTimeout(timer);
    }, [activeCategory, sortBy, searchTerm]);

    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchThreads(true);
        }
    }, [inView, hasMore, loading, fetchThreads]);

    useEffect(() => {
        const channel = supabase
            .channel('community-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communitythreads' }, (payload) => {
                const newThread = payload.new as ThreadWithUser;
                if (activeCategory === 'all' || newThread.category === activeCategory) {
                    fetchThreads();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeCategory, fetchThreads]);

    const handleLike = async (threadId: string, currentlyLiked: boolean) => {
        if (!user) {
            alert('Please sign in to like posts');
            return;
        }

        setThreads(prev => prev.map(t => {
            if (t.id === threadId) {
                return {
                    ...t,
                    user_has_liked: !currentlyLiked,
                    like_count: currentlyLiked ? t.like_count - 1 : t.like_count + 1
                };
            }
            return t;
        }));

        try {
            if (currentlyLiked) {
                await supabase.from('community_thread_likes').delete().eq('thread_id', threadId).eq('user_id', user.id);
                const { data } = await supabase.from('communitythreads').select('like_count').eq('id', threadId).single();
                await supabase.from('communitythreads').update({ like_count: Math.max((data?.like_count || 1) - 1, 0) }).eq('id', threadId);
            } else {
                await supabase.from('community_thread_likes').insert({ thread_id: threadId, user_id: user.id });
                const { data } = await supabase.from('communitythreads').select('like_count').eq('id', threadId).single();
                await supabase.from('communitythreads').update({ like_count: (data?.like_count || 0) + 1 }).eq('id', threadId);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            fetchThreads();
        }
    };

    return (
        <div className="community-page">
            <div className="community-layout">
                <main className="community-feed">
                    <div className="feed-header">
                        <div className="feed-title">
                            <h1>Community Feed</h1>
                            <p>Connect, share, and grow with fellow believers.</p>
                        </div>
                        <div className="feed-search-bar" style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.6rem 1rem 0.6rem 2.5rem', color: 'white', width: '260px' }}
                            />
                        </div>
                    </div>

                    <div className="feed-filters">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="post-composer" onClick={() => setIsComposerOpen(true)}>
                        <div className="composer-avatar">
                            {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" /> : <User size={24} style={{ margin: '10px', color: 'white' }} />}
                        </div>
                        <div className="composer-placeholder">
                            What's on your heart, {user?.user_metadata?.username || 'member'}?
                        </div>
                    </div>

                    <AnimatePresence>
                        {threads.map((thread, index) => (
                            <motion.div
                                key={thread.id}
                                className="thread-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="thread-header">
                                    <div className="composer-avatar" style={{ width: '40px', height: '40px' }}>
                                        {thread.users?.avatarurl ? <img src={thread.users.avatarurl} alt="" /> : <User size={20} style={{ margin: '10px', color: 'white' }} />}
                                    </div>
                                    <div className="user-info">
                                        <h4>@{thread.users?.username || 'GKP member'}</h4>
                                        <p>{new Date(thread.createdat).toLocaleDateString()}</p>
                                    </div>
                                    <div className="thread-category">
                                        {thread.category}
                                    </div>
                                    <button className="icon-btn" style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                <h3 className="thread-title">{thread.title}</h3>
                                <p className="thread-content">{thread.content}</p>

                                <div className="thread-actions">
                                    <button
                                        className={`action-btn ${thread.user_has_liked ? 'liked' : ''}`}
                                        onClick={() => handleLike(thread.id, !!thread.user_has_liked)}
                                    >
                                        <Heart size={20} fill={thread.user_has_liked ? 'currentColor' : 'none'} />
                                        <span>{thread.like_count || 0}</span>
                                    </button>
                                    <button className="action-btn">
                                        <MessageCircle size={20} />
                                        <span>{thread.comment_count || 0}</span>
                                    </button>
                                    <button className="action-btn">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Infinite Scroll Trigger */}
                    <div ref={ref} style={{ height: '20px', margin: '2rem 0' }}>
                        {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading more conversations...</p>}
                    </div>
                </main>

                <aside className="community-sidebar">
                    <div className="sidebar-widget">
                        <div className="widget-title">
                            Community Stats
                            <Users size={16} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="stat-pill" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>2.4k</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Believers</div>
                            </div>
                            <div className="stat-pill" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>120</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Testimonies</div>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-widget">
                        <div className="widget-title">
                            Trending Topics
                            <TrendingUp size={16} />
                        </div>
                        <div className="trending-item">
                            <span className="trending-category">Spirituality</span>
                            <span className="trending-name">Overcoming Fear</span>
                            <span className="trending-count">42 active conversations</span>
                        </div>
                        <div className="trending-item">
                            <span className="trending-category">Testimony</span>
                            <span className="trending-name">Financial Breakthrough</span>
                            <span className="trending-count">28 active conversations</span>
                        </div>
                        <div className="trending-item">
                            <span className="trending-category">Prayer</span>
                            <span className="trending-name">Healing for Loved Ones</span>
                            <span className="trending-count">19 active conversations</span>
                        </div>
                    </div>
                </aside>
            </div>

            <CommunityComposer
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                onSuccess={() => fetchThreads()}
            />
        </div>
    );
};

export default Community;
