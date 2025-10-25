import { useState } from 'react';
import { Button } from '@/components/ui/button';

const StreamTest = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const testStream = async () => {
    try {
      const streamUrl = '/api/stream/proxy';
      console.log('Testing stream:', streamUrl);
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      
      const newAudio = new Audio(streamUrl);
      newAudio.crossOrigin = 'anonymous';
      
      newAudio.addEventListener('loadstart', () => console.log('Load started'));
      newAudio.addEventListener('canplay', () => console.log('Can play'));
      newAudio.addEventListener('playing', () => {
        console.log('Playing!');
        setIsPlaying(true);
        setError(null);
      });
      newAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setError(`Error: ${e.type}`);
        setIsPlaying(false);
      });
      
      setAudio(newAudio);
      await newAudio.play();
      
    } catch (err) {
      console.error('Stream test failed:', err);
      setError(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stopStream = () => {
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Stream Test</h3>
      <div className="space-y-2">
        <Button onClick={testStream} disabled={isPlaying}>
          Test AzuraCast Stream
        </Button>
        <Button onClick={stopStream} disabled={!isPlaying} variant="outline">
          Stop
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isPlaying && <p className="text-green-500 text-sm">Stream playing successfully!</p>}
      </div>
    </div>
  );
};

export default StreamTest;