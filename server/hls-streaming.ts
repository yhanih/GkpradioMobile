import express from 'express';
import path from 'path';
import fs from 'fs';

// HLS (HTTP Live Streaming) setup for video streaming from OBS
export function setupHLSStreaming(app: express.Application) {
  // Create HLS directory if it doesn't exist
  const hlsDir = path.join(process.cwd(), 'hls');
  if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
  }

  // Serve HLS playlist and segments
  app.use('/hls', express.static(hlsDir, {
    setHeaders: (res, path) => {
      // Enable CORS for HLS streaming
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Set proper MIME types for HLS
      if (path.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else if (path.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/MP2T');
      }
      
      // Disable caching for live content
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));
}

// Check if stream is currently live
export function isStreamLive(): boolean {
  const hlsDir = path.join(process.cwd(), 'hls');
  const playlistPath = path.join(hlsDir, 'stream.m3u8');
  
  if (!fs.existsSync(playlistPath)) {
    return false;
  }
  
  // Check if playlist was modified recently (within last 30 seconds)
  const stats = fs.statSync(playlistPath);
  const now = new Date().getTime();
  const fileTime = stats.mtime.getTime();
  const timeDiff = now - fileTime;
  
  return timeDiff < 30000; // 30 seconds
}

// Get stream URL if live
export function getStreamUrl(): string | null {
  if (isStreamLive()) {
    return '/hls/stream.m3u8';
  }
  return null;
}