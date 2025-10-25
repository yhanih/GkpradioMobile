import { useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Share2, Heart, Users, Radio, Mic } from '@/lib/icons';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAudioContext } from "@/contexts/AudioContext";

const AudioPlayer = () => {
  const { metadata, status, controls } = useAudioContext();
  
  const handlePlayPause = async () => {
    if (status.isPlaying) {
      controls.pause();
    } else {
      try {
        await controls.play();
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    controls.setVolume(value[0]);
  };

  const handleMuteToggle = () => {
    controls.toggleMute();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 audio-player-gradient p-2 w-full max-w-full overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Live Radio Info - Compact */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-live-indicator/20 to-accent/20 flex items-center justify-center">
                {status.isLive ? (
                  <Mic className="w-4 h-4 text-live-indicator" />
                ) : (
                  <Radio className="w-4 h-4 text-live-indicator" />
                )}
              </div>
              {/* Live pulse indicator */}
              {status.isPlaying && (
                <div className="absolute -top-0.5 -right-0.5">
                  <div className="w-3 h-3 bg-live-indicator rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs truncate text-foreground">
                {status.isPlaying ? "Now Playing" : "GKP Radio"}
              </h4>
              {/* Song info when available, fallback to station info */}
              {metadata.song.title && metadata.song.artist ? (
                <p className="text-xs text-muted-foreground truncate">
                  {metadata.song.artist} - {metadata.song.title}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground truncate">
                  {status.isPlaying ? "GKP Radio - Live Stream" : "Click to start listening"}
                </p>
              )}
            </div>
          </div>

          {/* Compact Controls */}
          <div className="flex items-center space-x-2">
            {/* Main Play/Pause Button */}
            <Button
              onClick={handlePlayPause}
              className={`w-12 h-12 rounded-full ${
                status.isPlaying 
                  ? 'btn-live animate-pulse' 
                  : 'btn-faith-primary hover:btn-live'
              } transition-all duration-300 shadow-md hover:shadow-lg`}
            >
              {status.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>
            
            {/* Volume Control */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="w-8 h-8"
              >
                {status.isMuted ? (
                  <VolumeX className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
              <Slider
                value={status.isMuted ? [0] : [status.volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-16 hidden sm:flex"
              />
            </div>
            
            {/* Stream Quality - Compact */}
            <div className="hidden md:flex space-x-0.5">
              <div className="w-0.5 h-2 bg-accent rounded-full"></div>
              <div className="w-0.5 h-3 bg-accent rounded-full"></div>
              <div className="w-0.5 h-4 bg-accent rounded-full"></div>
              <div className="w-0.5 h-2 bg-muted-foreground/30 rounded-full"></div>
            </div>
            
            {/* Share */}
            <Button variant="ghost" size="sm" className="w-8 h-8 hidden sm:flex">
              <Share2 className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;