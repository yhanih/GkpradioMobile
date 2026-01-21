import { useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Radio } from 'lucide-react';

const GlobalAudioPlayer = () => {
    const [playing, setPlaying] = useState(false);
    const [volume] = useState(0.8);
    const [currentTrack] = useState({
        title: 'Live Radio',
        author: 'God Kingdom Principles',
        url: 'https://stream.gkpradio.com/radio/8000/radio.mp3' // Example fallback
    });

    return (
        <div className="glass" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--player-height)',
            zIndex: 1000,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 2rem'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Track Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '30%' }}>
                    <div className="premium-gradient" style={{ width: '48px', height: '48px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                        <Radio size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '2px' }}>{currentTrack.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentTrack.author}</p>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '40%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button style={{ background: 'none', color: 'var(--text-muted)' }}><SkipBack size={20} /></button>
                        <button
                            onClick={() => setPlaying(!playing)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--text)',
                                color: 'var(--surface)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
                        </button>
                        <button style={{ background: 'none', color: 'var(--text-muted)' }}><SkipForward size={20} /></button>
                    </div>
                    {/* Progress Bar Placeholder */}
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* Volume & Extras */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', width: '30%' }}>
                    <Volume2 size={20} color="var(--text-muted)" />
                    <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px' }}>
                        <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--text-muted)', borderRadius: '2px' }}></div>
                    </div>
                    <Maximize2 size={18} color="var(--text-muted)" />
                </div>
            </div>

            {/* Hidden Player Engine */}
            <div style={{ display: 'none' }}>
                <ReactPlayer
                    url={currentTrack.url}
                    playing={playing}
                    volume={volume}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                />
            </div>
        </div>
    );
};

export default GlobalAudioPlayer;
