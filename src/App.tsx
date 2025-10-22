import { useState } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { AudioPlayer } from './components/AudioPlayer';
import { HomeScreen } from './components/HomeScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { PodcastsScreen } from './components/PodcastsScreen';
import { VideoScreen } from './components/VideoScreen';
import { LiveScreen } from './components/LiveScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

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
      default:
        return 'GKP Radio';
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'podcasts':
        return <PodcastsScreen />;
      case 'video':
        return <VideoScreen />;
      case 'live':
        return <LiveScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
        {/* Header */}
        <MobileHeader title={getTitle()} />

        {/* Main Content */}
        <main className="overflow-y-auto">
          {renderScreen()}
        </main>

        {/* Audio Player */}
        <AudioPlayer />

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
