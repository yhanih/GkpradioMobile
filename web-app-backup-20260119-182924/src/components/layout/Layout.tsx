import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingNavbar from './FloatingNavbar';
import Footer from './Footer';
import GlobalAudioPlayer from '../audio/GlobalAudioPlayer';
import './Layout.css';

const Layout = () => {
    return (
        <div className="app-layout">
            <FloatingNavbar />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
            <GlobalAudioPlayer />
        </div>
    );
};

export default Layout;
