import express from 'express';
import fetch from 'node-fetch';
import https from 'https';

// SECURITY NOTE: This is for development only. In production, use proper SSL certificates.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const AZURACAST_BASE_URL = process.env.AZURACAST_BASE_URL || '';
const STATION_ID = parseInt(process.env.AZURACAST_STATION_ID || '1');

export function registerStreamingRoutes(app: express.Application, streamingManager: any) {
  
  // Proxy AzuraCast stream to handle CORS issues
  app.get('/api/stream/proxy', async (req, res) => {
    try {
      const streamUrl = `${AZURACAST_BASE_URL}/listen/gkp_radio/radio.mp3`;
      const response = await fetch(streamUrl);
      
      if (!response.ok) {
        return res.status(500).json({ error: 'Stream not available' });
      }
      
      // Set appropriate headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      
      // Pipe the stream through our server
      response.body?.pipe(res);
      
    } catch (error: any) {
      res.status(500).json({ error: 'Stream proxy failed' });
    }
  });
  // Get current stream state from real AzuraCast server with fallback
  app.get('/api/stream/status', async (req, res) => {
    try {
      // Try to fetch real metadata from AzuraCast with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${AZURACAST_BASE_URL}/api/nowplaying/${STATION_ID}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`AzuraCast API returned ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      // Map AzuraCast response to our format
      const streamStatus = {
        isLive: data.live?.is_live || false,
        isConnected: true,
        song: {
          title: data.now_playing?.song?.title || 'Unknown Track',
          artist: data.now_playing?.song?.artist || 'Unknown Artist',
          album: data.now_playing?.song?.album || null
        },
        station: {
          name: data.station?.name || 'GKP Radio',
          listeners: data.listeners?.total || 0,
          isLive: data.live?.is_live || false
        },
        program: {
          title: data.live?.is_live ? 'Live Show' : 'AutoDJ',
          host: data.live?.streamer_name || 'AutoDJ',
          description: data.live?.is_live ? 'Live broadcasting' : 'Automated music programming'
        },
        streamUrl: `${AZURACAST_BASE_URL}/listen/gkp_radio/radio.mp3`
      };
      
      res.json(streamStatus);
    } catch (error: any) {
      // Provide fallback data when AzuraCast is unavailable
      
      const fallbackStatus = {
        isLive: false,
        isConnected: true, // Still connected to our server, just AzuraCast is unavailable
        song: {
          title: 'Service Temporarily Unavailable',
          artist: 'GKP Radio',
          album: null
        },
        station: {
          name: 'GKP Radio',
          listeners: 0,
          isLive: false
        },
        program: {
          title: 'Technical Maintenance',
          host: 'GKP Radio Team',
          description: 'Our streaming service is temporarily under maintenance. Please check back shortly.'
        },
        streamUrl: `${AZURACAST_BASE_URL}/listen/gkp_radio/radio.mp3`,
        error: error.name === 'AbortError' ? 'Request timeout' : 'Stream temporarily unavailable'
      };
      
      // Return 200 OK with fallback data instead of 500 error
      res.json(fallbackStatus);
    }
  });

  // Start a stream (called by broadcast dashboard)
  app.post('/api/stream/start', (req, res) => {
    const { title, description } = req.body;
    
    try {
      const state = {
        isLive: true,
        title: title || 'GKP Radio Live Stream',
        description: description || 'Live broadcast',
        startTime: new Date().toISOString(),
        viewerCount: 0
      };
      res.json(state);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to start stream' });
    }
  });

  // Stop the stream
  app.post('/api/stream/stop', (req, res) => {
    try {
      const state = {
        isLive: false,
        title: null,
        description: null,
        startTime: null,
        viewerCount: 0
      };
      res.json(state);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to stop stream' });
    }
  });

  // Update stream info
  app.patch('/api/stream/update', (req, res) => {
    const { title, description } = req.body;
    try {
      // For now, return success - this would integrate with AzuraCast admin API later
      res.json({ success: true, title, description });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update stream' });
    }
  });

  // Live show broadcasting endpoints with HLS integration
  app.get('/api/live/status', async (req, res) => {
    try {
      const { isStreamLive, getStreamUrl } = await import('./hls-streaming');
      const status = streamingManager.getStreamStatus();
      
      // Check if HLS video stream is live
      const hlsLive = isStreamLive();
      const hlsUrl = getStreamUrl();
      
      // Combine HLS status with existing stream status
      const combinedStatus = {
        ...status,
        isLive: status.isLive || hlsLive,
        streamUrl: hlsUrl || status.streamUrl,
        type: hlsLive ? 'video_stream' : (status.isLive ? 'live_show' : 'radio'),
        hlsAvailable: hlsLive,
        hlsUrl: hlsUrl
      };
      
      res.json(combinedStatus);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get live status' });
    }
  });

  // Start live show (switches from radio to live)
  app.post('/api/live/start', (req, res) => {
    const { title, description, broadcaster } = req.body;
    
    try {
      const liveStream = {
        isLive: true,
        type: 'live_show',
        title: title || 'GKP Radio Live Show',
        description: description || 'Live show broadcasting',
        broadcaster: broadcaster || 'Host',
        startTime: new Date().toISOString(),
        streamUrl: `${process.env.HLS_BASE_URL || 'http://localhost:8000'}/live/gkp_radio_live.flv`,
        rtmpIngest: `${process.env.RTMP_BASE_URL || 'rtmp://localhost:1935'}/live/gkp_radio_live`
      };
      
      res.json(liveStream);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to start live show' });
    }
  });

  // Stop live show (switches back to radio)
  app.post('/api/live/stop', (req, res) => {
    try {
      const status = {
        isLive: false,
        type: 'radio',
        message: 'Switched back to radio stream'
      };
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to stop live show' });
    }
  });
}