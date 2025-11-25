import { Menu, Bell, Search, User } from 'lucide-react';
import { Button } from './ui/button';

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  isUserSignedIn?: boolean;
}

export function MobileHeader({ title, onMenuClick, onProfileClick, isUserSignedIn }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-2xl"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-2xl"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 relative hover:bg-primary/10 hover:text-primary transition-all rounded-2xl group"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full shadow-lg shadow-primary/50 ring-2 ring-white group-hover:scale-125 transition-transform"></span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-2xl relative"
            onClick={onProfileClick}
          >
            <User className="h-5 w-5" />
            {isUserSignedIn && (
              <span className="absolute bottom-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-white"></span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}