import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { X, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CommunityComposer.css';

interface CommunityComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CommunityComposer: React.FC<CommunityComposerProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ['General', 'Testimonies', 'Prayer Requests', 'Biblical Wisdom', 'Fellowship'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: submitError } = await supabase.from('communitythreads').insert({
                userid: user.id,
                title: title.trim(),
                content: content.trim(),
                category: category,
                privacy_level: 'public',
                is_anonymous: false
            });

            if (submitError) throw submitError;

            setTitle('');
            setContent('');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.message || 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="composer-overlay" onClick={onClose}>
                <motion.div
                    className="composer-modal"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="composer-header">
                        <h2>New Conversation</h2>
                        <button className="close-composer-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="composer-body">
                        {error && (
                            <div className="error-banner" style={{ display: 'flex', gap: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem' }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="composer-group">
                            <label>Category</label>
                            <div className="category-selector">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`category-chip ${category === cat ? 'active' : ''}`}
                                        onClick={() => setCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="composer-group">
                            <label>Title</label>
                            <input
                                className="composer-input"
                                type="text"
                                placeholder="Give your post a clear title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="composer-group">
                            <label>What's on your heart?</label>
                            <textarea
                                className="composer-textarea"
                                placeholder="Share your testimony, prayer request, or wisdom..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                maxLength={1000}
                                required
                            />
                        </div>
                    </form>

                    <div className="composer-footer">
                        <button className="cancel-post-btn" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button
                            className="submit-post-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                        >
                            {isSubmitting ? 'Posting...' : (
                                <>
                                    <Send size={18} />
                                    Post to Community
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CommunityComposer;
