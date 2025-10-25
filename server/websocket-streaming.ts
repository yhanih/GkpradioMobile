import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface StreamClient {
  id: string;
  ws: WebSocket;
  type: 'broadcaster' | 'viewer';
  joinTime: Date;
}

class StreamingManager {
  private wss: WebSocketServer;
  private clients: Map<string, StreamClient> = new Map();
  private activeStream: any = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/stream'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const clientId = this.generateClientId();
    const client: StreamClient = {
      id: clientId,
      ws,
      type: 'viewer',
      joinTime: new Date()
    };

    this.clients.set(clientId, client);

    // Send current stream status
    this.sendToClient(client, {
      type: 'stream_status',
      isLive: this.activeStream !== null,
      viewerCount: this.getViewerCount(),
      streamData: this.activeStream
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        // Invalid message format - ignore
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      this.broadcastViewerCount();
    });

    ws.on('error', (error) => {
      this.clients.delete(clientId);
      this.broadcastViewerCount();
      
      // Try to send error message to client if possible
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Connection error occurred'
          }));
        }
      } catch (sendError) {
        // Ignore send errors when connection is broken
      }
    });
  }

  private handleMessage(client: StreamClient, message: any) {
    switch (message.type) {
      case 'start_broadcast':
        this.handleStartBroadcast(client, message);
        break;
      
      case 'stop_broadcast':
        this.handleStopBroadcast(client);
        break;
        
      case 'join_as_broadcaster':
        this.handleJoinAsBroadcaster(client, message);
        break;
        
      case 'chat_message':
        this.handleChatMessage(client, message);
        break;
        
      default:
        // Unknown message type - ignore
    }
  }

  private handleJoinAsBroadcaster(client: StreamClient, message: any) {
    client.type = 'broadcaster';
    
    this.sendToClient(client, {
      type: 'broadcaster_status',
      canBroadcast: true,
      rtmpUrl: `${process.env.RTMP_BASE_URL || 'rtmp://localhost:1935'}/live`,
      streamKey: 'gkp_radio_live'
    });
  }

  private handleChatMessage(client: StreamClient, message: any) {
    const chatData = {
      type: 'chat_message',
      id: this.generateClientId(),
      username: message.username || 'Anonymous',
      message: message.message,
      timestamp: new Date().toISOString(),
      clientId: client.id
    };

    // Broadcast to all clients
    this.broadcast(chatData);
  }

  private handleStartBroadcast(client: StreamClient, message: any) {
    if (client.type !== 'broadcaster') {
      this.sendToClient(client, {
        type: 'error',
        message: 'Only broadcasters can start streams'
      });
      return;
    }

    this.activeStream = {
      id: this.generateClientId(),
      title: message.title || 'GKP Radio Live Stream',
      description: message.description || 'Live broadcast',
      broadcaster: client.id,
      startTime: new Date().toISOString(),
      streamUrl: `${process.env.HLS_BASE_URL || 'http://localhost:8000'}/live/gkp_radio_live.flv`
    };


    // Notify all clients
    this.broadcast({
      type: 'stream_started',
      streamData: this.activeStream,
      viewerCount: this.getViewerCount()
    });
  }

  private handleStopBroadcast(client: StreamClient) {
    if (this.activeStream && this.activeStream.broadcaster === client.id) {
      this.activeStream = null;

      // Notify all clients
      this.broadcast({
        type: 'stream_stopped',
        viewerCount: this.getViewerCount()
      });
    }
  }

  public getStreamStatus() {
    return {
      isLive: this.activeStream !== null,
      streamData: this.activeStream,
      viewerCount: this.getViewerCount(),
      connectedClients: this.clients.size
    };
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private sendToClient(client: StreamClient, message: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        // Remove client if sending fails
        this.clients.delete(client.id);
      }
    }
  }

  private broadcast(message: any) {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  private broadcastViewerCount() {
    this.broadcast({
      type: 'viewer_count_update',
      viewerCount: this.getViewerCount()
    });
  }

  private getViewerCount(): number {
    return Array.from(this.clients.values()).filter(c => c.type === 'viewer').length;
  }
}

export default StreamingManager;