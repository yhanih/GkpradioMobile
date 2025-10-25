import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, Play, Mic, Users, Volume2, Heart } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import image1 from "@assets/image1_1753930639741.jpg";
import image2 from "@assets/image2_1753930639742.jpg";
import image3 from "@assets/image3_1753930639742.jpg";
import image4 from "@assets/image4_1753930639742.jpg";
import image5 from "@assets/image5_1753930639742.jpg";
import image6 from "@assets/image6_1753930639742.png";
import image7 from "@assets/image7_1753930639742.jpg";
import image8 from "@assets/image8_1753930639742.png";
import image9 from "@assets/image9_1753930639742.jpg";
import image10 from "@assets/image10_1753930639742.jpg";
import image11 from "@assets/image11_1753930639742.jpg";
import wakeUpImage from "@assets/image14_1754000559086.jpg";
import triviaImage from "@assets/image2_1754001358575.jpg";
import pastorMylesImage from "@assets/Myles Munroe pic_1754016615349.jpg";
import kingdomTeachingsReplayImage from "@assets/God's kingdom teachings, gkp radio_1758935943948.png";
import lunchImage from "@assets/image4_1754002628228.jpg";
import marriageImage from "@assets/image3_1754002715912.jpg";
import testimoniesImage from "@assets/image6_1754002821866.png";
import braggingKidsImage from "@assets/image5_1754002871607.jpg";
import connectHeavenImage from "@assets/image8_1754002942823.png";
import youthImage from "@assets/image11_1754002993679.jpg";
import sheffieldImage from "@assets/image7_1754002970207.jpg";
import moneyTalkImage from "@assets/image9_1754003035160.jpg";
import spouseHeartImage from "@assets/image10_1754003105968.jpg";
import meditationImage from "@assets/image12_1754003154000.jpg";
import praiseWorshipImage from "@assets/image13_1754003190282.jpg";
import lunchJaneImage from "@assets/image4_1754004481196.jpg";

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
  image?: string;
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
    day: 'Mon–Fri',
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
    image: triviaImage
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
    day: 'Mon–Fri',
    image: kingdomTeachingsReplayImage
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
    image: braggingKidsImage
  },
  {
    id: '1822',
    title: '♻️ Connect Four to Heaven by Evan (Repeat airing)',
    time: '3:00 PM – 5:00 PM',
    host: 'Evan',
    description: 'A four-point biblical breakdown to elevate your connection with God.',
    type: 'faith',
    isLive: false,
    listeners: 267,
    day: 'Mon–Fri',
    image: connectHeavenImage
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
    day: 'Mon–Fri',
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
    image: praiseWorshipImage
  },
  // OVERNIGHT REPLAYS (No One in the Studio)
  {
    id: '1828',
    title: '♻️ Wake Up Y\'all (Replay)',
    time: '12:00 AM – 3:00 AM',
    host: 'GKPRadio Morning Team',
    description: 'Start your morning with faith-driven conversation, motivation, and music for the soul.',
    type: 'talk',
    isLive: false,
    listeners: 89,
    day: 'Mon–Fri',
    image: wakeUpImage
  },
  {
    id: '1827',
    title: '♻️ Kingdom Break With Pastor Myles Munroe (Replay)',
    time: '3:00 AM – 4:00 AM',
    host: 'Pastor Myles Monroe',
    description: 'Powerful kingdom-focused teaching on purpose, leadership, and spiritual authority.',
    type: 'preach',
    isLive: false,
    listeners: 67,
    day: 'Mon–Fri',
    image: kingdomTeachingsReplayImage
  },
  {
    id: '1825',
    title: '♻️ Marriage Talk with Dustin Scott (Replay)',
    time: '4:00 AM – 5:00 AM',
    host: 'Dustin Scott',
    description: 'Strengthen your relationship with honest conversations about love, faith, and growth.',
    type: 'marriage',
    isLive: false,
    listeners: 45,
    day: 'Mon–Fri',
    image: marriageImage
  },
  {
    id: '1823',
    title: '♻️ Testimonies with Stan Lewis (Replay)',
    time: '5:00 AM – 6:00 AM',
    host: 'Stan Lewis',
    description: 'Real-life stories of transformation and God\'s faithfulness.',
    type: 'testimony',
    isLive: false,
    listeners: 78,
    day: 'Mon–Fri',
    image: testimoniesImage
  }
];

const ScheduleSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Detect currently playing show based on Kansas City, Missouri time (Central Time)
  const getCurrentShowIndex = () => {
    // Get current time in Kansas City, Missouri (Central Time)
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
      
      if (adjustedEndHour === 0) { // Midnight case
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
      case 'live': return 'bg-live-indicator text-live-foreground';
      case 'music': return 'bg-faith-gold text-black';
      case 'talk': return 'bg-primary text-primary-foreground';
      case 'preach': return 'bg-violet-600 text-white';
      case 'worship': return 'bg-accent text-accent-foreground';
      case 'marriage': return 'bg-rose-500 text-white';
      case 'testimony': return 'bg-emerald-500 text-white';
      case 'family': return 'bg-orange-500 text-white';
      case 'faith': return 'bg-blue-500 text-white';
      case 'youth': return 'bg-purple-500 text-white';
      case 'finance': return 'bg-green-600 text-white';
      case 'meditation': return 'bg-indigo-500 text-white';
      default: return 'bg-secondary';
    }
  };

  const currentItem = scheduleItems[currentIndex];

  return (
    <div className="relative">
      {/* Daily Schedule Indicator - Above carousel on left */}
      <div className="mb-3">
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-live-indicator text-xs animate-pulse text-[#ffffff]">
          <Calendar className="w-3 h-3 mr-1" />
          <span>Daily Schedule</span>
        </div>
      </div>
      <div 
        className="bg-card/95 backdrop-blur rounded-2xl shadow-2xl p-6 card-hover overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90 rounded-full shadow-md w-8 h-8"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90 rounded-full shadow-md w-8 h-8"
          onClick={goToNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Title First - matching reference layout */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`text-xs ${getTypeColor(currentItem.type)}`}>
              {getTypeIcon(currentItem.type)}
              <span className="ml-1 capitalize">{currentItem.type}</span>
            </Badge>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{currentItem.day}</span>
            </div>
          </div>
          
          <h3 className="font-serif font-bold text-xl leading-tight mb-2">
            {currentItem.title}
          </h3>
          
          <div className="text-sm text-muted-foreground mb-2">
            {currentItem.time} • {currentItem.host}
          </div>
        </div>

        {/* Program Visual - Below Title */}
        <div className="aspect-video rounded-xl bg-gradient-to-br from-accent/20 to-faith-gold/20 mb-4 flex items-center justify-center relative overflow-hidden">
          {currentItem.image ? (
            <>
              <img 
                src={currentItem.image} 
                alt={currentItem.title}
                className="w-full h-full object-cover object-center rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-primary/70"></div>
              <div className="relative z-10 text-center text-white">
                <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                  {getTypeIcon(currentItem.type)}
                </div>
                <div className="font-bold text-lg">{currentItem.time}</div>
                <div className="text-xs opacity-90">{currentItem.day}</div>
              </div>
            </>
          )}
          
          {(currentItem.isLive || getCurrentShowIndex() === currentIndex) && (
            <Badge className="absolute top-3 right-3 bg-live-indicator text-live-foreground text-xs px-2 animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm line-clamp-2">
            {currentItem.description}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-accent/20"></div>
              <span className="text-sm font-medium">{currentItem.host}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{currentItem.listeners}</span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-1 pt-2">
            {scheduleItems.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-4' 
                    : 'bg-muted-foreground/30'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSlideshow;