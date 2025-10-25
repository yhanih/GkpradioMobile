import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Radio,
  Users,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamerProps {
  onStreamStart?: (streamData: any) => void;
  onStreamStop?: () => void;
}

const WebRTCStreamer = ({ onStreamStart, onStreamStop }: StreamerProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  // Get user media (microphone and camera)
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: hasAudio,
        video: hasVideo
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      toast({
        title: "Media Access Error",
        description: "Could not access microphone or camera. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Start streaming
  const startStream = async () => {
    const stream = await getUserMedia();
    if (!stream) return;

    try {
      // Create MediaRecorder for streaming
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send chunks to server via WebSocket
          sendStreamData(event.data);
        }
      };
      
      // Start recording in chunks
      mediaRecorder.start(1000); // 1 second chunks
      
      setIsStreaming(true);
      
      // Notify parent component
      onStreamStart?.({
        streamId: Date.now().toString(),
        title: 'GKP Radio Live Stream',
        hasAudio,
        hasVideo
      });
      
      toast({
        title: "Stream Started",
        description: "You are now broadcasting live!"
      });
      
    } catch (error) {
      toast({
        title: "Streaming Error",
        description: "Failed to start stream. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Stop streaming
  const stopStream = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setIsStreaming(false);
    onStreamStop?.();
    
    toast({
      title: "Stream Stopped",
      description: "Your broadcast has ended."
    });
  };

  // Send stream data to server
  const sendStreamData = (data: Blob) => {
    // WebSocket connection to send stream data
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/stream`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'stream_chunk',
        timestamp: Date.now()
      }));
      
      // Send binary data
      data.arrayBuffer().then(buffer => {
        ws.send(buffer);
      });
    };
  };

  // Toggle audio
  const toggleAudio = () => {
    setHasAudio(!hasAudio);
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !hasAudio;
      });
    }
  };

  // Toggle video
  const toggleVideo = () => {
    setHasVideo(!hasVideo);
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !hasVideo;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Stream Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Radio className="w-5 h-5" />
              <span>Broadcasting Studio</span>
            </CardTitle>
            <Badge 
              className={`${
                isStreaming 
                  ? 'bg-live-indicator text-live-foreground animate-pulse' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isStreaming ? '🔴 LIVE' : '⚫ READY'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {!hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="text-center">
                  <Mic className="w-12 h-12 mx-auto mb-2 text-white" />
                  <p className="text-white">Audio Only Mode</p>
                </div>
              </div>
            )}
            
            {isStreaming && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-live-indicator text-live-foreground animate-pulse">
                  🔴 LIVE
                </Badge>
              </div>
            )}
            
            {isStreaming && (
              <div className="absolute top-4 right-4 flex items-center space-x-1 text-white text-sm">
                <Users className="w-4 h-4" />
                <span>{viewers}</span>
              </div>
            )}
          </div>
          
          {/* Stream Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={hasAudio ? "default" : "outline"}
                size="sm"
                onClick={toggleAudio}
                disabled={isStreaming}
              >
                {hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={hasVideo ? "default" : "outline"}
                size="sm"
                onClick={toggleVideo}
                disabled={isStreaming}
              >
                {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isStreaming ? (
                <Button
                  onClick={startStream}
                  className="btn-live"
                  disabled={!hasAudio && !hasVideo}
                >
                  Start Broadcast
                </Button>
              ) : (
                <Button
                  onClick={stopStream}
                  variant="destructive"
                >
                  End Broadcast
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stream Info */}
      {isStreaming && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Your live stream is broadcasting to
              </p>
              <p className="font-medium">
                {window.location.origin}/live
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebRTCStreamer;