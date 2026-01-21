import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Heart, Clock, Users, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import './CommunityPreview.css';

interface Discussion {
    id: string;
    title: string;
    userid: string;
    category: string;
    comment_count: number;
    createdat: string;
    content: string;
    isHot?: boolean;
    username?: string;
    users?: {
        username: string;
    };
}

const CommunityPreview = () => {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedDiscussions();
    }, []);

    const fetchFeaturedDiscussions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('communitythreads')
                .select(`
          *,
          users:userid (
            username
          )
        `)
                .limit(3)
                .order('createdat', { ascending: false });

            if (error) throw error;

            if (data) {
                // Mock some "Hot" status for visual variety if needed, 
                // or just use latest.
                const enhancedData = data.map((d, i) => ({
                    ...d,
                    isHot: i === 0 || d.comment_count > 10
                }));
                setDiscussions(enhancedData);
            }
        } catch (err) {
            console.error('Error fetching community preview:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Prayer Requests': return "🙏";
            case 'Testimonies': return "✨";
            case 'Youth Voices': return "🎓";
            case 'Biblical Wisdom': return "📖";
            default: return "💬";
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return date.toLocaleDateString();
    };

    return (
        <section className="community-preview-section">
            <div className="container">
                <div className="ministry-indicator-wrap">
                    <div className="ministry-badge">
                        <Heart size={14} />
                        <span>Ministry Fields</span>
                    </div>
                </div>

                <div className="section-header">
                    <h2 className="section-title">"Ministry Fields": Share Stories, Request Prayers & Grow Together</h2>
                    <p className="section-subtitle">
                        Join 2,500+ believers sharing authentic testimonies, lifting prayers, and
                        building community. Your voice matters here.
                    </p>
                </div>

                <div className="featured-header">
                    <h3 className="featured-title">Featured Discussions</h3>
                    <Link href="/community" className="see-more-link">
                        See More
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="discussions-grid">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="discussion-skeleton"></div>)
                    ) : (
                        discussions.map((discussion) => (
                            <div key={discussion.id} className="discussion-card">
                                <div className="card-top">
                                    <div className="category-wrap">
                                        <span className="cat-icon">{getCategoryIcon(discussion.category)}</span>
                                        <span className="cat-badge">{discussion.category}</span>
                                    </div>
                                    {discussion.isHot && (
                                        <span className="hot-badge">Hot</span>
                                    )}
                                </div>

                                <h3 className="discussion-title">{discussion.title}</h3>
                                <p className="discussion-excerpt">{discussion.content}</p>

                                <div className="card-footer">
                                    <div className="user-time-row">
                                        <span className="author-name">@{discussion.users?.username || 'member'}</span>
                                        <div className="time-ago">
                                            <Clock size={12} />
                                            <span>{formatTimeAgo(discussion.createdat)}</span>
                                        </div>
                                    </div>

                                    <div className="stats-actions-row">
                                        <div className="stat-item">
                                            <MessageCircle size={16} />
                                            <span>{discussion.comment_count || 0} replies</span>
                                        </div>

                                        <Link to="/community" className="join-btn">
                                            Join Discussion
                                            <MessageCircle size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="community-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrap icon-primary">
                            <Users size={24} />
                        </div>
                        <div className="stat-value">2.5K+</div>
                        <div className="stat-label">Community Members</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-wrap icon-accent">
                            <MessageCircle size={24} />
                        </div>
                        <div className="stat-value">8.2K</div>
                        <div className="stat-label">Discussions</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-wrap icon-error">
                            <Heart size={24} />
                        </div>
                        <div className="stat-value">45K</div>
                        <div className="stat-label">Prayer Requests</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-wrap icon-info">
                            <Clock size={24} />
                        </div>
                        <div className="stat-value">24/7</div>
                        <div className="stat-label">Community Support</div>
                    </div>
                </div>

                <div className="join-cta-wrap">
                    <Link to="/community" className="btn-primary-large">
                        <Users size={20} />
                        Join the Community
                    </Link>
                    <p className="cta-note">Share your story, ask for prayer, and connect with believers worldwide</p>
                </div>
            </div>
        </section>
    );
};

export default CommunityPreview;
