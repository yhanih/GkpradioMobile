import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Users, ChevronLeft, ChevronRight, Calendar, MessageSquare, Clock } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import './HeroSection.css';

const scheduleData = [
  {
    title: "Lunch with Jane Peter",
    time: "11:00 AM – 12:00 PM",
    host: "Jane Peter",
    type: "Talk",
    days: "Mon–Fri",
    description: "A lunchtime session to inspire and engage through biblical truths and stories.",
    listeners: 156,
    isLive: true,
  },
  {
    title: "Kingdom Teachings",
    time: "10:00 AM – 11:00 AM",
    host: "Pastor Myles Monroe",
    type: "Preach",
    days: "Mon–Fri",
    description: "Deep dive into biblical principles for kingdom living and spiritual growth.",
    listeners: 342,
    isLive: false,
  },
  {
    title: "Marriage Talk",
    time: "12:00 PM – 1:00 PM",
    host: "Dustin Scott",
    type: "Marriage",
    days: "Tue & Thu",
    description: "Building stronger marriages through faith-centered conversations and guidance.",
    listeners: 128,
    isLive: false,
  },
  {
    title: "Praise & Worship",
    time: "10:00 PM – 12:00 AM",
    host: "Auto-DJ",
    type: "Music",
    days: "Daily",
    description: "Uplifting worship music to end your day in the presence of God.",
    listeners: 89,
    isLive: false,
  },
];

export function HeroSection() {
  const { isPlaying, play, isLoading: audioLoading } = useAudio();
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScheduleIndex((prev) => (prev + 1) % scheduleData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentShow = scheduleData[currentScheduleIndex];

  const nextSlide = () => {
    setCurrentScheduleIndex((prev) => (prev + 1) % scheduleData.length);
  };

  const prevSlide = () => {
    setCurrentScheduleIndex((prev) => (prev - 1 + scheduleData.length) % scheduleData.length);
  };

  const handlePlay = () => {
    if (!isPlaying) {
      play();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Talk': return <MessageSquare className="w-3 h-3" />;
      case 'Preach': return <MessageSquare className="w-3 h-3" />;
      case 'Marriage': return <MessageSquare className="w-3 h-3" />;
      case 'Music': return <MessageSquare className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <section className="hero-section-v0">
      {/* Dark Background with subtle gradients */}
      <div className="hero-bg-gradient-1"></div>
      <div className="hero-bg-gradient-2"></div>
      <div className="hero-bg-gradient-3"></div>

      <div className="hero-content-container">
        <div className="hero-content-inner">
          {/* Top Row - Live Indicator & Quick Stats */}
          <div className="hero-top-row-v0">
            {/* Live Indicator */}
            <div className="hero-live-indicator-v0">
              <span className="live-dot-container">
                <span className="live-ping-animation"></span>
                <span className="live-dot-solid"></span>
              </span>
              <span className="live-text-v0">LIVE NOW</span>
              <span className="live-show-name-v0">Kingdom Teachings with Pastor Myles Monroe</span>
            </div>

            {/* Quick Stats */}
            <div className="hero-stats-row-v0">
              <div className="hero-stat-item-v0">
                <span className="hero-stat-value-v0">2,500+</span>
                <span className="hero-stat-label-v0">Family Members</span>
              </div>
              <div className="hero-stat-item-v0">
                <span className="hero-stat-value-v0">45k+</span>
                <span className="hero-stat-label-v0">Prayers Lifted Up</span>
              </div>
              <div className="hero-stat-item-v0">
                <span className="hero-stat-value-v0">24/7</span>
                <span className="hero-stat-label-v0">Live Ministry</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="hero-main-grid-v0">
            {/* Left - Title & CTA */}
            <div className="hero-left-v0">
              <h1 className="hero-title-v0">
                Welcome to
                <span className="hero-title-gradient-v0"> God Kingdom Principles Radio</span>
              </h1>

              <p className="hero-description-v0">
                Join our community of believers in daily inspiration, powerful testimonies, and life-changing conversations about faith, hope, and love.
              </p>

              <div className="hero-buttons-v0">
                <button
                  onClick={handlePlay}
                  disabled={audioLoading || isPlaying}
                  className={`hero-btn-play-v0 ${isPlaying ? 'playing' : ''}`}
                >
                  <span className="btn-icon-v0">
                    {audioLoading ? (
                      <div className="spinner-small"></div>
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </span>
                  <span>{isPlaying ? "Stop Listening" : "Start Listening"}</span>
                </button>

                <Link to="/community" className="hero-btn-community-v0">
                  <Users className="w-5 h-5" />
                  <span>Join Community</span>
                </Link>
              </div>
            </div>

            {/* Right - Schedule Card Slideshow */}
            <div className="hero-right-v0">
              <div className="schedule-wrapper-v0">
                {/* Daily Schedule Badge */}
                <div className="schedule-badge-v0">
                  <span className="schedule-badge-inner">
                    <Calendar className="w-3 h-3" />
                    Daily Schedule
                  </span>
                </div>

                {/* Schedule Card */}
                <div className="schedule-card-v0">
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="schedule-nav-btn schedule-nav-prev-v0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="schedule-nav-btn schedule-nav-next-v0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Card Content */}
                  <div className="schedule-card-content-v0">
                    {/* Header Row */}
                    <div className="schedule-header-v0">
                      <span className="schedule-type-badge-v0">
                        {getTypeIcon(currentShow.type)}
                        {currentShow.type}
                      </span>
                      <span className="schedule-days-v0">
                        <Clock className="w-3 h-3" />
                        {currentShow.days}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="schedule-title-v0">
                      {currentShow.title}
                    </h3>

                    {/* Meta */}
                    <p className="schedule-meta-v0">
                      {currentShow.time} • {currentShow.host}
                    </p>

                    {/* Visual Box */}
                    <div className="schedule-visual-v0">
                      <div className="schedule-visual-icon-v0">
                        <MessageSquare className="w-12 h-12" />
                      </div>
                      <div className="schedule-visual-time-v0">{currentShow.time}</div>
                      <div className="schedule-visual-days-v0">{currentShow.days}</div>
                      {currentShow.isLive && (
                        <span className="schedule-live-badge-v0">LIVE</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="schedule-description-v0">
                      {currentShow.description}
                    </p>

                    {/* Footer */}
                    <div className="schedule-footer-v0">
                      <div className="schedule-host-v0">
                        <div className="schedule-host-avatar-v0"></div>
                        <span className="schedule-host-name-v0">{currentShow.host}</span>
                      </div>
                      <div className="schedule-listeners-v0">
                        <Users className="w-4 h-4" />
                        {currentShow.listeners}
                      </div>
                    </div>

                    {/* Dots */}
                    <div className="schedule-dots-v0">
                      {scheduleData.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentScheduleIndex(i)}
                          className={`schedule-dot-v0 ${i === currentScheduleIndex ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
