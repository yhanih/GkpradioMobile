import { WebSocketServer } from 'ws';
import type { Server } from 'http';

interface StreamState {
  isLive: boolean;
  streamUrl: string;
  title: string;
  streamer: string;
  viewers: number;
  startTime?: Date;
}

class StreamingManager {
  private state: StreamState = {
    isLive: false,
    streamUrl: '',
    title: 'GKP Radio Live Stream',
    streamer: 'Pastor Team',
    viewers: 0
  };

  private wss?: WebSocketServer;
  private connectedClients = new Set();

  init(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/stream' 
    });

    this.wss.on('connection', (ws) => {
      this.connectedClients.add(ws);
      console.log('🎥 New streaming client connected');
      
      // Send current state to new client
      ws.send(JSON.stringify({
        type: 'stream_state',
        data: this.state
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('🎥 Streaming client disconnected');
      });
    });

    console.log('🎥 Streaming WebSocket server initialized');
  }

  private handleMessage(ws: any, message: any) {
    switch (message.type) {
      case 'start_stream':
        this.startStream(message.data);
        break;
      case 'stop_stream':
        this.stopStream();
        break;
      case 'viewer_join':
        this.state.viewers++;
        this.broadcastState();
        break;
      case 'viewer_leave':
        this.state.viewers = Math.max(0, this.state.viewers - 1);
        this.broadcastState();
        break;
    }
  }

  startStream(data: { streamUrl?: string; title?: string; streamer?: string }) {
    this.state = {
      ...this.state,
      isLive: true,
      streamUrl: data.streamUrl || `http://localhost:${process.env.RTMP_HTTP_PORT || 8000}/live/gkp_radio_live.flv`,
      title: data.title || this.state.title,
      streamer: data.streamer || this.state.streamer,
      startTime: new Date()
    };

    console.log('🔴 Stream started:', this.state.title);
    this.broadcastState();
    return this.state;
  }

  startStreamHTTP(streamUrl: string, title?: string, streamer?: string) {
    return this.startStream({ streamUrl, title, streamer });
  }

  stopStream() {
    this.state = {
      ...this.state,
      isLive: false,
      streamUrl: '',
      viewers: 0,
      startTime: undefined
    };

    console.log('⚫ Stream stopped');
    this.broadcastState();
    return this.state;
  }

  stopStreamHTTP() {
    return this.stopStream();
  }

  getState() {
    return this.state;
  }

  private broadcastState() {
    const message = JSON.stringify({
      type: 'stream_state',
      data: this.state
    });

    this.connectedClients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

export default StreamingManager;