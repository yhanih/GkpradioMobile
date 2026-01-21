import React from 'react';
import { NavLink } from 'react-router-dom';
import { Radio, Mic, Film, MessageSquare, Menu, X } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    const navLinks = [
        { name: 'Home', path: '/', icon: Radio },
        { name: 'Podcasts', path: '/podcasts', icon: Mic },
        { name: 'Videos', path: '/videos', icon: Film },
        { name: 'Community', path: '/community', icon: MessageSquare },
    ];

    return (
        <nav className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid var(--border)' }}>
            <div className="container" style={{ height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="premium-gradient" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                        <Radio size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>GKP Radio</span>
                </NavLink>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-only">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.925rem',
                                fontWeight: 600,
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                transition: 'color 0.2s'
                            })}
                        >
                            <link.icon size={18} />
                            {link.name}
                        </NavLink>
                    ))}
                    <button className="premium-gradient" style={{ padding: '0.625rem 1.5rem', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.39)' }}>
                        Get the App
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} style={{ display: 'none', background: 'none' }} className="mobile-toggle">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="glass" style={{ position: 'absolute', top: '72px', left: 0, right: 0, padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', color: 'var(--text)', fontWeight: 600 }}
                        >
                            <link.icon size={20} />
                            {link.name}
                        </NavLink>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}} />
        </nav>
    );
};

export default Navbar;
