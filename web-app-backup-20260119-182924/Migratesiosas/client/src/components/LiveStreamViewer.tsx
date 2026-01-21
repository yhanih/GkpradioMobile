import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Radio, 
  Users, 
  MessageCircle, 
  Send,
  Volume2,
  VolumeX,
  Maximize,
  Settings
} from 'lucide-react';

interface StreamData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  broadcaster: string;
}

const LiveStreamViewer = () => {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  useEffect(() => {
    connectWebSocket();
    initializeMediaSource();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/stream`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to streaming server');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    wsRef.current.onclose = () => {
      console.log('Disconnected from streaming server');
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'stream_status':
        setIsLive(data.isLive);
        setViewerCount(data.viewerCount);
        setStreamData(data.streamData);
        break;

      case 'stream_started':
        setIsLive(true);
        setStreamData(data.streamData);
        break;

      case 'stream_stopped':
        setIsLive(false);
        setStreamData(null);
        break;

      case 'viewer_count_update':
        setViewerCount(data.count);
        break;

      case 'stream_data':
        handleStreamData(data);
        break;

      case 'chat_message':
        setChatMessages(prev => [...prev, data]);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const initializeMediaSource = () => {
    if (!('MediaSource' in window)) {
      console.error('MediaSource not supported');
      return;
    }

    mediaSourceRef.current = new MediaSource();
    
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSourceRef.current);
    }

    mediaSourceRef.current.addEventListener('sourceopen', () => {
      try {
        sourceBufferRef.current = mediaSourceRef.current!.addSourceBuffer('video/webm; codecs="vp8,opus"');
      } catch (error) {
        console.error('Failed to create source buffer:', error);
      }
    });
  };

  const handleStreamData = (data: any) => {
    if (sourceBufferRef.current && !sourceBufferRef.current.updating && data.chunk) {
      try {
        const buffer = Uint8Array.from(atob(data.chunk), c => c.charCodeAt(0));
        sourceBufferRef.current.appendBuffer(buffer);
      } catch (error) {
        console.error('Failed to append buffer:', error);
      }
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        user: 'Viewer',
        message: newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && videoRef.current) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stream Player */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Radio className="w-5 h-5" />
              <span>GKP Radio Live Stream</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                className={`${
                  isLive 
                    ? 'bg-live-indicator text-live-foreground animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {!isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="text-center">
                  <Radio className="w-16 h-16 mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Stream Offline
                  </h3>
                  <p className="text-white/80">
                    We're not broadcasting right now. Check back soon!
                  </p>
                </div>
              </div>
            )}
            
            {/* Video Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Stream Info */}
          {streamData && (
            <div className="space-y-2">
              <h3 className="font-semibold">{streamData.title}</h3>
              <p className="text-sm text-muted-foreground">{streamData.description}</p>
              <p className="text-xs text-muted-foreground">
                Started at {new Date(streamData.startTime).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Live Chat</span>
            <Badge variant="secondary" className="ml-auto">
              {chatMessages.length} messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No messages yet. Be the first to chat!</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-primary">{msg.user}:</span>{' '}
                    <span>{msg.message}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={!isLive}
              />
              <Button 
                onClick={sendChatMessage} 
                disabled={!newMessage.trim() || !isLive}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStreamViewer;