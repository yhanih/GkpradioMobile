import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAudio } from '../context/AudioContext';
import { Search, Play, Clock, Calendar, Mic2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Podcasts.css';

interface Episode {
    id: string;
    title: string;
    description: string;
    audio_url: string;
    thumbnail_url?: string;
    author?: string;
    category?: string;
    duration?: number;
    created_at: string;
}

const Podcasts = () => {
    const { playEpisode, currentEpisode, isPlaying } = useAudio();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('episodes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setEpisodes(data || []);
            } catch (err) {
                console.error('Error fetching episodes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodes();
    }, []);

    const categories = ['All', ...Array.from(new Set(episodes.map(e => e.category || 'General')))];

    const filteredEpisodes = episodes.filter(episode => {
        const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            episode.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || episode.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '30:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="podcasts-page">
            <div className="podcasts-container">
                <header className="media-header">
                    <div className="media-title">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            Podcast Archive
                        </motion.h1>
                        <p>Deep dives into scripture, faith, and life.</p>
                    </div>

                    <div className="search-wrap">
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search episodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </header>

                <div className="filter-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '100px',
                                color: 'white',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="podcast-list">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="podcast-card-wide skeleton" style={{ height: '200px', opacity: 0.3 }}></div>
                            ))
                        ) : filteredEpisodes.length > 0 ? (
                            filteredEpisodes.map((episode, index) => (
                                <motion.div
                                    key={episode.id}
                                    className="podcast-card-wide"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => playEpisode({
                                        id: episode.id,
                                        title: episode.title,
                                        audio_url: episode.audio_url,
                                        image_url: episode.thumbnail_url,
                                        author_name: episode.author
                                    })}
                                >
                                    <div className="podcast-art">
                                        <img src={episode.thumbnail_url || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400'} alt={episode.title} />
                                        <div className="play-overlay">
                                            <div className="play-btn-circle" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {currentEpisode?.id === episode.id && isPlaying ? <Clock size={32} color="white" /> : <Play size={32} color="white" style={{ marginLeft: '4px' }} />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="podcast-content">
                                        <div className="podcast-meta-top">
                                            <span>{episode.category || 'General'}</span>
                                            <span>•</span>
                                            <span>{episode.author || 'GKP Ministry'}</span>
                                        </div>
                                        <div className="podcast-info-main">
                                            <h3>{episode.title}</h3>
                                            <p>{episode.description}</p>
                                        </div>
                                        <div className="podcast-meta-bottom">
                                            <div className="meta-item">
                                                <Calendar size={14} />
                                                {new Date(episode.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="meta-item">
                                                <Clock size={14} />
                                                {formatDuration(episode.duration)}
                                            </div>
                                            <div className="meta-item">
                                                <Mic2 size={14} />
                                                Audio Episode
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', paddingRight: '2rem' }}>
                                        <ChevronRight size={24} color="var(--text-muted)" />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <h3>No episodes found</h3>
                                <p>Try adjusting your search or category filter.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div >
        </div >
    );
};

export default Podcasts;
