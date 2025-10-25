import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayIcon, Loader2 } from 'lucide-react';

export function DirectWebRTCPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const connectWebRTC = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pcRef.current = pc;

      // Add transceiver for receiving video/audio
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to VPS WebRTC server
      const response = await fetch('https://74.208.102.89:8889/stream/whep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error('Failed to connect to WebRTC server');
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));

      setIsConnected(true);
    } catch (err) {
      console.error('WebRTC connection error:', err);
      setError('Failed to connect. Make sure the stream is live.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <Card className="relative aspect-video bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-4">
            <h3 className="text-white text-lg font-semibold">
              Ultra-Low Latency Stream (&lt;1 second delay)
            </h3>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button
              onClick={connectWebRTC}
              disabled={isConnecting}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Start WebRTC Stream
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {isConnected && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE - WebRTC
          </div>
        </div>
      )}
    </Card>
  );
}