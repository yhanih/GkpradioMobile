import { Home, Users, Mic, Video, Radio } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'podcasts', icon: Mic, label: 'Podcasts' },
    { id: 'video', icon: Video, label: 'Video' },
    { id: 'live', icon: Radio, label: 'Live' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-white/20 z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-20 max-w-[428px] mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative group"
            >
              {/* Glass background for active state */}
              {isActive && (
                <div className="absolute inset-2 bg-primary/8 backdrop-blur-sm rounded-2xl transition-all" />
              )}
              
              {/* Icon container with glass effect */}
              <div className={`relative transition-all z-10 ${isActive ? 'scale-100' : 'scale-95 group-hover:scale-100'}`}>
                <div className={`h-11 w-11 flex items-center justify-center rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-white/80 shadow-lg shadow-primary/20' 
                    : 'bg-transparent group-hover:bg-white/40'
                }`}>
                  <Icon
                    className={`h-5 w-5 transition-all ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
              </div>
              
              <span
                className={`text-[11px] font-medium transition-all z-10 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}