import { Express } from 'express';
import fetch from 'node-fetch';
import { streamOptimizer } from './stream-optimizer';

// Get Owncast URL from environment or use default
// CRITICAL: Use HTTPS URLs for production/mobile to comply with Apple App Transport Security
const OWNCAST_DEFAULT_URL = process.env.OWNCAST_BASE_URL || 
                             process.env.VITE_OWNCAST_SERVER_URL ||
                             'https://74.208.102.89:8080';

// Log warning if using insecure HTTP in production
if (process.env.NODE_ENV === 'production' && OWNCAST_DEFAULT_URL.startsWith('http://')) {
  console.warn('WARNING: Owncast configured with HTTP in production. Mobile apps may fail due to App Transport Security.');
}

// Try HTTPS first, fallback to HTTP only if necessary
async function getOwncastUrl(): Promise<string> {
  if (OWNCAST_BASE_URL) {
    return OWNCAST_BASE_URL;
  }
  
  // Use the configured URL directly
  OWNCAST_BASE_URL = OWNCAST_DEFAULT_URL;
  return OWNCAST_DEFAULT_URL;
}

let OWNCAST_BASE_URL: string | null = null;
const CACHE_TTL = 10000; // 10 seconds

interface CacheEntry {
  data: Buffer;
  timestamp: number;
  contentType: string;
}

const segmentCache = new Map<string, CacheEntry>();

export function setupOwncastProxy(app: Express) {
  // Apply stream optimizer middleware to all Owncast routes
  app.use('/api/owncast', streamOptimizer());
  
  // Status endpoint
  app.get('/api/owncast/status', async (req, res) => {
    try {
      const baseUrl = await getOwncastUrl();
      const response = await fetch(`${baseUrl}/api/status`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Owncast status error:', error);
      res.status(503).json({ online: false, viewerCount: 0, streamTitle: 'Stream Offline' });
    }
  });
  
  // Optimized stream proxy with caching
  app.get('/api/owncast/stream.m3u8', async (req, res) => {
    try {
      const baseUrl = await getOwncastUrl();
      const response = await fetch(`${baseUrl}/hls/stream.m3u8`);
      const content = await response.text();
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(content);
    } catch (error) {
      console.error('Stream manifest error:', error);
      res.status(503).send('Stream unavailable');
    }
  });
  
  // Segment proxy with caching
  app.get('/api/owncast/:quality/:segment', async (req, res) => {
    const { quality, segment } = req.params;
    const cacheKey = `${quality}/${segment}`;
    
    // Check cache first
    const cached = segmentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.data);
    }
    
    try {
      const baseUrl = await getOwncastUrl();
      const url = segment.endsWith('.m3u8') 
        ? `${baseUrl}/hls/${quality}/stream.m3u8`
        : `${baseUrl}/hls/${quality}/${segment}`;
        
      const response = await fetch(url);
      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'video/mp2t';
      
      // Cache the segment
      segmentCache.set(cacheKey, {
        data: buffer,
        timestamp: Date.now(),
        contentType
      });
      
      // Clean old cache entries
      if (segmentCache.size > 50) {
        const oldestKey = Array.from(segmentCache.keys())[0];
        segmentCache.delete(oldestKey);
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Cache', 'MISS');
      res.send(buffer);
    } catch (error) {
      console.error(`Segment fetch error for ${cacheKey}:`, error);
      res.status(503).send('Segment unavailable');
    }
  });
}

export async function getOwncastStatus() {
  try {
    const baseUrl = await getOwncastUrl();
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get Owncast status:', error);
    return { online: false, viewerCount: 0, streamTitle: 'Stream Offline' };
  }
}