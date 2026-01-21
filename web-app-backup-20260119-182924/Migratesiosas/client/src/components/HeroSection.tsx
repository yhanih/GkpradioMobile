import { Play, Users, Calendar, Heart } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import ScheduleSlideshow from "./ScheduleSlideshow";
import { useAudioContext } from "@/contexts/AudioContext";
import { useState, useEffect } from "react";
import { HeroSkeleton } from "@/components/skeletons/HeroSkeleton";

// Schedule data for live show detection
const scheduleData = [
  { title: 'Wake Up Y\'all', time: '6:00 AM – 9:00 AM', host: 'GKPRadio Morning Team', startHour: 6, endHour: 9 },
  { title: 'In Case You Did Not Know', time: '9:00 AM – 10:00 AM', host: 'GKPRadio Team', startHour: 9, endHour: 10 },
  { title: 'Kingdom Teachings', time: '10:00 AM – 11:00 AM', host: 'Pastor Myles Monroe', startHour: 10, endHour: 11 },
  { title: 'Lunch Time', time: '11:00 AM – 12:00 PM', host: 'Jane Peter', startHour: 11, endHour: 12 },
  { title: 'Marriage Talk', time: '12:00 PM – 1:00 PM', host: 'Dustin Scott', startHour: 12, endHour: 13 },
  { title: 'Testimonies', time: '1:00 PM – 2:00 PM', host: 'Stan Lewis', startHour: 13, endHour: 14 },
  { title: 'Bragging on My Kids', time: '2:00 PM – 3:00 PM', host: 'Community Submission', startHour: 14, endHour: 15 },
  { title: '4-Point Connect to Heaven', time: '3:00 PM – 5:00 PM', host: 'Evan', startHour: 15, endHour: 17 },
  { title: 'Sheffield Family Hour', time: '5:00 PM – 6:00 PM', host: 'Pastor George', startHour: 17, endHour: 18 },
  { title: 'Youth Corner', time: '6:00 PM – 7:00 PM', host: 'Melissa Burt', startHour: 18, endHour: 19 },
  { title: 'Let\'s Talk Money', time: '7:00 PM – 8:00 PM', host: 'Steve Richards', startHour: 19, endHour: 20 },
  { title: 'My Spouse, My Heart', time: '8:00 PM – 9:00 PM', host: 'Jeff & Suzie Spencer', startHour: 20, endHour: 21 },
  { title: 'Meditation & Relaxation', time: '9:00 PM – 10:00 PM', host: 'Joyce Smith', startHour: 21, endHour: 22 },
  { title: 'Praise & Worship Music', time: '10:00 PM – 12:00 AM', host: 'Auto-DJ', startHour: 22, endHour: 24 },
];

const HeroSection = () => {
  const { status, controls } = useAudioContext();
  const [currentShow, setCurrentShow] = useState({ title: 'Praise & Worship Music', host: 'Auto-DJ' });
  const [isLoading, setIsLoading] = useState(true);

  // Detect current show based on Kansas City, Missouri time (Central Time)
  useEffect(() => {
    const updateCurrentShow = () => {
      // Get current time in Kansas City, Missouri (Central Time)
      const now = new Date();
      const kansasCityTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
      const currentHour = kansasCityTime.getHours();
      
      
      
      const activeShow = scheduleData.find(show => 
        currentHour >= show.startHour && currentHour < show.endHour
      );
      
      if (activeShow) {
        setCurrentShow({ title: activeShow.title, host: activeShow.host });
      } else {
        // Fallback to late night music if no specific show
        setCurrentShow({ title: 'Praise & Worship Music', host: 'Auto-DJ' });
      }
    };

    // Update immediately
    updateCurrentShow();
    setIsLoading(false);
    
    // Update every 30 seconds to catch schedule changes more accurately 
    const interval = setInterval(updateCurrentShow, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartListening = async () => {
    // Only start playing - never pause from this button
    if (!status.isPlaying) {
      try {
        await controls.play();
      } catch (error) {
        console.error('Failed to start audio from HeroSection:', error);
      }
    }
  };

  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className="relative overflow-hidden w-full max-w-full">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero"></div>
      {/* Content */}
      <div className="relative container mx-auto px-4 py-4 md:py-6 lg:py-8 w-full max-w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 btn-live text-xs font-medium animate-pulse bg-[#ff0000] text-[#ffffff]">
                LIVE NOW
              </Badge>
              <span className="text-sm text-white/80">
                {currentShow.host === 'Auto-DJ' ? currentShow.title : `${currentShow.title} with ${currentShow.host}`}
              </span>
            </div>

            <h1 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight">
              Welcome to
              <span className="block text-faith-gold">God Kingdom Principles Radio</span>
            </h1>

            <p className="text-base md:text-lg text-white/90 mb-6 max-w-xl">Join our community of believers in daily inspiration, powerful testimonies, and life-changing conversations about faith, hope, and love. Scroll down to "Ministry Fields," pick one or more categories and minister to others.</p>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start mb-6">
              <Button 
                size="default" 
                className={`px-6 py-3 group ${
                  status.isPlaying 
                    ? 'btn-live animate-pulse' 
                    : 'btn-faith-gold hover:btn-live'
                } transition-all duration-300`}
                onClick={handleStartListening}
                disabled={!!status.error || !status.isConnected || status.isPlaying}
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {status.isPlaying ? "Now Playing" : "Start Listening"}
              </Button>

              <Link href="/community">
                <Button 
                  variant="ghost" 
                  size="default" 
                  className="text-white/90 hover:bg-white/10 hover:text-white border border-white/20 px-6 py-3 transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto lg:mx-0">
              <div className="text-center">
                <div className="font-bold text-2xl text-white">2,500+</div>
                <div className="text-sm text-white/70">Family Members</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-white">45K+</div>
                <div className="text-sm text-white/70">Prayers Lifted Up</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-white">24/7</div>
                <div className="text-sm text-white/70">Live Ministry</div>
              </div>
            </div>
          </div>

          {/* Right Column - Schedule Slideshow Card */}
          <ScheduleSlideshow />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;