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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border/50 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative group"
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full transition-all" />
              )}
              
              {/* Icon container */}
              <div className={`relative transition-all ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                <Icon
                  className={`h-5 w-5 transition-all ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg -z-10" />
                )}
              </div>
              
              <span
                className={`text-[11px] font-medium transition-all ${
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
