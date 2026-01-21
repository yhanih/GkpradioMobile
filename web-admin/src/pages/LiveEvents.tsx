import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, ExternalLink } from 'lucide-react';

const LiveEvents = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('live_events')
            .select('*')
            .order('scheduled_start', { ascending: false });

        if (error) console.error('Error fetching events:', error);
        else setEvents(data || []);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('live_events')
            .update({ status })
            .eq('id', id);

        if (error) alert('Error updating status');
        else fetchEvents();
    };

    return (
        <div className="animate-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Live Events</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your radio broadcasts and special services.</p>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600 }}>
                    <Plus size={20} />
                    Create Event
                </button>
            </header>

            <div className="glass" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Event Title</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Scheduled For</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Video URL</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No events found.</td></tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.925rem' }}>{event.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.description?.substring(0, 40)}...</p>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: event.status === 'live' ? '#ef444420' : event.status === 'scheduled' ? '#3b82f620' : '#6b728020',
                                            color: event.status === 'live' ? '#ef4444' : event.status === 'scheduled' ? '#3b82f6' : '#6b7280'
                                        }}>
                                            {event.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(event.scheduled_start).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        {event.video_url ? (
                                            <a href={event.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                                                Link <ExternalLink size={14} />
                                            </a>
                                        ) : <span style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Missing URL</span>}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button style={{ color: 'var(--text-muted)' }}><Edit2 size={18} /></button>
                                            <button
                                                onClick={() => handleUpdateStatus(event.id, event.status === 'live' ? 'ended' : 'live')}
                                                style={{ color: event.status === 'live' ? 'var(--error)' : 'var(--primary)' }}
                                            >
                                                {event.status === 'live' ? 'Stop' : 'Go Live'}
                                            </button>
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

export default LiveEvents;
