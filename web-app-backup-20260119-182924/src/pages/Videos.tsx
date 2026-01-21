import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Play, Clock, X, Youtube, Share2, MoreVertical } from 'lucide-react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import './Videos.css';

interface Video {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    category?: string;
    duration?: number;
    created_at: string;
}

const Videos = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setVideos(data || []);
            } catch (err) {
                console.error('Error fetching videos:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const filteredVideos = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '5:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="videos-page">
            <div className="videos-container">
                <header className="media-header">
                    <div className="media-title">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            Video Library
                        </motion.h1>
                        <p>Watch and be transformed by the word.</p>
                    </div>

                    <div className="search-wrap">
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </header>

                <div className="video-grid">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="super-card-skeleton" style={{ height: '280px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}></div>
                            ))
                        ) : filteredVideos.map((video, index) => (
                            <motion.div
                                key={video.id}
                                className="super-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedVideo(video)}
                            >
                                <div className="card-image-wrap">
                                    <img src={video.thumbnail_url || 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600'} alt={video.title} />
                                    <div className="card-overlay">
                                        <div className="play-button-small">
                                            <Play size={24} fill="white" />
                                        </div>
                                    </div>
                                    <div className="duration-badge">{formatDuration(video.duration)}</div>
                                </div>
                                <div className="card-content">
                                    <div className="card-tag">{video.category || 'Ministry'}</div>
                                    <h3>{video.title}</h3>
                                    <p>{video.description}</p>
                                    <div className="card-footer">
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <div className="video-player-overlay" onClick={() => setSelectedVideo(null)}>
                        <button className="close-player-btn">
                            <X size={24} />
                        </button>
                        <motion.div
                            className="video-player-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="video-player-wrap">
                                <ReactPlayer
                                    url={selectedVideo.video_url}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                />
                            </div>
                            <div className="video-info-overlay">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h2>{selectedVideo.title}</h2>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="icon-btn-plain"><Share2 size={20} /></button>
                                        <button className="icon-btn-plain"><MoreVertical size={20} /></button>
                                    </div>
                                </div>
                                <p>{selectedVideo.description}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Videos;
