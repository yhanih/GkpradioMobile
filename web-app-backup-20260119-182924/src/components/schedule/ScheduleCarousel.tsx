import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, Play, Mic, Users, Volume2 } from "lucide-react";
import './ScheduleCarousel.css';

// Assets
import wakeUpImage from "../../assets/wake-up-morning.jpg";
import triviaImage from "../../assets/trivia.jpg";
import pastorMylesImage from "../../assets/pastor-myles.jpg";
import lunchJaneImage from "../../assets/lunch-jane.jpg";
import marriageImage from "../../assets/marriage.jpg";
import testimoniesImage from "../../assets/testimonies.png";
import braggingKidsImage from "../../assets/bragging-kids.jpg";
import connectHeavenImage from "../../assets/connect-heaven.png";
import youthImage from "../../assets/youth.jpg";
import sheffieldImage from "../../assets/sheffield.jpg";
import moneyTalkImage from "../../assets/money-talk.jpg";
import spouseHeartImage from "../../assets/spouse-heart.jpg";
import meditationImage from "../../assets/meditation.jpg";
import praiseWorshipImage from "../../assets/praise-worship.jpg";

interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    host: string;
    description: string;
    type: 'live' | 'music' | 'talk' | 'worship' | 'marriage' | 'testimony' | 'family' | 'faith' | 'youth' | 'finance' | 'meditation';
    isLive?: boolean;
    listeners?: number;
    day: string;
    duration: string;
    image?: string;
}

const scheduleData: ScheduleItem[] = [
    {
        id: '1',
        title: 'Wake Up Y\'all',
        time: '6:00 AM – 9:00 AM',
        host: 'GKPRadio Morning Team',
        description: 'Start your morning with faith-driven conversation, motivation, and music for the soul.',
        type: 'talk',
        isLive: false,
        listeners: 245,
        day: 'Mon–Fri',
        duration: '3 hours',
        image: wakeUpImage
    },
    {
        id: '2',
        title: 'In Case You Did Not Know',
        time: '9:00 AM – 10:00 AM',
        host: 'GKPRadio Team',
        description: 'Discover surprising facts and insights you might have missed.',
        type: 'talk',
        isLive: false,
        listeners: 189,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: triviaImage
    },
    {
        id: '3',
        title: 'Kingdom Teachings with Pastor Myles Monroe',
        time: '10:00 AM – 11:00 AM',
        host: 'Pastor Myles Monroe',
        description: 'Powerful kingdom-focused teaching on purpose, leadership, and spiritual authority.',
        type: 'talk',
        isLive: false,
        listeners: 198,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: pastorMylesImage
    },
    {
        id: '4',
        title: 'Lunch with Jane Peter',
        time: '11:00 AM – 12:00 PM',
        host: 'Jane Peter',
        description: 'A lunchtime session to inspire and engage through biblical truths and stories.',
        type: 'talk',
        isLive: false,
        listeners: 156,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: lunchJaneImage
    },
    {
        id: '5',
        title: 'Marriage Talk with Dustin Scott',
        time: '12:00 PM – 1:00 PM',
        host: 'Dustin Scott',
        description: 'Strengthen your relationship with honest conversations about love, faith, and growth.',
        type: 'marriage',
        isLive: false,
        listeners: 223,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: marriageImage
    },
    {
        id: '6',
        title: 'Testimonies with Stan Lewis',
        time: '1:00 PM – 2:00 PM',
        host: 'Stan Lewis',
        description: 'Real-life stories of transformation and God\'s faithfulness.',
        type: 'testimony',
        isLive: false,
        listeners: 278,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: testimoniesImage
    },
    {
        id: '7',
        title: 'Bragging on My Kids',
        time: '2:00 PM – 3:00 PM',
        host: 'Community Submission',
        description: 'Celebrate the joys of family and give thanks for loved ones doing amazing things.',
        type: 'family',
        isLive: false,
        listeners: 312,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: braggingKidsImage
    },
    {
        id: '8',
        title: '4-Point Connect to Heaven by Evan',
        time: '3:00 PM – 5:00 PM',
        host: 'Evan',
        description: 'A four-point biblical breakdown to elevate your connection with God.',
        type: 'faith',
        isLive: false,
        listeners: 267,
        day: 'Mon–Fri',
        duration: '2 hours',
        image: connectHeavenImage
    },
    {
        id: '9',
        title: 'Sheffield Family Hour by Pastor George',
        time: '5:00 PM – 6:00 PM',
        host: 'Pastor George',
        description: 'Inspirational teaching and worship from the Sheffield Family Life Center.',
        type: 'worship',
        isLive: false,
        listeners: 445,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: sheffieldImage
    },
    {
        id: '10',
        title: 'Youth Corner by Melissa Burt',
        time: '6:00 PM – 7:00 PM',
        host: 'Melissa Burt',
        description: 'Real talk, music, and testimonies tailored for the next generation of believers.',
        type: 'youth',
        isLive: false,
        listeners: 198,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: youthImage
    },
    {
        id: '11',
        title: 'Let\'s Talk Money by Steve Richards',
        time: '7:00 PM – 8:00 PM',
        host: 'Steve Richards',
        description: 'Financial wisdom rooted in scripture. Build wealth, break debt, and steward well.',
        type: 'finance',
        isLive: false,
        listeners: 334,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: moneyTalkImage
    },
    {
        id: '12',
        title: 'My Spouse, My Heart by Jeff and Suzie Spencer',
        time: '8:00 PM – 9:00 PM',
        host: 'Jeff & Suzie Spencer',
        description: 'Couples share their journey of love, trials, and triumph through God\'s design.',
        type: 'marriage',
        isLive: false,
        listeners: 289,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: spouseHeartImage
    },
    {
        id: '13',
        title: 'Meditation & Relaxation by Joyce Smith',
        time: '9:00 PM – 10:00 PM',
        host: 'Joyce Smith',
        description: 'Unwind with peaceful devotionals, scriptures, and guided meditations.',
        type: 'meditation',
        isLive: false,
        listeners: 156,
        day: 'Mon–Fri',
        duration: '1 hour',
        image: meditationImage
    },
    {
        id: '14',
        title: 'Praise & Worship Music',
        time: '10:00 PM – 12:00 AM',
        host: 'Auto-DJ',
        description: 'A soul-stirring mix of contemporary praise and deep worship.',
        type: 'music',
        isLive: false,
        listeners: 567,
        day: 'Mon–Fri',
        duration: '2 hours',
        image: praiseWorshipImage
    }
];

const ScheduleCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!isAutoPlaying || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % scheduleData.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, isPaused]);

    const goToPrevious = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + scheduleData.length) % scheduleData.length);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % scheduleData.length);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'live': return <Mic size={20} />;
            case 'music': return <Volume2 size={20} />;
            case 'talk': return <Users size={20} />;
            case 'worship': return <Play size={20} />;
            case 'marriage': return <Heart size={20} />;
            case 'testimony': return <Mic size={20} />;
            case 'family': return <Users size={20} />;
            case 'faith': return <Play size={20} />;
            case 'youth': return <Users size={20} />;
            case 'finance': return <Users size={20} />;
            case 'meditation': return <Play size={20} />;
            default: return <Play size={20} />;
        }
    };

    const currentItem = scheduleData[currentIndex];

    return (
        <section className="schedule-carousel-section">
            <div className="container">
                <div className="section-header-center">
                    <h2 className="section-title">Program Schedule</h2>
                    <p className="section-subtitle">
                        Join us for inspiring programs throughout the week. From worship services to faith discussions,
                        there's something for everyone in our community.
                    </p>
                </div>

                <div className="carousel-main-wrapper">
                    <div
                        className="carousel-card-container"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div className="carousel-card-inner">
                            <div className="carousel-bg-overlay"></div>

                            <div className="carousel-content-grid">
                                <div className="program-info-column">
                                    <div className="badge-row">
                                        <span className={`type-badge type-${currentItem.type}`}>
                                            {getTypeIcon(currentItem.type)}
                                            <span className="ml-2 uppercase">{currentItem.type} Show</span>
                                        </span>
                                        {currentItem.isLive && (
                                            <span className="live-now-badge">
                                                🔴 LIVE NOW
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="program-title">{currentItem.title}</h3>

                                    <div className="program-meta-info">
                                        <div className="meta-item">
                                            <Users size={16} />
                                            <span className="host-name">{currentItem.host}</span>
                                        </div>

                                        <div className="meta-row">
                                            <div className="meta-item">
                                                <Clock size={16} />
                                                <span>{currentItem.time}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Calendar size={16} />
                                                <span>{currentItem.day}</span>
                                            </div>
                                        </div>

                                        <div className="duration-info">
                                            <span className="label">Duration:</span> {currentItem.duration}
                                        </div>
                                    </div>

                                    <p className="program-description">{currentItem.description}</p>

                                    {currentItem.listeners && (
                                        <div className="listeners-badge">
                                            <Users size={16} className="text-accent" />
                                            <span className="count">{currentItem.listeners.toLocaleString()}</span>
                                            <span className="label">regular listeners</span>
                                        </div>
                                    )}
                                </div>

                                <div className="visual-column">
                                    <div className="visual-box">
                                        {currentItem.image ? (
                                            <>
                                                <img
                                                    src={currentItem.image}
                                                    alt={currentItem.title}
                                                    className="program-image"
                                                />
                                                <div className="image-overlay"></div>
                                                <div className="image-info">
                                                    <div className="info-time">{currentItem.time}</div>
                                                    <div className="info-day">{currentItem.day}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="visual-placeholder">
                                                <div className="placeholder-icon">
                                                    {getTypeIcon(currentItem.type)}
                                                </div>
                                                <div className="info-time">{currentItem.time}</div>
                                                <div className="info-day">{currentItem.day}</div>
                                            </div>
                                        )}

                                        {currentItem.isLive && (
                                            <div className="on-air-indicator">
                                                <div className="pulse-dot"></div>
                                                <span>ON AIR</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button className="carousel-nav-btn prev" onClick={goToPrevious}>
                                <ChevronLeft size={24} />
                            </button>

                            <button className="carousel-nav-btn next" onClick={goToNext}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="carousel-dots-wrapper">
                        {scheduleData.map((_, index) => (
                            <button
                                key={index}
                                className={`dot-indicator ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsAutoPlaying(false);
                                    setTimeout(() => setIsAutoPlaying(true), 10000);
                                }}
                            />
                        ))}
                    </div>

                    <div className="auto-play-status">
                        {isAutoPlaying ? (
                            <div className="status-item">
                                <div className="indicator-pulse"></div>
                                <span>Auto-advancing</span>
                            </div>
                        ) : (
                            <span>Auto-play paused</span>
                        )}
                    </div>
                </div>

                <div className="full-schedule-cta">
                    <button className="btn-outline">
                        View Full Schedule
                        <Calendar size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ScheduleCarousel;
