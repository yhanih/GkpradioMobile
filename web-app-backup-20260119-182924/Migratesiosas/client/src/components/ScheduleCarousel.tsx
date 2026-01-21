import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, Play, Mic, Users, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    title: 'Bedtime Prayer for Children',
    time: '8:00 PM – 8:30 PM',
    host: 'GKPRadio Team',
    description: 'Peaceful bedtime prayers and stories for children to end their day with faith.',
    type: 'meditation',
    isLive: false,
    listeners: 145,
    day: 'Mon–Fri',
    duration: '30 minutes'
  },
  {
    id: '13',
    title: 'Bedtime Prayer for Youth',
    time: '8:30 PM – 9:00 PM',
    host: 'GKPRadio Team',
    description: 'Evening prayers and reflections designed for young adults and teens.',
    type: 'meditation',
    isLive: false,
    listeners: 89,
    day: 'Mon–Fri',
    duration: '30 minutes'
  },
  {
    id: '14',
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
    id: '15',
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
    id: '16',
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
  },
  {
    id: '17',
    title: 'Wake Up Y\'all (Repeat)',
    time: '12:00 AM – 3:00 AM',
    host: 'GKPRadio Morning Team',
    description: 'Repeat broadcast of the morning show for late-night listeners.',
    type: 'talk',
    isLive: false,
    listeners: 67,
    day: 'Mon–Fri',
    duration: '3 hours'
  },
  {
    id: '18',
    title: 'Kingdom Break with Pastor Myles Monroe (Repeat)',
    time: '3:00 AM – 4:00 AM',
    host: 'Pastor Myles Monroe',
    description: 'Repeat broadcast of kingdom teachings for early morning listeners.',
    type: 'talk',
    isLive: false,
    listeners: 34,
    day: 'Mon–Fri',
    duration: '1 hour'
  },
  {
    id: '19',
    title: 'Marriage Talk with Dustin Scott (Repeat)',
    time: '4:00 AM – 5:00 AM',
    host: 'Dustin Scott',
    description: 'Repeat broadcast of marriage wisdom for early morning listeners.',
    type: 'marriage',
    isLive: false,
    listeners: 28,
    day: 'Mon–Fri',
    duration: '1 hour'
  },
  {
    id: '20',
    title: 'Testimonies with Stan Lewis (Repeat)',
    time: '5:00 AM – 6:00 AM',
    host: 'Stan Lewis',
    description: 'Repeat broadcast of powerful testimonies to start the early morning.',
    type: 'testimony',
    isLive: false,
    listeners: 45,
    day: 'Mon–Fri',
    duration: '1 hour'
  }
];

const ScheduleCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel every 5 seconds, but pause on hover
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
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % scheduleData.length);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live': return <Mic className="w-5 h-5" />;
      case 'music': return <Volume2 className="w-5 h-5" />;
      case 'talk': return <Users className="w-5 h-5" />;
      case 'worship': return <Play className="w-5 h-5" />;
      case 'marriage': return <Users className="w-5 h-5" />;
      case 'testimony': return <Mic className="w-5 h-5" />;
      case 'family': return <Users className="w-5 h-5" />;
      case 'faith': return <Play className="w-5 h-5" />;
      case 'youth': return <Users className="w-5 h-5" />;
      case 'finance': return <Users className="w-5 h-5" />;
      case 'meditation': return <Play className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'live': return 'bg-live-indicator text-live-foreground';
      case 'music': return 'bg-faith-gold text-black';
      case 'talk': return 'bg-primary text-primary-foreground';
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

  const currentItem = scheduleData[currentIndex];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4">
            Program Schedule
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join us for inspiring programs throughout the week. From worship services to faith discussions, 
            there's something for everyone in our community.
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Card 
            className="overflow-hidden shadow-2xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <CardContent className="p-0">
              <div className="relative">
                {/* Background with gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-faith-gold/20"></div>
                
                {/* Content */}
                <div className="relative z-10 p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Left Column - Program Info */}
                    <div className="space-y-6">
                      {/* Program Type Badge */}
                      <div className="flex items-center space-x-3">
                        <Badge className={`text-sm px-3 py-1 ${getTypeColor(currentItem.type)}`}>
                          {getTypeIcon(currentItem.type)}
                          <span className="ml-2 capitalize">{currentItem.type} Show</span>
                        </Badge>
                        {currentItem.isLive && (
                          <Badge className="bg-live-indicator text-live-foreground animate-pulse">
                            🔴 LIVE NOW
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif font-bold text-3xl md:text-4xl leading-tight">
                        {currentItem.title}
                      </h3>

                      {/* Host & Schedule Info */}
                      <div className="space-y-3 text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium text-foreground">{currentItem.host}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{currentItem.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{currentItem.day}</span>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">Duration:</span> {currentItem.duration}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground leading-relaxed">
                        {currentItem.description}
                      </p>

                      {/* Listeners Count */}
                      {currentItem.listeners && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="w-4 h-4 text-accent" />
                          <span className="font-medium">{currentItem.listeners.toLocaleString()}</span>
                          <span className="text-muted-foreground">regular listeners</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Visual Element */}
                    <div className="relative">
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/60 to-accent/60 p-8 flex items-center justify-center relative overflow-hidden">
                        {currentItem.image ? (
                          <>
                            <img 
                              src={currentItem.image}
                              alt={currentItem.title}
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                              <div className="text-lg font-bold mb-1">{currentItem.time}</div>
                              <div className="text-sm opacity-90">{currentItem.day}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-faith-gold/20 to-transparent"></div>
                            <div className="relative z-10 text-center text-white">
                              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                {getTypeIcon(currentItem.type)}
                              </div>
                              <div className="text-xl font-bold">{currentItem.time}</div>
                              <div className="text-sm opacity-90">{currentItem.day}</div>
                              
                              {currentItem.isLive && (
                                <div className="mt-4">
                                  <div className="animate-pulse">
                                    <div className="w-3 h-3 bg-live-indicator rounded-full mx-auto mb-2"></div>
                                    <div className="text-xs">ON AIR</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {currentItem.isLive && currentItem.image && (
                          <div className="absolute bottom-4 right-4">
                            <div className="animate-pulse">
                              <div className="w-3 h-3 bg-live-indicator rounded-full mx-auto mb-1"></div>
                              <div className="text-xs text-white bg-black/50 px-2 py-1 rounded">ON AIR</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90 rounded-full shadow-lg"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90 rounded-full shadow-lg"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {scheduleData.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                  setTimeout(() => setIsAutoPlaying(true), 10000);
                }}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="text-center mt-4">
            <div className="text-sm text-muted-foreground">
              {isAutoPlaying ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Auto-advancing</span>
                </span>
              ) : (
                <span>Auto-play paused</span>
              )}
            </div>
          </div>
        </div>

        {/* View Full Schedule Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="group">
            View Full Schedule
            <Calendar className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ScheduleCarousel;