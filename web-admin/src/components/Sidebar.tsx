import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Radio,
    PlayCircle,
    Users,
    MessageSquare,
    Bell,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Live Events', path: '/live', icon: Radio },
        { name: 'Media Library', path: '/media', icon: PlayCircle },
        { name: 'Community', path: '/community', icon: MessageSquare },
        { name: 'Notifications', path: '/notifications', icon: Bell },
    ];

    return (
        <aside style={{ width: '280px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>GKP Admin</h2>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.875rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                        })}
                    >
                        <item.icon size={20} style={{ marginRight: '0.75rem' }} />
                        <span style={{ flex: 1 }}>{item.name}</span>
                        {item.path === window.location.pathname && <ChevronRight size={16} />}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', borderRadius: '8px', color: 'var(--error)', backgroundColor: 'transparent', fontWeight: 500, fontSize: '0.875rem' }}
                >
                    <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
