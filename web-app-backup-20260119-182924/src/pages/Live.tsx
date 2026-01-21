import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { fetchNowPlaying } from '../lib/azuracast';
import { supabase } from '../lib/supabase';
import { Play, Pause, Radio, Calendar, Bell, Clock, Users, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Live.css';

interface LiveEvent {
    id: string;
    title: string;
    description?: string;
    scheduled_start: string;
    scheduled_end?: string;
    host?: string;
    category?: string;
}

const Live = () => {
    const { isPlaying, togglePlayback, nowPlaying, isLoading } = useAudio();
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reminders, setReminders] = useState<Set<string>>(new Set());

    const loadReminders = useCallback(() => {
        try {
            const stored = localStorage.getItem('live_event_reminders');
            if (stored) {
                const parsed = JSON.parse(stored);
                setReminders(new Set(parsed));
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    }, []);

    const saveReminder = useCallback((eventId: string) => {
        const newReminders = new Set(reminders).add(eventId);
        setReminders(newReminders);
        localStorage.setItem('live_event_reminders', JSON.stringify([...newReminders]));
        alert(`Reminder set for this event! We'll notify you 15 minutes before it starts.`);
    }, [reminders]);

    const removeReminder = useCallback((eventId: string) => {
        const newReminders = new Set(reminders);
        newReminders.delete(eventId);
        setReminders(newReminders);
        localStorage.setItem('live_event_reminders', JSON.stringify([...newReminders]));
        alert('Reminder removed.');
    }, [reminders]);

    const fetchEvents = useCallback(async () => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('live_events')
                .select('*')
                .order('scheduled_start', { ascending: true });

            if (fetchError) throw fetchError;

            // Filter out past events (optional - or show recent past events)
            const now = new Date();
            const upcomingEvents = (data || []).filter(
                (event: LiveEvent) => new Date(event.scheduled_start) > now
            );

            setLiveEvents(upcomingEvents);
        } catch (err: any) {
            console.error('Error fetching live events:', err);
            setError(err.message || 'Failed to load live events');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadReminders();
        fetchEvents();
    }, [fetchEvents, loadReminders]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getTimeUntil = (dateString: string) => {
        const now = new Date();
        const eventDate = new Date(dateString);
        const diff = eventDate.getTime() - now.getTime();

        if (diff <= 0) return 'Live Now';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const addToCalendar = (event: LiveEvent) => {
        const startDate = new Date(event.scheduled_start);
        const endDate = event.scheduled_end 
            ? new Date(event.scheduled_end) 
            : new Date(startDate.getTime() + 60 * 60 * 1000);

        const formatDateForICS = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//GKP Radio//Live Event//EN',
            'BEGIN:VEVENT',
            `DTSTART:${formatDateForICS(startDate)}`,
            `DTEND:${formatDateForICS(endDate)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description || 'GKP Radio Live Event'}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
        link.click();
        URL.revokeObjectURL(url);

        alert(`"${event.title}" has been added to your calendar.`);
    };

    if (loading) {
        return (
            <div className="live-page">
                <div className="live-loading">
                    <Loader2 className="spinner" size={48} />
                    <p>Loading live schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="live-page">
            <div className="live-container">
                {/* Hero Section with Now Playing */}
                <section className="live-hero">
                    <motion.div
                        className="live-player-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="live-player-header">
                            <div className="live-badge">
                                <div className="live-indicator"></div>
                                <span>LIVE NOW</span>
                            </div>
                            <button 
                                className="refresh-btn"
                                onClick={onRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                            </button>
                        </div>

                        <div className="now-playing-content">
                            <div className="now-playing-art">
                                {nowPlaying?.now_playing.song.art ? (
                                    <img 
                                        src={nowPlaying.now_playing.song.art} 
                                        alt={nowPlaying.now_playing.song.title}
                                    />
                                ) : (
                                    <div className="art-placeholder">
                                        <Radio size={48} />
                                    </div>
                                )}
                            </div>

                            <div className="now-playing-info">
                                <h2>{nowPlaying?.now_playing.song.title || 'GKP Radio'}</h2>
                                <p className="artist">{nowPlaying?.now_playing.song.artist || 'Broadcasting Live'}</p>
                                <p className="station-name">{nowPlaying?.station.name || 'GKP Radio'}</p>

                                <div className="listener-count">
                                    <Users size={16} />
                                    <span>{nowPlaying?.listeners.current || 0} listeners</span>
                                </div>

                                <button 
                                    className="play-live-btn"
                                    onClick={togglePlayback}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="spinner" size={24} />
                                    ) : isPlaying ? (
                                        <Pause size={24} fill="white" />
                                    ) : (
                                        <Play size={24} fill="white" />
                                    )}
                                    {isPlaying ? 'Pause Live' : 'Play Live'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-banner">
                                <p>{error}</p>
                            </div>
                        )}
                    </motion.div>
                </section>

                {/* Upcoming Events Section */}
                <section className="upcoming-events">
                    <div className="section-header">
                        <h2>Upcoming Live Events</h2>
                        <p>Join us for special broadcasts, teachings, and community gatherings</p>
                    </div>

                    {liveEvents.length === 0 ? (
                        <div className="empty-events">
                            <Calendar size={48} />
                            <h3>No upcoming events</h3>
                            <p>Check back soon for scheduled live events.</p>
                        </div>
                    ) : (
                        <div className="events-grid">
                            <AnimatePresence>
                                {liveEvents.map((event, index) => {
                                    const hasReminder = reminders.has(event.id);
                                    const timeUntil = getTimeUntil(event.scheduled_start);
                                    const isSoon = timeUntil.includes('h') || timeUntil.includes('m') || timeUntil === 'Live Now';

                                    return (
                                        <motion.div
                                            key={event.id}
                                            className="event-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="event-header">
                                                <div className={`event-time-badge ${isSoon ? 'soon' : ''}`}>
                                                    <Clock size={14} />
                                                    <span>{timeUntil}</span>
                                                </div>
                                                {hasReminder && (
                                                    <div className="reminder-badge">
                                                        <Bell size={14} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="event-content">
                                                <h3>{event.title}</h3>
                                                {event.description && (
                                                    <p className="event-description">{event.description}</p>
                                                )}

                                                <div className="event-meta">
                                                    <div className="event-date">
                                                        <Calendar size={16} />
                                                        <span>
                                                            {formatDate(event.scheduled_start)} • {formatTime(event.scheduled_start)}
                                                            {event.scheduled_end && ` - ${formatTime(event.scheduled_end)}`}
                                                        </span>
                                                    </div>
                                                    {event.host && (
                                                        <div className="event-host">
                                                            <Users size={16} />
                                                            <span>{event.host}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="event-actions">
                                                <button
                                                    className={`action-btn ${hasReminder ? 'active' : ''}`}
                                                    onClick={() => hasReminder ? removeReminder(event.id) : saveReminder(event.id)}
                                                >
                                                    <Bell size={18} fill={hasReminder ? 'currentColor' : 'none'} />
                                                    {hasReminder ? 'Reminder Set' : 'Set Reminder'}
                                                </button>
                                                <button
                                                    className="action-btn secondary"
                                                    onClick={() => addToCalendar(event)}
                                                >
                                                    <ExternalLink size={18} />
                                                    Add to Calendar
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Live;
