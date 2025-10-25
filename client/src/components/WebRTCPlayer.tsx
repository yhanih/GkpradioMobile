import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Radio, Wifi, WifiOff, ExternalLink, Volume2 } from 'lucide-react';

export function WebRTCPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    let peerConnection: RTCPeerConnection | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connectWebRTC = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Create peer connection with optimal settings for low latency
        peerConnection = new RTCPeerConnection({
          iceServers: [{
            urls: ['stun:stun.l.google.com:19302']
          }],
          bundlePolicy: 'max-bundle',
        });

        setPc(peerConnection);

        // Add transceiver for receiving video/audio
        peerConnection.addTransceiver('video', { direction: 'recvonly' });
        peerConnection.addTransceiver('audio', { direction: 'recvonly' });

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
          console.log('Received track:', event.track.kind);
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
            setIsConnecting(false);
          }
        };

        // Monitor connection state
        peerConnection.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', peerConnection?.iceConnectionState);
          if (peerConnection?.iceConnectionState === 'disconnected' || 
              peerConnection?.iceConnectionState === 'failed') {
            setIsConnected(false);
            // Retry connection after 2 seconds
            retryTimeout = setTimeout(connectWebRTC, 2000);
          }
        };

        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send offer to MediaMTX WebRTC endpoint via proxy
        const response = await fetch('/api/webrtc/live/whep', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        });

        if (!response.ok) {
          throw new Error(`WebRTC connection failed: ${response.status}`);
        }

        const answerSdp = await response.text();
        await peerConnection.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp,
        });

        console.log('WebRTC connection established');
      } catch (err) {
        console.error('WebRTC connection error:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setIsConnecting(false);
        setIsConnected(false);
        
        // Retry after 5 seconds on error
        retryTimeout = setTimeout(connectWebRTC, 5000);
      }
    };

    connectWebRTC();

    return () => {
      clearTimeout(retryTimeout);
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, []);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().catch(console.error);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full overflow-hidden bg-black">
        <CardContent className="p-0">
          <div className="relative w-full aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              autoPlay
              muted
              playsInline
            />
            
            {/* Connection Status Overlay */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                {isConnecting ? (
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-white mb-4 mx-auto" />
                    <p className="text-white text-lg">Connecting to ultra-low latency stream...</p>
                    <p className="text-white/60 text-sm mt-2">WebRTC connection in progress</p>
                  </div>
                ) : error ? (
                  <div className="text-center">
                    <WifiOff className="h-12 w-12 text-red-500 mb-4 mx-auto" />
                    <p className="text-white text-lg mb-2">Stream Connection Failed</p>
                    <p className="text-red-400 text-sm">{error}</p>
                    <p className="text-white/60 text-sm mt-4">Retrying in 5 seconds...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Radio className="h-12 w-12 text-white/60 mb-4 mx-auto" />
                    <p className="text-white text-lg">Waiting for WebRTC stream</p>
                  </div>
                )}
              </div>
            )}

            {/* Live Indicator */}
            {isConnected && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4 animate-pulse" />
                  LIVE - Ultra Low Latency
                </div>
              </div>
            )}

            {/* Unmute Button */}
            {isConnected && isMuted && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                onClick={handleUnmute}
              >
                <div className="bg-black/80 text-white px-6 py-3 rounded-lg flex items-center gap-3">
                  <Volume2 className="h-5 w-5" />
                  <p className="text-lg font-medium">Click to unmute</p>
                </div>
              </div>
            )}

            {/* Fullscreen Button */}
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.requestFullscreen?.();
                  }
                }}
                className="bg-black/70 text-white border-white/30 hover:bg-black/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebRTC Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Ultra Low Latency Streaming (WebRTC)</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="text-green-600 font-medium">✓ Sub-second delay (typically 200-500ms)</p>
            <p className="text-green-600 font-medium">✓ True real-time streaming like Twitch</p>
            <p><strong>OBS Settings:</strong> Keep using RTMP to {import.meta.env.VITE_VPS_HOST || window.location.hostname}:1935</p>
            <p className="text-amber-600">Note: WebRTC requires good internet connection for both broadcaster and viewers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}