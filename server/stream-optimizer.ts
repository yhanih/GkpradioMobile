import { Request, Response, NextFunction } from 'express';
import os from 'os';

// Middleware to monitor server resources and optimize streaming
export function streamOptimizer() {
  let lastCheck = Date.now();
  let isHighLoad = false;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    
    // Check server load every 5 seconds
    if (now - lastCheck > 5000) {
      lastCheck = now;
      
      // Get system metrics
      const cpuUsage = os.loadavg()[0]; // 1 minute average
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      // Determine if server is under high load
      isHighLoad = cpuUsage > 2.0 || memUsagePercent > 85;
      
      if (isHighLoad) {
        console.log(`High server load detected - CPU: ${cpuUsage.toFixed(2)}, Memory: ${memUsagePercent.toFixed(1)}%`);
      }
    }
    
    // Add headers to help with caching and reduce server load
    if (req.path.endsWith('.ts')) {
      res.setHeader('Cache-Control', 'public, max-age=10'); // Cache video segments for 10s
      res.setHeader('X-Server-Load', isHighLoad ? 'high' : 'normal');
    }
    
    // For manifest files, suggest lower quality when server is stressed
    if (req.path.endsWith('.m3u8') && isHighLoad) {
      res.setHeader('X-Suggested-Quality', 'low');
    }
    
    next();
  };
}

// Helper to get current server metrics
export function getServerMetrics() {
  const cpuUsage = os.loadavg()[0];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
  
  return {
    cpu: cpuUsage,
    memoryPercent: memUsagePercent,
    freeMemoryMB: Math.round(freeMem / 1024 / 1024),
    isHighLoad: cpuUsage > 2.0 || memUsagePercent > 85
  };
}