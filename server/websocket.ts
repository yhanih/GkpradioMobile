import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { verifyToken } from './auth-supabase-only';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  username?: string;
  email?: string;
  isAuthenticated: boolean;
  clientId?: string;
}

interface BroadcastClient {
  ws: AuthenticatedWebSocket;
  type: 'listener' | 'broadcaster';
  userId: number;
  username: string;
  lastChatMessage?: number;
  lastAudioData?: number;
  chatMessageCount: number;
  audioDataCount: number;
  violationCount: number;
}

interface RateLimitConfig {
  chatMessageInterval: number;
  audioDataInterval: number;
  maxChatMessagesPerMinute: number;
  maxAudioChunksPerSecond: number;
  violationThreshold: number;
}

class LiveStreamManager {
  private clients: Map<string, BroadcastClient> = new Map();
  private activeBroadcasters: Map<string, { userId: number; username: string; title?: string }> = new Map();
  private listenerCount = 0;

  private rateLimitConfig: RateLimitConfig = {
    chatMessageInterval: 1000,
    audioDataInterval: 50,
    maxChatMessagesPerMinute: 30,
    maxAudioChunksPerSecond: 20,
    violationThreshold: 5,
  };

  constructor(private wss: WebSocketServer) {
    this.setupWebSocketServer();
    this.startRateLimitCleanup();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      ws.clientId = clientId;
      ws.isAuthenticated = false;

      try {
        const token = this.extractToken(request);
        
        if (!token) {
          this.rejectConnection(ws, 'Authentication required. Please provide a valid token.');
          return;
        }

        const userInfo = await verifyToken(token);
        
        if (!userInfo) {
          this.rejectConnection(ws, 'Invalid or expired token. Please log in again.');
          return;
        }

        ws.userId = userInfo.userId;
        ws.username = userInfo.username;
        ws.email = userInfo.email;
        ws.isAuthenticated = true;

        this.clients.set(clientId, {
          ws,
          type: 'listener',
          userId: userInfo.userId,
          username: userInfo.username,
          chatMessageCount: 0,
          audioDataCount: 0,
          violationCount: 0,
        });

        this.updateListenerCount();

        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(clientId, message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.sendError(clientId, 'Invalid message format');
          }
        });

        ws.on('close', () => {
          const client = this.clients.get(clientId);
          
          if (client?.type === 'broadcaster') {
            this.activeBroadcasters.delete(clientId);
            this.broadcastToListeners({ 
              type: 'broadcastEnded', 
              broadcasterId: clientId,
              username: client.username 
            });
          }
          
          this.clients.delete(clientId);
          this.updateListenerCount();
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for ${clientId}:`, error);
          this.clients.delete(clientId);
          this.updateListenerCount();
        });

        this.sendToClient(clientId, {
          type: 'connected',
          clientId,
          userId: userInfo.userId,
          username: userInfo.username,
          listenerCount: this.listenerCount
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.rejectConnection(ws, 'Authentication failed');
      }
    });
  }

  private extractToken(request: IncomingMessage): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      return tokenParam;
    }

    return null;
  }

  private rejectConnection(ws: AuthenticatedWebSocket, reason: string) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: reason 
    }));
    ws.close(1008, reason);
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client || !client.ws.isAuthenticated) {
      this.sendError(clientId, 'Not authenticated');
      return;
    }

    switch (message.type) {
      case 'startBroadcast':
        this.handleStartBroadcast(clientId, message);
        break;
      
      case 'stopBroadcast':
        this.handleStopBroadcast(clientId);
        break;
      
      case 'audioData':
        this.handleAudioData(clientId, message);
        break;
      
      case 'chatMessage':
        this.handleChatMessage(clientId, message);
        break;
      
      case 'requestListenerCount':
        this.sendListenerCount(clientId);
        break;

      default:
        this.sendError(clientId, 'Unknown message type');
        break;
    }
  }

  private handleStartBroadcast(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!client.ws.isAuthenticated) {
      this.sendError(clientId, 'Authentication required to start broadcast');
      this.disconnectClient(clientId, 'Unauthorized broadcast attempt');
      return;
    }

    if (this.activeBroadcasters.size > 0) {
      this.sendError(clientId, 'Another broadcast is already active');
      return;
    }

    client.type = 'broadcaster';
    this.activeBroadcasters.set(clientId, {
      userId: client.userId,
      username: client.username,
      title: message.title,
    });
    
    this.broadcastToListeners({
      type: 'broadcastStarted',
      broadcasterId: clientId,
      userId: client.userId,
      username: client.username,
      title: message.title,
      host: message.host || client.username,
      description: message.description
    });

    this.sendToClient(clientId, {
      type: 'broadcastStarted',
      success: true,
      listenerCount: this.getListenerCount()
    });

    console.log(`Broadcast started by user ${client.username} (${client.userId})`);
  }

  private handleStopBroadcast(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.type !== 'broadcaster') {
      this.sendError(clientId, 'You are not currently broadcasting');
      return;
    }

    if (!this.activeBroadcasters.has(clientId)) {
      this.sendError(clientId, 'You do not own the current broadcast');
      this.disconnectClient(clientId, 'Unauthorized broadcast stop attempt');
      return;
    }

    const broadcasterInfo = this.activeBroadcasters.get(clientId);
    if (broadcasterInfo && broadcasterInfo.userId !== client.userId) {
      this.sendError(clientId, 'You can only stop your own broadcast');
      this.disconnectClient(clientId, 'Unauthorized broadcast stop attempt');
      return;
    }

    this.activeBroadcasters.delete(clientId);
    client.type = 'listener';

    this.broadcastToListeners({
      type: 'broadcastEnded',
      broadcasterId: clientId,
      username: client.username
    });

    this.sendToClient(clientId, {
      type: 'broadcastStopped',
      success: true
    });

    console.log(`Broadcast stopped by user ${client.username} (${client.userId})`);
  }

  private handleAudioData(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.type !== 'broadcaster') {
      this.sendError(clientId, 'Only broadcasters can send audio data');
      this.recordViolation(clientId);
      return;
    }

    if (!this.activeBroadcasters.has(clientId)) {
      this.sendError(clientId, 'You are not the active broadcaster');
      this.disconnectClient(clientId, 'Unauthorized audio data attempt');
      return;
    }

    if (!this.checkAudioDataRateLimit(clientId)) {
      this.sendError(clientId, 'Audio data rate limit exceeded');
      this.recordViolation(clientId);
      return;
    }

    this.broadcastToListeners({
      type: 'audioData',
      data: message.data,
      timestamp: Date.now()
    }, clientId);
  }

  private handleChatMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!this.checkChatRateLimit(clientId)) {
      this.sendError(clientId, 'Chat message rate limit exceeded. Please slow down.');
      this.recordViolation(clientId);
      return;
    }

    if (!message.message || message.message.trim().length === 0) {
      this.sendError(clientId, 'Chat message cannot be empty');
      return;
    }

    if (message.message.length > 500) {
      this.sendError(clientId, 'Chat message too long (max 500 characters)');
      return;
    }

    this.broadcastToAll({
      type: 'chatMessage',
      clientId,
      userId: client.userId,
      username: client.username,
      message: message.message,
      timestamp: Date.now()
    }, clientId);
  }

  private checkChatRateLimit(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const now = Date.now();
    const lastMessage = client.lastChatMessage || 0;

    if (now - lastMessage < this.rateLimitConfig.chatMessageInterval) {
      return false;
    }

    client.lastChatMessage = now;
    client.chatMessageCount++;

    setTimeout(() => {
      const c = this.clients.get(clientId);
      if (c) c.chatMessageCount = Math.max(0, c.chatMessageCount - 1);
    }, 60000);

    return client.chatMessageCount <= this.rateLimitConfig.maxChatMessagesPerMinute;
  }

  private checkAudioDataRateLimit(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const now = Date.now();
    const lastData = client.lastAudioData || 0;

    if (now - lastData < this.rateLimitConfig.audioDataInterval) {
      return false;
    }

    client.lastAudioData = now;
    client.audioDataCount++;

    setTimeout(() => {
      const c = this.clients.get(clientId);
      if (c) c.audioDataCount = Math.max(0, c.audioDataCount - 1);
    }, 1000);

    return client.audioDataCount <= this.rateLimitConfig.maxAudioChunksPerSecond;
  }

  private recordViolation(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.violationCount++;

    if (client.violationCount >= this.rateLimitConfig.violationThreshold) {
      console.warn(`Client ${clientId} (${client.username}) exceeded violation threshold. Disconnecting.`);
      this.disconnectClient(clientId, 'Too many violations');
    }
  }

  private disconnectClient(clientId: string, reason: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendError(clientId, `Disconnected: ${reason}`);
    
    setTimeout(() => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1008, reason);
      }
      this.clients.delete(clientId);
    }, 100);
  }

  private sendError(clientId: string, message: string) {
    this.sendToClient(clientId, {
      type: 'error',
      message
    });
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToListeners(message: any, excludeClientId?: string) {
    this.clients.forEach((client, clientId) => {
      if (client.type === 'listener' && 
          clientId !== excludeClientId && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcastToAll(message: any, excludeClientId?: string) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  private updateListenerCount() {
    this.listenerCount = this.getListenerCount();
    
    this.clients.forEach((client, clientId) => {
      if (client.type === 'broadcaster' && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, {
          type: 'listenerCount',
          count: this.listenerCount
        });
      }
    });
  }

  private sendListenerCount(clientId: string) {
    this.sendToClient(clientId, {
      type: 'listenerCount',
      count: this.listenerCount
    });
  }

  private getListenerCount(): number {
    let count = 0;
    this.clients.forEach(client => {
      if (client.type === 'listener') {
        count++;
      }
    });
    return count;
  }

  private startRateLimitCleanup() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.violationCount > 0) {
          client.violationCount = Math.max(0, client.violationCount - 1);
        }
      });
    }, 60000);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getBroadcastStatus() {
    return {
      activeBroadcasters: this.activeBroadcasters.size,
      totalListeners: this.listenerCount,
      totalConnections: this.clients.size,
      broadcasters: Array.from(this.activeBroadcasters.entries()).map(([id, info]) => ({
        id,
        username: info.username,
        userId: info.userId,
        title: info.title,
      })),
    };
  }
}

export function setupWebSocket(server: Server): LiveStreamManager {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false,
    verifyClient: (info, callback) => {
      callback(true);
    }
  });

  console.log('WebSocket server setup on /ws with authentication enabled');
  
  return new LiveStreamManager(wss);
}

export { LiveStreamManager };
