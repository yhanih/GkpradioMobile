import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, Play, Mic, Users, Volume2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './ScheduleSlideshow.css';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  host: string;
  description: string;
  type: 'live' | 'music' | 'talk' | 'preach' | 'worship' | 'marriage' | 'testimony' | 'family' | 'faith' | 'youth' | 'finance' | 'meditation';
  isLive?: boolean;
  listeners?: number;
  day: string;
}

const scheduleItems: ScheduleItem[] = [
  {
    id: '1',
    title: 'Wake Up Y\'all',
    time: '6:00 AM – 9:00 AM',
    host: 'GKPRadio Morning Team',
    description: 'Start your morning with faith-driven conversation, motivation, and music for the soul.',
    type: 'talk',
    isLive: false,
    listeners: 245,
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
  },
  {
    id: '3',
    title: 'Kingdom Teachings with Pastor Myles Monroe',
    time: '10:00 AM – 11:00 AM',
    host: 'Pastor Myles Monroe',
    description: 'Powerful kingdom-focused teaching on purpose, leadership, and spiritual authority.',
    type: 'preach',
    isLive: false,
    listeners: 198,
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
  },
  {
    id: '9',
    title: 'Sheffield Family Hour by Pastor George',
    time: '5:00 PM – 6:00 PM',
    host: 'Pastor George',
    description: 'Inspirational teaching and worship from the Sheffield Family Life Center.',
    type: 'preach',
    isLive: false,
    listeners: 445,
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
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
    day: 'Mon–Fri'
  }
];

const ScheduleSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Detect currently playing show based on Kansas City, Missouri time (Central Time)
  const getCurrentShowIndex = () => {
    const now = new Date();
    const kansasCityTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const currentHour = kansasCityTime.getHours();
    
    return scheduleItems.findIndex(item => {
      const [start] = item.time.split(' – ');
      const startHour = parseInt(start.replace(':00', '').replace(' AM', '').replace(' PM', ''));
      const adjustedStartHour = start.includes('PM') && startHour !== 12 ? startHour + 12 : 
                               start.includes('AM') && startHour === 12 ? 0 : startHour;
      
      const [, end] = item.time.split(' – ');
      const endHour = parseInt(end.replace(':00', '').replace(' AM', '').replace(' PM', ''));
      const adjustedEndHour = end.includes('PM') && endHour !== 12 ? endHour + 12 : 
                              end.includes('AM') && endHour === 12 ? 0 : endHour;
      
      if (adjustedEndHour === 0) {
        return currentHour >= adjustedStartHour || currentHour < 24;
      }
      
      return currentHour >= adjustedStartHour && currentHour < adjustedEndHour;
    });
  };

  // Set initial index to current show on mount
  useEffect(() => {
    const liveShowIndex = getCurrentShowIndex();
    if (liveShowIndex !== -1) {
      setCurrentIndex(liveShowIndex);
    }
  }, []);

  // Auto-advance slideshow every 4 seconds, but pause on hover
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % scheduleItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + scheduleItems.length) % scheduleItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % scheduleItems.length);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live': return <Mic className="w-4 h-4" />;
      case 'music': return <Volume2 className="w-4 h-4" />;
      case 'talk': return <Users className="w-4 h-4" />;
      case 'preach': return <Mic className="w-4 h-4" />;
      case 'worship': return <Play className="w-4 h-4" />;
      case 'marriage': return <Heart className="w-4 h-4" />;
      case 'testimony': return <Mic className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      case 'faith': return <Play className="w-4 h-4" />;
      case 'youth': return <Users className="w-4 h-4" />;
      case 'finance': return <Users className="w-4 h-4" />;
      case 'meditation': return <Play className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'live': return { bg: '#ef4444', text: '#ffffff' };
      case 'music': return { bg: '#c39d48', text: '#000000' };
      case 'talk': return { bg: '#0d4a3e', text: '#ffffff' };
      case 'preach': return { bg: '#7c3aed', text: '#ffffff' };
      case 'worship': return { bg: '#64748b', text: '#ffffff' };
      case 'marriage': return { bg: '#f43f5e', text: '#ffffff' };
      case 'testimony': return { bg: '#10b981', text: '#ffffff' };
      case 'family': return { bg: '#f97316', text: '#ffffff' };
      case 'faith': return { bg: '#3b82f6', text: '#ffffff' };
      case 'youth': return { bg: '#a855f7', text: '#ffffff' };
      case 'finance': return { bg: '#059669', text: '#ffffff' };
      case 'meditation': return { bg: '#6366f1', text: '#ffffff' };
      default: return { bg: '#64748b', text: '#ffffff' };
    }
  };

  const currentItem = scheduleItems[currentIndex];
  const typeColors = getTypeColor(currentItem.type);
  const isCurrentlyLive = getCurrentShowIndex() === currentIndex;

  return (
    <div className="schedule-slideshow-wrapper">
      {/* Daily Schedule Indicator */}
      <div className="schedule-indicator">
        <div className="schedule-badge-live">
          <Calendar className="w-3 h-3" />
          <span>Daily Schedule</span>
        </div>
      </div>

      <div 
        className="schedule-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Arrows */}
        <button
          className="schedule-nav schedule-nav-prev"
          onClick={goToPrevious}
          aria-label="Previous show"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          className="schedule-nav schedule-nav-next"
          onClick={goToNext}
          aria-label="Next show"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="schedule-card-content">
          <div className="schedule-header-row">
            <div 
              className="schedule-type-badge"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              {getTypeIcon(currentItem.type)}
              <span className="schedule-type-text">{currentItem.type}</span>
            </div>
            <div className="schedule-day-info">
              <Clock className="w-3 h-3" />
              <span>{currentItem.day}</span>
            </div>
          </div>
          
          <h3 className="schedule-title">
            {currentItem.title}
          </h3>
          
          <div className="schedule-meta">
            {currentItem.time} • {currentItem.host}
          </div>

          {/* Program Visual */}
          <div className="schedule-visual">
            <div className="schedule-visual-bg" style={{ backgroundColor: typeColors.bg + '20' }}>
              <div className="schedule-visual-icon" style={{ color: typeColors.bg }}>
                {getTypeIcon(currentItem.type)}
              </div>
              <div className="schedule-visual-time">{currentItem.time}</div>
              <div className="schedule-visual-day">{currentItem.day}</div>
            </div>
            
            {isCurrentlyLive && (
              <div className="schedule-live-badge">
                LIVE
              </div>
            )}
          </div>
          
          <div className="schedule-details">
            <p className="schedule-description">
              {currentItem.description}
            </p>
            
            <div className="schedule-footer-info">
              <div className="schedule-host">
                <div className="schedule-host-avatar"></div>
                <span>{currentItem.host}</span>
              </div>
              
              <div className="schedule-listeners">
                <Users className="w-4 h-4" />
                <span>{currentItem.listeners}</span>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="schedule-dots">
              {scheduleItems.map((_, index) => (
                <button
                  key={index}
                  className={`schedule-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to show ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSlideshow;
