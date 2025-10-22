import { Menu, Bell, Search } from 'lucide-react';
import { Button } from './ui/button';

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
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
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 relative hover:bg-primary/10 hover:text-primary transition-all rounded-xl group"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full shadow-lg shadow-primary/50 ring-2 ring-white group-hover:scale-125 transition-transform"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
