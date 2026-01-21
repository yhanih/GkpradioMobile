import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Mic, Video, Users, User, Bell, Search, ExternalLink, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import logo from '../../assets/logo.png';
import './FloatingNavbar.css';

const FloatingNavbar = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAuthClick = () => {
        if (user) {
            navigate('/profile');
        } else {
            navigate('/auth');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className={`floating-navbar-container ${scrolled ? 'scrolled' : ''}`}>
            <nav className="floating-navbar">

                {/* Left: Logo */}
                <div className="nav-brand-section">
                    <div className="logo-orb">
                        <img src={logo} alt="GKP Logo" className="logo-img" />
                    </div>
                </div>

                {/* Center: Navigation Links */}
                <div className="nav-links-container">
                    <NavLink to="/" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Home
                    </NavLink>
                    <NavLink to="/community" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Community
                    </NavLink>
                    <NavLink to="/live" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Live
                    </NavLink>
                    <NavLink to="/podcasts" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Podcasts
                    </NavLink>
                    <NavLink to="/videos" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Videos
                    </NavLink>
                    <NavLink to="/hub" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
                        Hub
                    </NavLink>
                </div>

                {/* Search (New) */}
                <div className="nav-search-wrap">
                    <Search size={16} className="search-icon" />
                    <input type="text" placeholder="Search..." className="nav-search-input" />
                </div>

                {/* Right: Actions (Pill-in-Pill style) */}
                <div className="nav-actions-section">
                    <DarkModeToggle size="sm" />
                    {user ? (
                        <>
                            <NavLink to="/profile" className="nav-profile-link">
                                <User size={16} />
                            </NavLink>
                            <button className="nav-secondary-action" onClick={handleSignOut} title="Sign Out">
                                <LogOut size={14} />
                            </button>
                        </>
                    ) : (
                        <button className="nav-secondary-action" onClick={handleAuthClick}>
                            Sign In
                        </button>
                    )}
                    <button className="nav-primary-action donate">
                        <Heart size={14} fill="currentColor" />
                        <span>Donate</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default FloatingNavbar;
