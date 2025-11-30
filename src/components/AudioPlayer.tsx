import { Play, Pause, SkipBack, SkipForward, Heart, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { useAudio } from '../utils/AudioContext';

export function AudioPlayer() {
  const { isPlaying, currentTrack, play, pause } = useAudio();
  const [isLiked, setIsLiked] = useState(false);

  // Don't show player if nothing is playing
  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40">
      <div className="max-w-[428px] mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-black/10 rounded-3xl">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Album Art with Glass Effect */}
              <div className="relative group">
                <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    {currentTrack.isLive ? (
                      <Radio className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" fill="white" />
                    )}
                  </div>
                </div>
                {/* Live indicator */}
                {currentTrack.isLive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                )}
              </div>
              
              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[15px] truncate">{currentTrack.title}</p>
                  {currentTrack.isLive && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">LIVE</span>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-white/60 hover:backdrop-blur-sm transition-all rounded-2xl"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart 
                    className={`h-4 w-4 transition-all ${isLiked ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-white/60 hover:backdrop-blur-sm transition-all rounded-2xl"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="icon"
                  className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:scale-105 rounded-full"
                  onClick={() => isPlaying ? pause() : play()}
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
                  className="h-9 w-9 hover:bg-white/60 hover:backdrop-blur-sm transition-all rounded-2xl"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}