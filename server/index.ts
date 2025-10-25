import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { baseSecurity } from "./security";

const app = express();

// Apply security middleware first
baseSecurity(app);

// Configure CORS for mobile app access
// Allow requests from mobile apps (Expo), web clients, and development servers
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, allow:
    // - Your production domain
    // - Expo Go app
    // - Expo development clients
    // - Replit domains
    const allowedOrigins = [
      /^https?:\/\/.*\.replit\.dev$/,
      /^https?:\/\/.*\.repl\.co$/,
      /^exp:\/\/.*$/,  // Expo Go
      /^https?:\/\/localhost(:\d+)?$/,
      /^https:\/\/godkingdomprinciplesradio\.com$/,
      /^https:\/\/.*\.godkingdomprinciplesradio\.com$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Still allow but log for monitoring
      console.warn(`CORS: Allowing non-whitelisted origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize WebSocket streaming for browser-based broadcasting
  const WebSocketStreamingManager = (await import('./websocket-streaming')).default;
  const webSocketStreamingManager = new WebSocketStreamingManager(server);
  
  // Add streaming routes
  const { registerStreamingRoutes } = await import('./streaming-routes');
  registerStreamingRoutes(app, webSocketStreamingManager);
  
  // Start RTMP server for direct OBS streaming
  const { startRTMPServer } = await import('./rtmp-server');
  startRTMPServer();
  
  // Setup HLS streaming for video
  const { setupHLSStreaming } = await import('./hls-streaming');
  setupHLSStreaming(app);
  
  // Add server metrics endpoint
  const { getServerMetrics } = await import('./stream-optimizer');
  app.get('/api/server/metrics', (req, res) => {
    res.json(getServerMetrics());
  });

  // Start email notification processor
  const { startEmailProcessor } = await import('./notifications-supabase');
  startEmailProcessor(0.5); // Process every 30 seconds

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Add middleware to handle Replit preview domains before Vite processes them
    app.use((req, res, next) => {
      const host = req.get('host');
      if (host && (host.includes('.replit.dev') || host.includes('.repl.co'))) {
        // Override the host header to make it acceptable to Vite
        req.headers['host'] = 'localhost:5000';
      }
      next();
    });
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on configured port (5000 for Replit)
  // this serves both the API and the client.
  const port = 5000; // Force port 5000 for Replit environment
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
