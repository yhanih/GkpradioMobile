import fetch from 'node-fetch';

interface AzuraCastStation {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  frontend: string;
  backend: string;
  listen_url: string;
  is_enabled: boolean;
  nowplaying: {
    song: {
      title: string;
      artist: string;
      album: string;
      art: string;
    };
    listeners: {
      total: number;
      unique: number;
    };
    live: {
      is_live: boolean;
      streamer_name: string;
    };
  };
}

interface AzuraCastNowPlaying {
  station: AzuraCastStation;
  listeners: {
    total: number;
    unique: number;
  };
  live: {
    is_live: boolean;
    streamer_name: string;
  };
  now_playing: {
    song: {
      id: string;
      title: string;
      artist: string;
      album: string;
      art: string;
    };
    playlist: string;
    duration: number;
    elapsed: number;
  };
}

class AzuraCastAPI {
  private baseUrl: string;
  private apiKey: string;
  private stationId: string;

  constructor() {
    this.baseUrl = process.env.AZURACAST_BASE_URL || '';
    this.apiKey = process.env.AZURACAST_API_KEY || '';
    this.stationId = process.env.AZURACAST_STATION_ID || '';
    
    if (!this.baseUrl || !this.apiKey || !this.stationId) {
      console.warn('AzuraCast credentials not configured');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('AzuraCast credentials not configured');
    }

    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`AzuraCast API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AzuraCast API request failed:', error);
      throw error;
    }
  }

  async getStationStatus(): Promise<AzuraCastNowPlaying> {
    return await this.makeRequest(`/nowplaying/${this.stationId}`) as AzuraCastNowPlaying;
  }

  async getStationInfo(): Promise<AzuraCastStation> {
    return await this.makeRequest(`/station/${this.stationId}`) as AzuraCastStation;
  }

  async getListenerCount(): Promise<number> {
    try {
      const nowPlaying = await this.getStationStatus();
      return nowPlaying.listeners?.total || 0;
    } catch (error) {
      console.error('Failed to get listener count:', error);
      return 0;
    }
  }

  async getCurrentTrack() {
    try {
      const nowPlaying = await this.getStationStatus();
      return {
        title: nowPlaying.now_playing?.song?.title || 'Unknown',
        artist: nowPlaying.now_playing?.song?.artist || 'Unknown Artist',
        album: nowPlaying.now_playing?.song?.album || '',
        artwork: nowPlaying.now_playing?.song?.art || '',
        duration: nowPlaying.now_playing?.duration || 0,
        elapsed: nowPlaying.now_playing?.elapsed || 0,
        isLive: nowPlaying.live?.is_live || false,
        streamerName: nowPlaying.live?.streamer_name || ''
      };
    } catch (error) {
      console.error('Failed to get current track:', error);
      return {
        title: 'Offline',
        artist: 'GKP Radio',
        album: '',
        artwork: '',
        duration: 0,
        elapsed: 0,
        isLive: false,
        streamerName: ''
      };
    }
  }

  async getStreamUrl(): Promise<string> {
    try {
      const station = await this.getStationInfo();
      return station.listen_url || '';
    } catch (error) {
      console.error('Failed to get stream URL:', error);
      return '';
    }
  }

  async isStationLive(): Promise<boolean> {
    try {
      const nowPlaying = await this.getStationStatus();
      return nowPlaying.live?.is_live || false;
    } catch (error) {
      console.error('Failed to check if station is live:', error);
      return false;
    }
  }

  async getStreamHistory(limit: number = 10) {
    try {
      return await this.makeRequest(`/station/${this.stationId}/history?limit=${limit}`);
    } catch (error) {
      console.error('Failed to get stream history:', error);
      return [];
    }
  }

  async searchMusic(query: string) {
    try {
      return await this.makeRequest(`/station/${this.stationId}/files?searchPhrase=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Failed to search music:', error);
      return [];
    }
  }

  // Control methods (require appropriate permissions)
  async startStation() {
    try {
      return await this.makeRequest(`/station/${this.stationId}/restart`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to start station:', error);
      throw error;
    }
  }

  async stopStation() {
    try {
      return await this.makeRequest(`/station/${this.stationId}/stop`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to stop station:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey && this.stationId);
  }
}

export const azuraCastAPI = new AzuraCastAPI();
export type { AzuraCastNowPlaying, AzuraCastStation };