import React, { useEffect, useState } from 'react';
import { HeroSection } from '../components/hero/HeroSection';
import { AboutSection } from '../components/sections/AboutSection';
import { ProgramsSection } from '../components/sections/ProgramsSection';
import { ListenSection } from '../components/sections/ListenSection';
import { ContactSection } from '../components/sections/ContactSection';
import ScheduleCarousel from '../components/schedule/ScheduleCarousel';
import CommunityPreview from '../components/community/CommunityPreview';
import SponsorCarousel from '../components/layout/SponsorCarousel';
import { Mic, ChevronRight } from 'lucide-react';
import './Home.css';

const Home = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load simulation if needed, or real data fetch
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="home-loading">
                <div className="loader-orb"></div>
            </div>
        );
    }

    return (
        <div className="home-page-highres">
            {/* HERO SECTION */}
            <HeroSection />

            {/* ABOUT SECTION */}
            <AboutSection />

            {/* PROGRAMS SECTION */}
            <ProgramsSection />

            {/* LISTEN SECTION with Audio Player */}
            <ListenSection />

            {/* SCHEDULE CAROUSEL SECTION */}
            <ScheduleCarousel />

            {/* COMMUNITY PREVIEW SECTION */}
            <CommunityPreview />

            {/* CONTACT SECTION */}
            <ContactSection />

            {/* FAITH ON DEMAND */}
            <section className="faith-on-demand">
                <div className="container">
                    <h2 className="section-title-center">Faith on Demand: Listen Everywhere</h2>
                    <p className="section-subtitle-center">Stream sermons, prayers, and community conversations on any platform</p>

                    <div className="streaming-links">
                        <StreamingBtn icon="spotify" label="Spotify" />
                        <StreamingBtn icon="apple" label="Apple Podcasts" />
                        <StreamingBtn icon="soundcloud" label="SoundCloud" />
                        <StreamingBtn icon="youtube" label="YouTube" />
                    </div>
                </div>
            </section>

            {/* SPONSORS CAROUSEL */}
            <SponsorCarousel />
        </div>
    );
};

// Helper Components
const StreamingBtn = ({ icon, label }: any) => (
    <a href="#" className="streaming-btn">
        <div className="s-icon-wrap">
            <Mic size={20} />
        </div>
        <div className="s-text">
            <span className="s-label">{label}</span>
            <span className="s-sub">Listen now <ChevronRight size={12} /></span>
        </div>
    </a>
);

export default Home;
