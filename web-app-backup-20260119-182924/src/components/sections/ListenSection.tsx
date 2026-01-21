import { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import './ListenSection.css';

export function ListenSection() {
  const { isPlaying, play, pause } = useAudio();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);

  const handleTogglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <section id="listen" className="listen-section">
      {/* Background Elements */}
      <div className="listen-background">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
      </div>

      <div className="container">
        <div className="listen-grid">
          {/* Left Content */}
          <div className="listen-content">
            <span className="section-badge accent">Listen Live</span>
            <h2 className="section-title light">
              Tune In Anytime, Anywhere
            </h2>
            <p className="section-description light">
              Stream our broadcasts live on any device. Whether you're at
              home, in your car, or on the go, God Kingdom Principles Radio is
              just a click away.
            </p>

            {/* Platform Links */}
            <div className="platform-links">
              {["Apple Podcasts", "Spotify", "Google Podcasts", "TuneIn"].map(
                (platform) => (
                  <button key={platform} className="platform-btn">
                    {platform}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Right - Audio Player */}
          <div className="audio-player-card">
            {/* Now Playing */}
            <div className="now-playing">
              <div className="album-art">
                <div
                  className={`spinning-border ${isPlaying ? "spinning" : ""}`}
                />
                <div className="album-icon">
                  <Volume2 className="w-10 h-10" />
                </div>
              </div>
              <p className="now-playing-label">Now Playing</p>
              <h3 className="now-playing-title">Kingdom Principles</h3>
              <p className="now-playing-host">with Rev. Sarah Johnson</p>
            </div>

            {/* Progress Bar */}
            <div className="player-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: isPlaying ? "45%" : "0%" }}
                />
              </div>
              <div className="progress-labels">
                <span>Live</span>
                <span className="live-indicator">
                  <span className="live-dot" />
                  On Air
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="player-controls">
              <button
                type="button"
                className="control-btn"
                aria-label="Previous"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleTogglePlay}
                className="play-btn"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </button>
              <button
                type="button"
                className="control-btn"
                aria-label="Next"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume */}
            <div className="volume-control">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="volume-btn"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="volume-slider"
                aria-label="Volume"
              />
              <span className="volume-value">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
