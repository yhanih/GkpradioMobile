import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border/50 backdrop-blur-xl z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Album Art */}
            <div className="relative group">
              <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" fill="white" />
                </div>
              </div>
            </div>
            
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[15px] truncate">Kingdom Principles: Walking in Faith</p>
              <p className="text-[13px] text-muted-foreground truncate">Pastor James Williams</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/50 transition-all"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart 
                  className={`h-4 w-4 transition-all ${isLiked ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/50 transition-all"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-105 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" fill="white" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" fill="white" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/50 transition-all"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
