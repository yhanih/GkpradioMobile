import React from 'react';
import { useAudio } from '../../context/AudioContext';
import { Play, Pause, Heart, Radio, MoreHorizontal, Loader2, SkipBack, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './GlobalAudioPlayer.css';

const GlobalAudioPlayer: React.FC = () => {
    const { isPlaying, isLoading, nowPlaying, currentEpisode, togglePlayback, skipForward, skipBackward } = useAudio();

    // Derived values
    const isStation = !currentEpisode;
    const title = currentEpisode ? currentEpisode.title : (nowPlaying?.now_playing.song.title || 'Live Radio');
    const artist = currentEpisode ? (currentEpisode.author_name || 'Podcast') : (nowPlaying?.now_playing.song.artist || 'Broadcasting Live');
    const art = currentEpisode ? currentEpisode.image_url : nowPlaying?.now_playing.song.art;

    return (
        <AnimatePresence>
            {(isPlaying || nowPlaying) && (
                <motion.div
                    className="global-player-container"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                >
                    <div className="global-player">
                        <div className="player-track-info">
                            <div className="player-art-wrap">
                                {art ? <img src={art} alt={title} /> : <Radio size={20} color="white" />}
                                {isPlaying && !isLoading && (
                                    <div className="player-waveform-overlay">
                                        <div className="mini-wave"></div>
                                    </div>
                                )}
                            </div>
                            <div className="player-text">
                                <div className="player-title">{title}</div>
                                <div className="player-artist">{artist}</div>
                            </div>
                        </div>

                        <div className="player-controls">
                            {!isStation && (
                                <button className="player-skip-btn" onClick={skipBackward} title="Skip back 15s">
                                    <SkipBack size={20} />
                                </button>
                            )}
                            <button
                                className="player-play-btn"
                                onClick={togglePlayback}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24} /> : (isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />)}
                            </button>
                            {!isStation && (
                                <button className="player-skip-btn" onClick={skipForward} title="Skip forward 15s">
                                    <SkipForward size={20} />
                                </button>
                            )}
                        </div>

                        <div className="player-actions-extra">
                            <button className="icon-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <Heart size={20} />
                            </button>
                            <button className="icon-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalAudioPlayer;
