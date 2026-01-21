import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlayCircle, Plus, Edit2, Trash2, Search, Mic, Film } from 'lucide-react';

const MediaLibrary = () => {
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'podcasts' | 'videos'>('podcasts');

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        const [episodesData, videosData] = await Promise.all([
            supabase.from('episodes').select('*').order('createdat', { ascending: false }),
            supabase.from('videos').select('*').order('created_at', { ascending: false })
        ]);

        setEpisodes(episodesData.data || []);
        setVideos(videosData.data || []);
        setLoading(false);
    };

    return (
        <div className="animate-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Media Library</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Upload and manage your podcasts and videos.</p>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600 }}>
                    <Plus size={20} />
                    Add {activeTab === 'podcasts' ? 'Episode' : 'Video'}
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('podcasts')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        backgroundColor: activeTab === 'podcasts' ? 'var(--primary)' : 'var(--surface)',
                        color: activeTab === 'podcasts' ? 'white' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Mic size={18} /> Podcasts
                </button>
                <button
                    onClick={() => setActiveTab('videos')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        backgroundColor: activeTab === 'videos' ? 'var(--primary)' : 'var(--surface)',
                        color: activeTab === 'videos' ? 'white' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Film size={18} /> Videos
                </button>
            </div>

            <div className="glass" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Content</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Category</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Duration</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Published</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading media...</td></tr>
                        ) : (activeTab === 'podcasts' ? episodes : videos).length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No items found.</td></tr>
                        ) : (
                            (activeTab === 'podcasts' ? episodes : videos).map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
                                            <img src={item.thumbnailurl || item.thumbnail_url || 'https://via.placeholder.com/48'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.925rem' }}>{item.title}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.author || item.category}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {item.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(item.createdat || item.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button style={{ color: 'var(--text-muted)' }}><Edit2 size={18} /></button>
                                            <button style={{ color: 'var(--error)' }}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MediaLibrary;
