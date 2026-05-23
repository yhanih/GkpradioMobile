import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

const Community = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select(
                `
                *,
                reporter:profiles!reports_reporter_id_fkey(id, full_name)
            `
            )
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            const fallback = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (!fallback.error) setReports(fallback.data || []);
        } else {
            setReports(data || []);
        }
        setLoading(false);
    };

    const handleResolveReport = async (id: string) => {
        const { error } = await supabase
            .from('reports')
            .update({ status: 'resolved', reviewed_at: new Date().toISOString() })
            .eq('id', id);

        if (error) alert('Error resolving report');
        else fetchReports();
    };

    const handleRemoveReportedContent = async (report: any) => {
        if (!window.confirm('Remove this reported content from the app?')) return;
        try {
            if (report.target_type === 'live_chat_message') {
                const { error } = await supabase
                    .from('live_radio_messages')
                    .delete()
                    .eq('id', report.target_id);
                if (error) throw error;
            } else {
                alert(
                    'For post, comment, or user reports, remove content or suspend the account in Supabase or your admin workflow. Live chat messages can be deleted with this button.'
                );
                return;
            }
            await fetchReports();
        } catch (e: any) {
            alert(e?.message || 'Failed to remove content');
        }
    };

    const targetPreview = (id: string) => {
        const s = String(id || '');
        return s.length > 12 ? `${s.slice(0, 8)}…` : s;
    };

    return (
        <div className="animate-in">
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Moderation Center</h1>
                <p style={{ color: 'var(--text-muted)' }}>Review flagged content and maintain community standards.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Pending Reports</h3>
                        <AlertTriangle size={20} color="var(--error)" />
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700 }}>{reports.filter((r) => r.status === 'pending').length}</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Resolved</h3>
                        <CheckCircle size={20} color="var(--success)" />
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700 }}>{reports.filter((r) => r.status === 'resolved').length}</p>
                </div>
            </div>

            <div className="glass" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Reported Item</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Reason</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Reporter</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Loading reports...
                                </td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No reports in the queue.
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--primary-light)',
                                                    color: 'var(--primary)',
                                                }}
                                            >
                                                {String(report.target_type || '').toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{targetPreview(report.target_id)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>{report.reason}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                            {report.reporter?.full_name || 'Reporter'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {report.reporter?.id ? `id ${targetPreview(report.reporter.id)}` : ''}
                                        </p>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: report.status === 'pending' ? '#ef444420' : '#10b98120',
                                                color: report.status === 'pending' ? '#ef4444' : '#10b981',
                                            }}
                                        >
                                            {String(report.status || '').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            {report.status === 'pending' && (
                                                <button
                                                    type="button"
                                                    title="Mark reviewed"
                                                    onClick={() => handleResolveReport(report.id)}
                                                    style={{ color: 'var(--success)' }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                title={
                                                    report.target_type === 'live_chat_message'
                                                        ? 'Delete chat message'
                                                        : 'Remove reported content (live chat only from here)'
                                                }
                                                onClick={() => void handleRemoveReportedContent(report)}
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <Trash2 size={18} />
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

export default Community;
