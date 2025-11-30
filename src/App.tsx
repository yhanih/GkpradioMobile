import { useState, useEffect } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { AudioPlayer } from './components/AudioPlayer';
import { HomeScreen } from './components/HomeScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { PodcastsScreen } from './components/PodcastsScreen';
import { VideoScreen } from './components/VideoScreen';
import { LiveScreen } from './components/LiveScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PrivacyPolicyScreen } from './components/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './components/TermsOfServiceScreen';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AudioProvider } from './utils/AudioContext';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useAuth();

  // Set max-width to 428px for iPhone sizing
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'GKP Radio';
      case 'community':
        return 'Community';
      case 'podcasts':
        return 'Podcasts';
      case 'video':
        return 'Videos';
      case 'live':
        return 'Live Radio';
      case 'profile':
        return 'Profile';
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms of Service';
      default:
        return 'GKP Radio';
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'community':
        return <CommunityScreen onNavigateToProfile={() => setActiveTab('profile')} />;
      case 'podcasts':
        return <PodcastsScreen />;
      case 'video':
        return <VideoScreen />;
      case 'live':
        return <LiveScreen />;
      case 'profile':
        return <ProfileScreen onNavigate={setActiveTab} />;
      case 'privacy':
        return <PrivacyPolicyScreen onBack={() => setActiveTab('profile')} />;
      case 'terms':
        return <TermsOfServiceScreen onBack={() => setActiveTab('profile')} />;
      default:
        return <HomeScreen />;
    }
  };

  const showBottomNav = !['privacy', 'terms'].includes(activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/30 to-teal-50/40 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>
      
      {/* Mobile Container - Max width 428px for iPhone */}
      <div className="max-w-[428px] mx-auto min-h-screen relative">
        {/* Glass container with backdrop blur */}
        <div className="min-h-screen bg-white/40 backdrop-blur-2xl shadow-2xl shadow-black/10 border-x border-white/20">
          {/* Header */}
          <MobileHeader 
            title={getTitle()} 
            onProfileClick={() => setActiveTab('profile')}
            isUserSignedIn={!!user}
          />

          {/* Main Content - scrollable with proper padding for fixed elements */}
          <main className="overflow-y-auto h-screen">
            {renderScreen()}
          </main>

          {/* Audio Player */}
          <AudioPlayer />

          {/* Bottom Navigation */}
          {showBottomNav && (
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </AuthProvider>
  );
}