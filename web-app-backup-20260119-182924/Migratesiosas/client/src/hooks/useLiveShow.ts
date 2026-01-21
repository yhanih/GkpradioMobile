import { useState, useEffect, useCallback } from 'react';

interface LiveShowStatus {
  isLive: boolean;
  title?: string;
  description?: string;
  broadcaster?: string;
  startTime?: string;
  streamUrl?: string;
  viewerCount: number;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export const useLiveShow = () => {
  const [status, setStatus] = useState<LiveShowStatus>({
    isLive: false,
    viewerCount: 0
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Connect to WebSocket for live updates
  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/stream`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        setIsConnected(true);
        // Request current status immediately
        websocket.send(JSON.stringify({ type: 'get_status' }));
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'stream_status':
            case 'stream_started':
              setStatus({
                isLive: data.isLive || false,
                title: data.streamData?.title,
                description: data.streamData?.description,
                broadcaster: data.streamData?.broadcaster,
                startTime: data.streamData?.startTime,
                streamUrl: data.streamData?.streamUrl,
                viewerCount: data.viewerCount || 0
              });
              break;
              
            case 'stream_stopped':
              setStatus(prev => ({
                ...prev,
                isLive: false,
                viewerCount: data.viewerCount || 0
              }));
              break;
              
            case 'chat_message':
              setChatMessages(prev => [...prev, {
                id: data.id,
                username: data.username,
                message: data.message,
                timestamp: data.timestamp
              }].slice(-50)); // Keep last 50 messages
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          // Use current ws state instead of closure
          setWs(currentWs => {
            if (currentWs === websocket) {
              connect();
            }
            return currentWs;
          });
        }, 3000);
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        setIsConnected(false);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, []); // Removed ws dependency to prevent infinite reconnection loops

  // Fetch live status via HTTP API
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/live/status');
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isLive: data.isLive || false,
          title: data.streamData?.title,
          description: data.streamData?.description,
          broadcaster: data.streamData?.broadcaster,
          startTime: data.streamData?.startTime,
          streamUrl: data.streamData?.streamUrl,
          viewerCount: data.viewerCount || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch live status:', error);
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((username: string, message: string) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        username,
        message
      }));
    }
  }, [ws, isConnected]);

  // Start live show
  const startLiveShow = useCallback(async (title: string, description: string) => {
    try {
      const response = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local status immediately
        setStatus({
          isLive: true,
          title: data.title,
          description: data.description,
          broadcaster: data.broadcaster,
          startTime: data.startTime,
          streamUrl: data.streamUrl,
          viewerCount: 0
        });
        return data;
      }
      throw new Error('Failed to start live show');
    } catch (error) {
      console.error('❌ Failed to start live show:', error);
      throw error;
    }
  }, []);

  // Stop live show
  const stopLiveShow = useCallback(async () => {
    try {
      const response = await fetch('/api/live/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local status immediately
        setStatus(prev => ({
          ...prev,
          isLive: false,
          title: undefined,
          description: undefined,
          viewerCount: 0
        }));
        return data;
      }
      throw new Error('Failed to stop live show');
    } catch (error) {
      console.error('❌ Failed to stop live show:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    connect();
    fetchStatus();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return {
    status,
    chatMessages,
    isConnected,
    sendChatMessage,
    startLiveShow,
    stopLiveShow,
    fetchStatus
  };
};