var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/stream-optimizer.ts
var stream_optimizer_exports = {};
__export(stream_optimizer_exports, {
  getServerMetrics: () => getServerMetrics,
  streamOptimizer: () => streamOptimizer
});
import os from "os";
function streamOptimizer() {
  let lastCheck = Date.now();
  let isHighLoad = false;
  return (req, res, next) => {
    const now = Date.now();
    if (now - lastCheck > 5e3) {
      lastCheck = now;
      const cpuUsage = os.loadavg()[0];
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsagePercent = (totalMem - freeMem) / totalMem * 100;
      isHighLoad = cpuUsage > 2 || memUsagePercent > 85;
      if (isHighLoad) {
        console.log(`High server load detected - CPU: ${cpuUsage.toFixed(2)}, Memory: ${memUsagePercent.toFixed(1)}%`);
      }
    }
    if (req.path.endsWith(".ts")) {
      res.setHeader("Cache-Control", "public, max-age=10");
      res.setHeader("X-Server-Load", isHighLoad ? "high" : "normal");
    }
    if (req.path.endsWith(".m3u8") && isHighLoad) {
      res.setHeader("X-Suggested-Quality", "low");
    }
    next();
  };
}
function getServerMetrics() {
  const cpuUsage = os.loadavg()[0];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsagePercent = (totalMem - freeMem) / totalMem * 100;
  return {
    cpu: cpuUsage,
    memoryPercent: memUsagePercent,
    freeMemoryMB: Math.round(freeMem / 1024 / 1024),
    isHighLoad: cpuUsage > 2 || memUsagePercent > 85
  };
}
var init_stream_optimizer = __esm({
  "server/stream-optimizer.ts"() {
    "use strict";
  }
});

// server/owncast-proxy.ts
var owncast_proxy_exports = {};
__export(owncast_proxy_exports, {
  getOwncastStatus: () => getOwncastStatus,
  setupOwncastProxy: () => setupOwncastProxy
});
import fetch2 from "node-fetch";
function setupOwncastProxy(app2) {
  app2.use("/api/owncast", streamOptimizer());
  app2.get("/api/owncast/status", async (req, res) => {
    try {
      const response = await fetch2(`${OWNCAST_BASE_URL}/api/status`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Owncast status error:", error);
      res.status(503).json({ online: false, viewerCount: 0, streamTitle: "Stream Offline" });
    }
  });
  app2.get("/api/owncast/stream.m3u8", async (req, res) => {
    try {
      const response = await fetch2(`${OWNCAST_BASE_URL}/hls/stream.m3u8`);
      const content = await response.text();
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      res.send(content);
    } catch (error) {
      console.error("Stream manifest error:", error);
      res.status(503).send("Stream unavailable");
    }
  });
  app2.get("/api/owncast/:quality/:segment", async (req, res) => {
    const { quality, segment } = req.params;
    const cacheKey = `${quality}/${segment}`;
    const cached = segmentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.data);
    }
    try {
      const url = segment.endsWith(".m3u8") ? `${OWNCAST_BASE_URL}/hls/${quality}/stream.m3u8` : `${OWNCAST_BASE_URL}/hls/${quality}/${segment}`;
      const response = await fetch2(url);
      const buffer = await response.buffer();
      const contentType = response.headers.get("content-type") || "video/mp2t";
      segmentCache.set(cacheKey, {
        data: buffer,
        timestamp: Date.now(),
        contentType
      });
      if (segmentCache.size > 50) {
        const oldestKey = Array.from(segmentCache.keys())[0];
        segmentCache.delete(oldestKey);
      }
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Cache", "MISS");
      res.send(buffer);
    } catch (error) {
      console.error(`Segment fetch error for ${cacheKey}:`, error);
      res.status(503).send("Segment unavailable");
    }
  });
}
async function getOwncastStatus() {
  try {
    const response = await fetch2(`${OWNCAST_BASE_URL}/api/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get Owncast status:", error);
    return { online: false, viewerCount: 0, streamTitle: "Stream Offline" };
  }
}
var OWNCAST_BASE_URL, CACHE_TTL, segmentCache;
var init_owncast_proxy = __esm({
  "server/owncast-proxy.ts"() {
    "use strict";
    init_stream_optimizer();
    OWNCAST_BASE_URL = "https://74.208.102.89:8080";
    CACHE_TTL = 1e4;
    segmentCache = /* @__PURE__ */ new Map();
  }
});

// server/webrtc-proxy.ts
var webrtc_proxy_exports = {};
__export(webrtc_proxy_exports, {
  getWebRTCStatus: () => getWebRTCStatus,
  proxyWebRTCRequest: () => proxyWebRTCRequest
});
import fetch3 from "node-fetch";
async function proxyWebRTCRequest(req, res) {
  try {
    const mediamtxUrl = `http://localhost:8889${req.path}`;
    const response = await fetch3(mediamtxUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/sdp"
      },
      body: req.method !== "GET" ? req.body : void 0
    });
    const responseText = await response.text();
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status).send(responseText);
  } catch (error) {
    console.error("WebRTC proxy error:", error);
    res.status(500).json({ error: "WebRTC proxy failed" });
  }
}
async function getWebRTCStatus(req, res) {
  try {
    const response = await fetch3("http://localhost:9997/v3/paths/list");
    const data = await response.json();
    const livePath = data?.items?.find((item) => item.name === "live");
    const isLive = livePath && livePath.source && livePath.source.type === "rtmpConn";
    const viewers = livePath?.readers?.length || 0;
    res.json({
      online: isLive,
      viewerCount: viewers,
      streamTitle: "GKP Radio Live Stream",
      lastConnectTime: livePath?.source?.createdAt || null
    });
  } catch (error) {
    console.error("WebRTC status error:", error);
    res.json({
      online: false,
      viewerCount: 0,
      streamTitle: "GKP Radio Live Stream",
      lastConnectTime: null
    });
  }
}
var init_webrtc_proxy = __esm({
  "server/webrtc-proxy.ts"() {
    "use strict";
  }
});

// server/websocket-streaming.ts
var websocket_streaming_exports = {};
__export(websocket_streaming_exports, {
  default: () => websocket_streaming_default
});
import { WebSocket as WebSocket2, WebSocketServer as WebSocketServer2 } from "ws";
var StreamingManager, websocket_streaming_default;
var init_websocket_streaming = __esm({
  "server/websocket-streaming.ts"() {
    "use strict";
    StreamingManager = class {
      wss;
      clients = /* @__PURE__ */ new Map();
      activeStream = null;
      constructor(server) {
        this.wss = new WebSocketServer2({
          server,
          path: "/ws/stream"
        });
        this.wss.on("connection", this.handleConnection.bind(this));
      }
      handleConnection(ws2, req) {
        const clientId = this.generateClientId();
        const client = {
          id: clientId,
          ws: ws2,
          type: "viewer",
          joinTime: /* @__PURE__ */ new Date()
        };
        this.clients.set(clientId, client);
        console.log(`Client ${clientId} connected`);
        this.sendToClient(client, {
          type: "stream_status",
          isLive: this.activeStream !== null,
          viewerCount: this.getViewerCount(),
          streamData: this.activeStream
        });
        ws2.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(client, message);
          } catch (error) {
            console.error("Invalid message format:", error);
          }
        });
        ws2.on("close", () => {
          this.clients.delete(clientId);
          console.log(`Client ${clientId} disconnected`);
          this.broadcastViewerCount();
        });
        ws2.on("error", (error) => {
          console.error(`WebSocket error for client ${clientId}:`, error);
          this.clients.delete(clientId);
        });
      }
      handleMessage(client, message) {
        switch (message.type) {
          case "start_broadcast":
            this.handleStartBroadcast(client, message);
            break;
          case "stop_broadcast":
            this.handleStopBroadcast(client);
            break;
          case "join_as_broadcaster":
            this.handleJoinAsBroadcaster(client, message);
            break;
          case "chat_message":
            this.handleChatMessage(client, message);
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      }
      handleJoinAsBroadcaster(client, message) {
        client.type = "broadcaster";
        console.log(`Client ${client.id} joined as broadcaster`);
        this.sendToClient(client, {
          type: "broadcaster_status",
          canBroadcast: true,
          rtmpUrl: "rtmp://localhost:1935/live",
          streamKey: "gkp_radio_live"
        });
      }
      handleChatMessage(client, message) {
        const chatData = {
          type: "chat_message",
          id: this.generateClientId(),
          username: message.username || "Anonymous",
          message: message.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          clientId: client.id
        };
        this.broadcast(chatData);
      }
      handleStartBroadcast(client, message) {
        if (client.type !== "broadcaster") {
          this.sendToClient(client, {
            type: "error",
            message: "Only broadcasters can start streams"
          });
          return;
        }
        this.activeStream = {
          id: this.generateClientId(),
          title: message.title || "GKP Radio Live Stream",
          description: message.description || "Live broadcast",
          broadcaster: client.id,
          startTime: (/* @__PURE__ */ new Date()).toISOString(),
          streamUrl: `http://localhost:8000/live/gkp_radio_live.flv`
        };
        console.log("\u{1F534} Live broadcast started:", this.activeStream.title);
        this.broadcast({
          type: "stream_started",
          streamData: this.activeStream,
          viewerCount: this.getViewerCount()
        });
      }
      handleStopBroadcast(client) {
        if (this.activeStream && this.activeStream.broadcaster === client.id) {
          console.log("\u26AB Live broadcast stopped");
          this.activeStream = null;
          this.broadcast({
            type: "stream_stopped",
            viewerCount: this.getViewerCount()
          });
        }
      }
      getStreamStatus() {
        return {
          isLive: this.activeStream !== null,
          streamData: this.activeStream,
          viewerCount: this.getViewerCount(),
          connectedClients: this.clients.size
        };
      }
      generateClientId() {
        return Math.random().toString(36).substring(2, 15);
      }
      sendToClient(client, message) {
        if (client.ws.readyState === WebSocket2.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      }
      broadcast(message) {
        this.clients.forEach((client) => {
          this.sendToClient(client, message);
        });
      }
      broadcastViewerCount() {
        this.broadcast({
          type: "viewer_count_update",
          viewerCount: this.getViewerCount()
        });
      }
      getViewerCount() {
        return Array.from(this.clients.values()).filter((c) => c.type === "viewer").length;
      }
    };
    websocket_streaming_default = StreamingManager;
  }
});

// server/hls-streaming.ts
var hls_streaming_exports = {};
__export(hls_streaming_exports, {
  getStreamUrl: () => getStreamUrl,
  isStreamLive: () => isStreamLive,
  setupHLSStreaming: () => setupHLSStreaming
});
import express2 from "express";
import path3 from "path";
import fs2 from "fs";
function setupHLSStreaming(app2) {
  const hlsDir = path3.join(process.cwd(), "hls");
  if (!fs2.existsSync(hlsDir)) {
    fs2.mkdirSync(hlsDir, { recursive: true });
  }
  app2.use("/hls", express2.static(hlsDir, {
    setHeaders: (res, path4) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (path4.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      } else if (path4.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/MP2T");
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }));
  console.log("\u{1F4FA} HLS streaming server setup complete");
  console.log(`\u{1F4C2} HLS files will be served from: ${hlsDir}`);
  console.log("\u{1F3A5} OBS HLS Output Settings:");
  console.log("   Output Mode: Advanced");
  console.log("   Type: Custom Output (FFmpeg)");
  console.log(`   File Path: ${hlsDir}/stream.m3u8`);
  console.log("   Container Format: hls");
  console.log("   Video Encoder: libx264");
  console.log("   Audio Encoder: aac");
}
function isStreamLive() {
  const hlsDir = path3.join(process.cwd(), "hls");
  const playlistPath = path3.join(hlsDir, "stream.m3u8");
  if (!fs2.existsSync(playlistPath)) {
    return false;
  }
  const stats = fs2.statSync(playlistPath);
  const now = (/* @__PURE__ */ new Date()).getTime();
  const fileTime = stats.mtime.getTime();
  const timeDiff = now - fileTime;
  return timeDiff < 3e4;
}
function getStreamUrl() {
  if (isStreamLive()) {
    return "/hls/stream.m3u8";
  }
  return null;
}
var init_hls_streaming = __esm({
  "server/hls-streaming.ts"() {
    "use strict";
  }
});

// server/streaming-routes.ts
var streaming_routes_exports = {};
__export(streaming_routes_exports, {
  registerStreamingRoutes: () => registerStreamingRoutes
});
import fetch4 from "node-fetch";
import https from "https";
function registerStreamingRoutes(app2, streamingManager) {
  app2.get("/api/stream/proxy", async (req, res) => {
    try {
      const streamUrl = "http://74.208.102.89/listen/gkp_radio/radio.mp3";
      const response = await fetch4(streamUrl);
      if (!response.ok) {
        return res.status(500).json({ error: "Stream not available" });
      }
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
      response.body?.pipe(res);
    } catch (error) {
      console.error("Stream proxy error:", error);
      res.status(500).json({ error: "Stream proxy failed" });
    }
  });
  app2.get("/api/stream/status", async (req, res) => {
    try {
      const response = await fetch4(`${AZURACAST_BASE_URL}/api/nowplaying/${STATION_ID}`);
      if (!response.ok) {
        throw new Error(`AzuraCast API returned ${response.status}`);
      }
      const data = await response.json();
      const streamStatus = {
        isLive: data.live?.is_live || false,
        isConnected: true,
        song: {
          title: data.now_playing?.song?.title || "Unknown Track",
          artist: data.now_playing?.song?.artist || "Unknown Artist",
          album: data.now_playing?.song?.album || null
        },
        station: {
          name: data.station?.name || "GKP Radio",
          listeners: data.listeners?.total || 0,
          isLive: data.live?.is_live || false
        },
        program: {
          title: data.live?.is_live ? "Live Show" : "AutoDJ",
          host: data.live?.streamer_name || "AutoDJ",
          description: data.live?.is_live ? "Live broadcasting" : "Automated music programming"
        },
        streamUrl: `${AZURACAST_BASE_URL}/listen/gkp_radio/radio.mp3`
      };
      res.json(streamStatus);
    } catch (error) {
      console.error("AzuraCast API Error:", error);
      res.status(500).json({
        error: "Unable to connect to AzuraCast server",
        isConnected: false,
        details: error.message
      });
    }
  });
  app2.post("/api/stream/start", (req, res) => {
    const { title, description } = req.body;
    try {
      const state = {
        isLive: true,
        title: title || "GKP Radio Live Stream",
        description: description || "Live broadcast",
        startTime: (/* @__PURE__ */ new Date()).toISOString(),
        viewerCount: 0
      };
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to start stream" });
    }
  });
  app2.post("/api/stream/stop", (req, res) => {
    try {
      const state = {
        isLive: false,
        title: null,
        description: null,
        startTime: null,
        viewerCount: 0
      };
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop stream" });
    }
  });
  app2.patch("/api/stream/update", (req, res) => {
    const { title, description } = req.body;
    try {
      res.json({ success: true, title, description });
    } catch (error) {
      res.status(500).json({ error: "Failed to update stream" });
    }
  });
  app2.get("/api/live/status", async (req, res) => {
    try {
      const { isStreamLive: isStreamLive2, getStreamUrl: getStreamUrl2 } = await Promise.resolve().then(() => (init_hls_streaming(), hls_streaming_exports));
      const status = streamingManager.getStreamStatus();
      const hlsLive = isStreamLive2();
      const hlsUrl = getStreamUrl2();
      const combinedStatus = {
        ...status,
        isLive: status.isLive || hlsLive,
        streamUrl: hlsUrl || status.streamUrl,
        type: hlsLive ? "video_stream" : status.isLive ? "live_show" : "radio",
        hlsAvailable: hlsLive,
        hlsUrl
      };
      res.json(combinedStatus);
    } catch (error) {
      console.error("Failed to get live status:", error);
      res.status(500).json({ error: "Failed to get live status" });
    }
  });
  app2.post("/api/live/start", (req, res) => {
    const { title, description, broadcaster } = req.body;
    try {
      const liveStream = {
        isLive: true,
        type: "live_show",
        title: title || "GKP Radio Live Show",
        description: description || "Live show broadcasting",
        broadcaster: broadcaster || "Host",
        startTime: (/* @__PURE__ */ new Date()).toISOString(),
        streamUrl: "http://localhost:8000/live/gkp_radio_live.flv",
        rtmpIngest: "rtmp://localhost:1935/live/gkp_radio_live"
      };
      res.json(liveStream);
    } catch (error) {
      res.status(500).json({ error: "Failed to start live show" });
    }
  });
  app2.post("/api/live/stop", (req, res) => {
    try {
      const status = {
        isLive: false,
        type: "radio",
        message: "Switched back to radio stream"
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop live show" });
    }
  });
}
var httpsAgent, AZURACAST_BASE_URL, STATION_ID;
var init_streaming_routes = __esm({
  "server/streaming-routes.ts"() {
    "use strict";
    httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    AZURACAST_BASE_URL = "http://74.208.102.89";
    STATION_ID = 1;
  }
});

// server/rtmp-server.ts
var rtmp_server_exports = {};
__export(rtmp_server_exports, {
  default: () => rtmp_server_default,
  startRTMPServer: () => startRTMPServer
});
import NodeMediaServer from "node-media-server";
var config, nms, startRTMPServer, rtmp_server_default;
var init_rtmp_server = __esm({
  "server/rtmp-server.ts"() {
    "use strict";
    config = {
      rtmp: {
        port: 1935,
        chunk_size: 6e4,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
      },
      http: {
        port: 8e3,
        allow_origin: "*",
        mediaroot: "./media"
      },
      relay: {
        ffmpeg: "/usr/local/bin/ffmpeg",
        tasks: [
          {
            app: "live",
            mode: "push",
            edge: "rtmp://127.0.0.1:1935/hls"
          }
        ]
      }
    };
    nms = new NodeMediaServer(config);
    nms.on("preConnect", (id, args) => {
      console.log("[NodeEvent on preConnect]", `id=${id} args=${JSON.stringify(args)}`);
    });
    nms.on("postConnect", (id, args) => {
      console.log("[NodeEvent on postConnect]", `id=${id} args=${JSON.stringify(args)}`);
    });
    nms.on("prePublish", (id, streamPath, args) => {
      console.log("[NodeEvent on prePublish]", `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
    });
    nms.on("postPublish", (id, streamPath, args) => {
      console.log("[NodeEvent on postPublish]", `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      console.log("\u{1F534} GKP Radio Live Stream Started!");
    });
    nms.on("donePublish", (id, streamPath, args) => {
      console.log("[NodeEvent on donePublish]", `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      console.log("\u26AB GKP Radio Live Stream Ended!");
    });
    startRTMPServer = () => {
      nms.run();
      console.log("\u{1F3A5} RTMP Server started on port 1935");
      console.log("\u{1F4FA} HTTP Server started on port 8000");
      console.log("\u{1F399}\uFE0F Ready for OBS Studio streaming!");
      console.log("");
      console.log("OBS Settings:");
      console.log("- Service: Custom");
      console.log("- Server: rtmp://localhost:1935/live");
      console.log("- Stream Key: gkp_radio_live");
      console.log("");
    };
    rtmp_server_default = nms;
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage-session.ts
var SessionStorage = class {
  // User management - secure isolated per user
  users = /* @__PURE__ */ new Map();
  usersByUsername = /* @__PURE__ */ new Map();
  usersByEmail = /* @__PURE__ */ new Map();
  // User-specific data maps
  userLikes = /* @__PURE__ */ new Map();
  // userId -> Set of threadIds
  userFollows = /* @__PURE__ */ new Map();
  // userId -> Set of threadIds
  userPrayerMembers = /* @__PURE__ */ new Map();
  // userId -> isPrayerMember
  // Shared public data (safe to share)
  episodes = [];
  videos = [];
  communityThreads = [];
  communityComments = [];
  nextUserId = 1009;
  // Start after default users
  nextThreadId = 1;
  nextCommentId = 1;
  constructor() {
    this.initializeSampleData();
    this.createDefaultUsersSync();
  }
  createDefaultUsersSync() {
    const defaultPassword = process.env.DEFAULT_TEST_PASSWORD || (() => {
      throw new Error('DEFAULT_TEST_PASSWORD environment variable must be set for security');
    })();
    const testUser = {
      id: 1,
      username: "testuser1",
      email: "testuser1@example.com",
      password: defaultPassword,
      displayName: "TestUser1@Austin, USA",
      city: "Austin",
      country: "USA",
      bio: "Testing user",
      avatar: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const communityUsers = [
      {
        id: 1001,
        username: "faithwalker",
        email: "faithwalker@example.com",
        displayName: "Sarah@Nashville, USA",
        city: "Nashville",
        country: "USA",
        bio: "Walking in faith daily, mother of three, prayer warrior"
      },
      {
        id: 1002,
        username: "blessed_witness",
        email: "witness@example.com",
        displayName: "Michael@Atlanta, USA",
        city: "Atlanta",
        country: "USA",
        bio: "Sharing God's goodness, youth pastor for 8 years"
      },
      {
        id: 1003,
        username: "emma_believer",
        email: "emma@example.com",
        displayName: "Emma@Dallas, USA",
        city: "Dallas",
        country: "USA",
        bio: "College student trusting God through every season"
      },
      {
        id: 1004,
        username: "pastor_david",
        email: "david@example.com",
        displayName: "Pastor David@Phoenix, USA",
        city: "Phoenix",
        country: "USA",
        bio: "Lead Pastor at Cornerstone Church, serving 15+ years"
      },
      {
        id: 1005,
        username: "praying_mama",
        email: "maria@example.com",
        displayName: "Maria@Miami, USA",
        city: "Miami",
        country: "USA",
        bio: "Praying mama of five, interceding for families worldwide"
      },
      {
        id: 1006,
        username: "john_grace",
        email: "john@example.com",
        displayName: "John@Seattle, USA",
        city: "Seattle",
        country: "USA",
        bio: "Construction worker, men's ministry leader"
      },
      {
        id: 1007,
        username: "worship_heart",
        email: "rachel@example.com",
        displayName: "Rachel@Portland, USA",
        city: "Portland",
        country: "USA",
        bio: "Worship leader, songwriter, lover of Jesus"
      },
      {
        id: 1008,
        username: "teen_for_christ",
        email: "joshua@example.com",
        displayName: "Joshua@Denver, USA",
        city: "Denver",
        country: "USA",
        bio: "17 years old, boldly living for Christ in high school"
      }
    ];
    this.users.set(testUser.id, testUser);
    this.usersByUsername.set(testUser.username, testUser);
    this.usersByEmail.set(testUser.email, testUser);
    this.userLikes.set(testUser.id, /* @__PURE__ */ new Set());
    this.userFollows.set(testUser.id, /* @__PURE__ */ new Set());
    this.userPrayerMembers.set(testUser.id, false);
    communityUsers.forEach((userData) => {
      const user = {
        ...userData,
        password: defaultPassword,
        avatar: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.users.set(user.id, user);
      this.usersByUsername.set(user.username, user);
      this.usersByEmail.set(user.email, user);
      this.userLikes.set(user.id, /* @__PURE__ */ new Set());
      this.userFollows.set(user.id, /* @__PURE__ */ new Set());
      this.userPrayerMembers.set(user.id, false);
    });
    this.createPresetConversations();
  }
  createPresetConversations() {
    const presetThreads = [
      {
        id: 1,
        title: "Prayer Request: Healing for My Father",
        content: "Hello GKP family, my father has been in the hospital for the past week with some serious complications. The doctors are doing everything they can, but we know that God is the ultimate healer. Please pray for complete restoration of his health and for peace for our family during this difficult time. I truly believe in the power of prayer and this community. Thank you all \u{1F64F}",
        category: "Prayer Requests",
        authorId: 1001,
        // Sarah
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1e3).toISOString(),
        // 6 hours ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1e3).toISOString()
        // 1 hour ago
      },
      {
        id: 2,
        title: "Praise Report: New Job Blessing!",
        content: "I just had to share this amazing testimony with everyone! After being unemployed for 4 months and going through a really tough season, God provided me with an incredible job opportunity. Not only is it exactly what I prayed for, but the salary is 30% more than my previous job! His timing is always perfect, even when we can't see it. To anyone going through a difficult season right now - don't give up! God sees you and He has a plan. \u{1F389}\u2728",
        category: "Testimonies",
        authorId: 1002,
        // Michael  
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1e3).toISOString(),
        // 12 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString()
        // 2 hours ago
      },
      {
        id: 3,
        title: "How do you stay strong in faith during college?",
        content: "Hey everyone! I'm a sophomore in college and I'm finding it really challenging to maintain my faith on campus. There's so much pressure to fit in and sometimes I feel like I'm the only Christian in my friend group. The party culture is overwhelming and I often feel isolated. How did you guys navigate this season? Any practical tips for staying grounded in God's word while building genuine friendships? I really appreciate this community!",
        category: "Faith & Life",
        authorId: 1003,
        // Emma
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1e3).toISOString(),
        // 18 hours ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString()
        // 30 minutes ago
      },
      {
        id: 4,
        title: "Biblical principles for financial stewardship?",
        content: "As someone who's been walking with Christ for many years, I still struggle with applying biblical principles to my finances. With inflation and economic uncertainty, I find myself worrying about money more than trusting God's provision. What are some practical ways you apply Scripture to budgeting, giving, and financial planning? I'd love to hear how others have found freedom in this area. Any recommended resources or books?",
        category: "Bible Study",
        authorId: 1006,
        // John
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString(),
        // 1 day ago
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1e3).toISOString()
        // 3 hours ago
      },
      {
        id: 5,
        title: "Worship songs that have changed your life?",
        content: "Music has always been such a powerful way that God speaks to me. I'm curious about what worship songs have really impacted your spiritual journey? I'm working on some new songs for our church and would love to know what moves people's hearts toward worship. Whether it's a classic hymn or a modern song, I'd love to hear your stories about how God has used music in your life! \u{1F3B5}",
        category: "Worship & Music",
        authorId: 1007,
        // Rachel
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1e3).toISOString(),
        // 1.5 days ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1e3).toISOString()
        // 4 hours ago
      }
    ];
    this.communityThreads = presetThreads;
    const presetReplies = [
      // Replies for Prayer Request thread (ID: 1)
      {
        id: 1,
        content: "Praying for your father and your family right now, Sarah! God is faithful and He hears our prayers. Will be lifting you all up throughout the day. \u{1F64F}\u2764\uFE0F",
        threadId: 1,
        authorId: 1005,
        // Maria
        parentId: null,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 2,
        content: "Adding my prayers to yours! I went through something similar with my dad last year. God carried us through and I believe He will do the same for your family. Psalm 34:18 has been such a comfort - 'The Lord is close to the brokenhearted.' Sending love!",
        threadId: 1,
        authorId: 1004,
        // Pastor David
        parentId: null,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 3,
        content: "Thank you so much Maria and Pastor David! Your words mean the world to me. Update: Dad is doing a bit better today and the doctors are cautiously optimistic. God is good! \u{1F49A}",
        threadId: 1,
        authorId: 1001,
        // Sarah responding
        parentId: null,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1e3).toISOString()
      },
      // Replies for Job Blessing thread (ID: 2)
      {
        id: 4,
        content: "This is AMAZING Michael! What a beautiful testimony of God's faithfulness! I'm so happy for you and your family. This gives me hope during my own job search. Thank you for sharing! \u{1F389}",
        threadId: 2,
        authorId: 1003,
        // Emma
        parentId: null,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 5,
        content: "Praise God! I love hearing testimonies like this. It reminds me that God really does work all things together for good. Your season of waiting was preparing you for this blessing! \u{1F64C}",
        threadId: 2,
        authorId: 1007,
        // Rachel
        parentId: null,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 6,
        content: "@Emma I'm praying for your job search too! God has something special planned for you. Keep trusting His timing! \u{1F4AA}",
        threadId: 2,
        authorId: 1002,
        // Michael responding
        parentId: 4,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString()
      },
      // Replies for College Faith thread (ID: 3)
      {
        id: 7,
        content: "Emma, I remember feeling exactly the same way! What helped me was finding a solid campus ministry or Christian fellowship group. Having even 2-3 close Christian friends made all the difference. You're braver than you know for standing for your faith! \u{1F499}",
        threadId: 3,
        authorId: 1008,
        // Joshua (teen perspective)
        parentId: null,
        createdAt: new Date(Date.now() - 16 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 8,
        content: "Great advice Joshua! Emma, I also recommend starting each day with God's word. Even 10 minutes of reading Scripture can anchor your day. And don't underestimate the impact you're having - your light is shining even when you don't see it! Keep going! \u2728",
        threadId: 3,
        authorId: 1004,
        // Pastor David
        parentId: null,
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 9,
        content: "This is so encouraging, thank you both! I actually found a Christian club on campus this week and I'm going to check it out. Your words gave me the courage I needed. Love this community! \u{1F31F}",
        threadId: 3,
        authorId: 1003,
        // Emma responding
        parentId: null,
        createdAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString()
      },
      // Replies for Financial Stewardship thread (ID: 4)
      {
        id: 10,
        content: "John, I highly recommend 'The Total Money Makeover' by Dave Ramsey and 'Money, Possessions, and Eternity' by Randy Alcorn. Both helped me see finances through a biblical lens. The key is remembering we're stewards, not owners! \u{1F4DA}",
        threadId: 4,
        authorId: 1004,
        // Pastor David
        parentId: null,
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 11,
        content: "One thing that has transformed my relationship with money is setting up automatic tithing and savings. Taking the decision-making out of it helps me trust God's provision. Also, Philippians 4:19 is my go-to verse for financial anxiety! \u{1F4B0}",
        threadId: 4,
        authorId: 1001,
        // Sarah
        parentId: null,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 12,
        content: "These are fantastic resources and tips! I'm going to order those books this week. Sarah, I love the idea of automating giving - removes the temptation to hold back when things get tight. Thank you both! \u{1F64F}",
        threadId: 4,
        authorId: 1006,
        // John responding
        parentId: null,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1e3).toISOString()
      },
      // Replies for Worship Songs thread (ID: 5)
      {
        id: 13,
        content: "'How Great Thou Art' never fails to move me to tears. There's something about that hymn that just ushers in God's presence. Also love 'Goodness of God' by Bethel - reminds me of His faithfulness through every season! \u{1F3B5}",
        threadId: 5,
        authorId: 1005,
        // Maria
        parentId: null,
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 14,
        content: "For me it's 'Oceans' by Hillsong. That song got me through my darkest season and taught me to trust God even when I can't see the way forward. Still gives me chills every time! \u{1F30A}",
        threadId: 5,
        authorId: 1002,
        // Michael
        parentId: null,
        createdAt: new Date(Date.now() - 28 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: 15,
        content: "These are beautiful choices! I'm definitely adding some of these to our setlist. Music really is one of God's greatest gifts for worship and healing. Thank you for sharing your hearts! \u2764\uFE0F\u{1F3B6}",
        threadId: 5,
        authorId: 1007,
        // Rachel responding
        parentId: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1e3).toISOString()
      }
    ];
    this.communityComments = presetReplies;
    this.userLikes.get(1001)?.add(2);
    this.userLikes.get(1002)?.add(1);
    this.userLikes.get(1003)?.add(2);
    this.userLikes.get(1004)?.add(1);
    this.userLikes.get(1004)?.add(4);
    this.userLikes.get(1005)?.add(1);
    this.userLikes.get(1005)?.add(5);
    this.userLikes.get(1006)?.add(2);
    this.userLikes.get(1007)?.add(1);
    this.userLikes.get(1007)?.add(3);
    this.userLikes.get(1008)?.add(3);
    this.userFollows.get(1001)?.add(2);
    this.userFollows.get(1002)?.add(1);
    this.userFollows.get(1003)?.add(4);
    this.userFollows.get(1004)?.add(3);
    this.userFollows.get(1005)?.add(1);
    this.nextThreadId = 6;
    this.nextCommentId = 16;
  }
  // User management
  async createUser(userData) {
    const user = {
      id: this.nextUserId++,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName || `${userData.username}@${userData.city || "Unknown"}, ${userData.country || "Unknown"}`,
      city: userData.city || null,
      country: userData.country || null,
      bio: userData.bio || null,
      avatar: userData.avatar || null,
      password: userData.password || "",
      // Store the password properly
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("Creating user with ID:", user.id, "Display name:", user.displayName);
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
    this.usersByEmail.set(user.email, user);
    this.userLikes.set(user.id, /* @__PURE__ */ new Set());
    this.userFollows.set(user.id, /* @__PURE__ */ new Set());
    this.userPrayerMembers.set(user.id, false);
    console.log("User created successfully. Total users:", this.users.size);
    console.log("All user IDs:", Array.from(this.users.keys()));
    return user;
  }
  async getUserByUsername(username) {
    return this.usersByUsername.get(username) || null;
  }
  async getUserByEmail(email) {
    return this.usersByEmail.get(email) || null;
  }
  async getUserById(id) {
    return this.users.get(id) || null;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    this.usersByUsername.set(updatedUser.username, updatedUser);
    this.usersByEmail.set(updatedUser.email, updatedUser);
    return updatedUser;
  }
  // Episodes
  async getEpisodes() {
    return this.episodes;
  }
  async createEpisode(episodeData) {
    const episode = {
      id: this.episodes.length + 1,
      ...episodeData,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.episodes.push(episode);
    return episode;
  }
  // Videos
  async getVideos() {
    return this.videos;
  }
  async createVideo(videoData) {
    const video = {
      id: this.videos.length + 1,
      ...videoData,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.videos.push(video);
    return video;
  }
  // Community threads
  async getCommunityThreads(requestingUserId) {
    return this.communityThreads;
  }
  async getCommunityThreadsWithStats(requestingUserId) {
    return this.communityThreads.map((thread) => {
      let likeCount = 0;
      for (const userLikeSet of this.userLikes.values()) {
        if (userLikeSet.has(thread.id)) likeCount++;
      }
      let author = this.users.get(thread.authorId);
      if (!author) {
        console.log(`Thread ${thread.id}: Author not found for ID ${thread.authorId}. Creating placeholder user.`);
        author = {
          id: thread.authorId,
          username: `user${thread.authorId}`,
          email: `user${thread.authorId}@gkpradio.com`,
          displayName: `Member${thread.authorId}@Digital, Community`,
          city: "Digital",
          country: "Community",
          bio: null,
          avatar: null,
          password: "",
          // Empty password for placeholder users
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.users.set(author.id, author);
        this.usersByUsername.set(author.username, author);
        this.usersByEmail.set(author.email, author);
        this.userLikes.set(author.id, /* @__PURE__ */ new Set());
        this.userFollows.set(author.id, /* @__PURE__ */ new Set());
        this.userPrayerMembers.set(author.id, false);
        console.log(`Created placeholder user: ${author.displayName}`);
      }
      return {
        ...thread,
        author: author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatar: author.avatar,
          city: author.city,
          country: author.country
        } : null,
        likes: likeCount,
        replies: this.communityComments.filter((c) => c.threadId === thread.id).length,
        isLiked: requestingUserId ? this.userLikes.get(requestingUserId)?.has(thread.id) || false : false,
        isFollowing: requestingUserId ? this.userFollows.get(requestingUserId)?.has(thread.id) || false : false
      };
    });
  }
  async getCommunityThreadsByCategory(category, requestingUserId) {
    const threads = await this.getCommunityThreadsWithStats(requestingUserId);
    return category === "All" ? threads : threads.filter((thread) => thread.category === category);
  }
  async searchCommunityThreads(query, requestingUserId) {
    const threads = await this.getCommunityThreadsWithStats(requestingUserId);
    return threads.filter(
      (thread) => thread.title.toLowerCase().includes(query.toLowerCase()) || thread.content?.toLowerCase().includes(query.toLowerCase())
    );
  }
  async getFollowedThreadsByUser(userId) {
    const userFollowedThreads = this.userFollows.get(userId) || /* @__PURE__ */ new Set();
    const threads = await this.getCommunityThreadsWithStats(userId);
    return threads.filter((thread) => userFollowedThreads.has(thread.id));
  }
  async createCommunityThread(threadData) {
    const thread = {
      id: this.nextThreadId++,
      title: threadData.title,
      content: threadData.content,
      category: threadData.category,
      authorId: threadData.authorId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.communityThreads.push(thread);
    return thread;
  }
  async createCommunityComment(commentData) {
    const comment = {
      id: this.nextCommentId++,
      content: commentData.content,
      threadId: commentData.threadId,
      authorId: commentData.authorId,
      parentId: commentData.parentId || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.communityComments.push(comment);
    return comment;
  }
  async getThreadComments(threadId) {
    const comments = this.communityComments.filter((c) => c.threadId === threadId);
    const parentComments = comments.filter((c) => !c.parentId);
    const childComments = comments.filter((c) => c.parentId);
    return parentComments.map((comment) => {
      let author = this.users.get(comment.authorId);
      if (!author) {
        console.log(`User not found for ID ${comment.authorId}. Available users:`, Array.from(this.users.keys()));
        author = null;
      }
      const replies = childComments.filter((c) => c.parentId === comment.id).map((reply) => {
        const replyAuthor = this.users.get(reply.authorId);
        return {
          ...reply,
          author: replyAuthor ? {
            id: replyAuthor.id,
            username: replyAuthor.username,
            displayName: replyAuthor.displayName,
            avatar: replyAuthor.avatar,
            city: replyAuthor.city,
            country: replyAuthor.country
          } : null
        };
      });
      return {
        ...comment,
        author: author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatar: author.avatar,
          city: author.city,
          country: author.country
        } : null,
        replies,
        replyCount: replies.length
      };
    });
  }
  async getThreadById(threadId, requestingUserId) {
    const thread = this.communityThreads.find((t) => t.id === threadId);
    if (!thread) return null;
    let likeCount = 0;
    for (const userLikeSet of this.userLikes.values()) {
      if (userLikeSet.has(thread.id)) likeCount++;
    }
    const author = this.users.get(thread.authorId);
    return {
      ...thread,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
        city: author.city,
        country: author.country
      } : null,
      likes: likeCount,
      replies: this.communityComments.filter((c) => c.threadId === thread.id).length,
      isLiked: requestingUserId ? this.userLikes.get(requestingUserId)?.has(thread.id) || false : false,
      isFollowing: requestingUserId ? this.userFollows.get(requestingUserId)?.has(thread.id) || false : false
    };
  }
  // Thread interactions - USER SPECIFIC AND SECURE
  async likeThread(likeData) {
    if (!this.userLikes.has(likeData.userId)) {
      this.userLikes.set(likeData.userId, /* @__PURE__ */ new Set());
    }
    this.userLikes.get(likeData.userId).add(likeData.threadId);
    return {
      id: Date.now(),
      threadId: likeData.threadId,
      userId: likeData.userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async unlikeThread(threadId, userId) {
    this.userLikes.get(userId)?.delete(threadId);
  }
  async isThreadLikedByUser(threadId, userId) {
    return this.userLikes.get(userId)?.has(threadId) || false;
  }
  async getThreadLikeCount(threadId) {
    let count = 0;
    for (const userLikeSet of this.userLikes.values()) {
      if (userLikeSet.has(threadId)) count++;
    }
    return count;
  }
  async followThread(followData) {
    if (!this.userFollows.has(followData.userId)) {
      this.userFollows.set(followData.userId, /* @__PURE__ */ new Set());
    }
    this.userFollows.get(followData.userId).add(followData.threadId);
    return {
      id: Date.now(),
      threadId: followData.threadId,
      userId: followData.userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async unfollowThread(threadId, userId) {
    this.userFollows.get(userId)?.delete(threadId);
  }
  async isThreadFollowedByUser(threadId, userId) {
    return this.userFollows.get(userId)?.has(threadId) || false;
  }
  // Prayer circle - USER SPECIFIC AND SECURE
  async joinPrayerCircle(memberData) {
    this.userPrayerMembers.set(memberData.userId, true);
    return {
      id: Date.now(),
      userId: memberData.userId,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async isUserInPrayerCircle(userId) {
    return this.userPrayerMembers.get(userId) || false;
  }
  // Stats
  async getCommunityStats() {
    let prayerMemberCount = 0;
    for (const isPrayerMember of this.userPrayerMembers.values()) {
      if (isPrayerMember) prayerMemberCount++;
    }
    return {
      totalThreads: this.communityThreads.length,
      totalComments: this.communityComments.length,
      totalMembers: this.users.size,
      totalPrayerRequests: this.communityThreads.filter((thread) => thread.category === "Prayer Requests").length
    };
  }
  async getUserThreadInteractions(userId) {
    const interactions = {};
    const userLikes = this.userLikes.get(userId) || /* @__PURE__ */ new Set();
    const userFollows = this.userFollows.get(userId) || /* @__PURE__ */ new Set();
    for (const thread of this.communityThreads) {
      interactions[thread.id] = {
        liked: userLikes.has(thread.id),
        followed: userFollows.has(thread.id)
      };
    }
    return interactions;
  }
  initializeSampleData() {
    this.episodes = [
      {
        id: 1,
        title: "Living by Faith",
        description: "Exploring what it means to live by faith in daily life",
        duration: 1800,
        audioUrl: "/api/episodes/1/audio",
        publishedAt: "2024-12-01T10:00:00Z",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    this.videos = [
      {
        id: 1,
        title: "Sunday Service Highlights",
        description: "Best moments from Sunday worship",
        thumbnailUrl: "/api/videos/1/thumbnail",
        videoUrl: "/api/videos/1/stream",
        duration: 2400,
        category: "Worship",
        publishedAt: "2024-12-01T14:00:00Z",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    this.communityThreads = [
      {
        id: this.nextThreadId++,
        title: "Prayer Request: Healing for My Family",
        content: "Please pray for my family member who is going through health challenges. We believe in the power of prayer and community support.",
        category: "Prayer Requests",
        authorId: 999,
        // System user for sample data
        createdAt: new Date(Date.now() - 864e5).toISOString(),
        // 1 day ago
        updatedAt: new Date(Date.now() - 864e5).toISOString()
      },
      {
        id: this.nextThreadId++,
        title: "Testimony: God's Provision in Difficult Times",
        content: "I want to share how God provided for our family during a challenging financial period. His faithfulness never fails!",
        category: "Testimonies",
        authorId: 998,
        createdAt: new Date(Date.now() - 1728e5).toISOString(),
        // 2 days ago
        updatedAt: new Date(Date.now() - 1728e5).toISOString()
      }
    ];
  }
};
var sessionStorage = new SessionStorage();

// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
var LiveStreamManager = class {
  constructor(wss) {
    this.wss = wss;
    this.setupWebSocketServer();
  }
  clients = /* @__PURE__ */ new Map();
  activeBroadcasters = /* @__PURE__ */ new Set();
  listenerCount = 0;
  setupWebSocketServer() {
    this.wss.on("connection", (ws2, request) => {
      const clientId = this.generateClientId();
      console.log(`New WebSocket connection: ${clientId}`);
      this.clients.set(clientId, {
        ws: ws2,
        type: "listener"
      });
      this.updateListenerCount();
      ws2.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      });
      ws2.on("close", () => {
        console.log(`WebSocket connection closed: ${clientId}`);
        const client = this.clients.get(clientId);
        if (client?.type === "broadcaster") {
          this.activeBroadcasters.delete(clientId);
          this.broadcastToListeners({ type: "broadcastEnded", broadcasterId: clientId });
        }
        this.clients.delete(clientId);
        this.updateListenerCount();
      });
      ws2.on("error", (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
        this.updateListenerCount();
      });
      this.sendToClient(clientId, {
        type: "connected",
        clientId,
        listenerCount: this.listenerCount
      });
    });
  }
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    switch (message.type) {
      case "startBroadcast":
        this.handleStartBroadcast(clientId, message);
        break;
      case "stopBroadcast":
        this.handleStopBroadcast(clientId);
        break;
      case "audioData":
        this.handleAudioData(clientId, message);
        break;
      case "chatMessage":
        this.handleChatMessage(clientId, message);
        break;
      case "requestListenerCount":
        this.sendListenerCount(clientId);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }
  handleStartBroadcast(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    client.type = "broadcaster";
    client.userId = message.userId;
    this.activeBroadcasters.add(clientId);
    console.log(`Broadcast started by ${clientId}: ${message.title}`);
    this.broadcastToListeners({
      type: "broadcastStarted",
      broadcasterId: clientId,
      title: message.title,
      host: message.host,
      description: message.description
    });
    this.sendToClient(clientId, {
      type: "broadcastStarted",
      success: true,
      listenerCount: this.getListenerCount()
    });
  }
  handleStopBroadcast(clientId) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== "broadcaster") return;
    this.activeBroadcasters.delete(clientId);
    client.type = "listener";
    console.log(`Broadcast stopped by ${clientId}`);
    this.broadcastToListeners({
      type: "broadcastEnded",
      broadcasterId: clientId
    });
    this.sendToClient(clientId, {
      type: "broadcastStopped",
      success: true
    });
  }
  handleAudioData(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== "broadcaster") return;
    this.broadcastToListeners({
      type: "audioData",
      data: message.data,
      timestamp: Date.now()
    }, clientId);
  }
  handleChatMessage(clientId, message) {
    this.broadcastToAll({
      type: "chatMessage",
      clientId,
      username: message.username,
      message: message.message,
      timestamp: Date.now()
    }, clientId);
  }
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
  broadcastToListeners(message, excludeClientId) {
    this.clients.forEach((client, clientId) => {
      if (client.type === "listener" && clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
  broadcastToAll(message, excludeClientId) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
  updateListenerCount() {
    this.listenerCount = this.getListenerCount();
    this.clients.forEach((client, clientId) => {
      if (client.type === "broadcaster" && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, {
          type: "listenerCount",
          count: this.listenerCount
        });
      }
    });
  }
  sendListenerCount(clientId) {
    this.sendToClient(clientId, {
      type: "listenerCount",
      count: this.listenerCount
    });
  }
  getListenerCount() {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.type === "listener") {
        count++;
      }
    });
    return count;
  }
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Public methods for external use
  getBroadcastStatus() {
    return {
      activeBroadcasters: this.activeBroadcasters.size,
      totalListeners: this.listenerCount,
      totalConnections: this.clients.size
    };
  }
};
function setupWebSocket(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    perMessageDeflate: false
  });
  console.log("WebSocket server setup on /ws");
  return new LiveStreamManager(wss);
}

// server/azuracast.ts
import fetch from "node-fetch";
var AzuraCastAPI = class {
  baseUrl;
  apiKey;
  stationId;
  constructor() {
    this.baseUrl = process.env.AZURACAST_API_URL || "";
    this.apiKey = process.env.AZURACAST_API_KEY || "";
    this.stationId = process.env.AZURACAST_STATION_ID || "";
    if (!this.baseUrl || !this.apiKey || !this.stationId) {
      console.warn("AzuraCast credentials not configured");
    }
  }
  async makeRequest(endpoint, options = {}) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("AzuraCast credentials not configured");
    }
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
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
      console.error("AzuraCast API request failed:", error);
      throw error;
    }
  }
  async getStationStatus() {
    return await this.makeRequest(`/nowplaying/${this.stationId}`);
  }
  async getStationInfo() {
    return await this.makeRequest(`/station/${this.stationId}`);
  }
  async getListenerCount() {
    try {
      const nowPlaying = await this.getStationStatus();
      return nowPlaying.listeners?.total || 0;
    } catch (error) {
      console.error("Failed to get listener count:", error);
      return 0;
    }
  }
  async getCurrentTrack() {
    try {
      const nowPlaying = await this.getStationStatus();
      return {
        title: nowPlaying.now_playing?.song?.title || "Unknown",
        artist: nowPlaying.now_playing?.song?.artist || "Unknown Artist",
        album: nowPlaying.now_playing?.song?.album || "",
        artwork: nowPlaying.now_playing?.song?.art || "",
        duration: nowPlaying.now_playing?.duration || 0,
        elapsed: nowPlaying.now_playing?.elapsed || 0,
        isLive: nowPlaying.live?.is_live || false,
        streamerName: nowPlaying.live?.streamer_name || ""
      };
    } catch (error) {
      console.error("Failed to get current track:", error);
      return {
        title: "Offline",
        artist: "GKP Radio",
        album: "",
        artwork: "",
        duration: 0,
        elapsed: 0,
        isLive: false,
        streamerName: ""
      };
    }
  }
  async getStreamUrl() {
    try {
      const station = await this.getStationInfo();
      return station.listen_url || "";
    } catch (error) {
      console.error("Failed to get stream URL:", error);
      return "";
    }
  }
  async isStationLive() {
    try {
      const nowPlaying = await this.getStationStatus();
      return nowPlaying.live?.is_live || false;
    } catch (error) {
      console.error("Failed to check if station is live:", error);
      return false;
    }
  }
  async getStreamHistory(limit = 10) {
    try {
      return await this.makeRequest(`/station/${this.stationId}/history?limit=${limit}`);
    } catch (error) {
      console.error("Failed to get stream history:", error);
      return [];
    }
  }
  async searchMusic(query) {
    try {
      return await this.makeRequest(`/station/${this.stationId}/files?searchPhrase=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error("Failed to search music:", error);
      return [];
    }
  }
  // Control methods (require appropriate permissions)
  async startStation() {
    try {
      return await this.makeRequest(`/station/${this.stationId}/restart`, {
        method: "POST"
      });
    } catch (error) {
      console.error("Failed to start station:", error);
      throw error;
    }
  }
  async stopStation() {
    try {
      return await this.makeRequest(`/station/${this.stationId}/stop`, {
        method: "POST"
      });
    } catch (error) {
      console.error("Failed to stop station:", error);
      throw error;
    }
  }
  isConfigured() {
    return !!(this.baseUrl && this.apiKey && this.stationId);
  }
};
var azuraCastAPI = new AzuraCastAPI();

// server/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
var signupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
var TOKEN_EXPIRY = "7d";
function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}
var authRoutes = {
  // Sign up
  async signup(req, res) {
    try {
      console.log("Signup request body:", req.body);
      const validatedData = signupSchema.parse(req.body);
      const existingUser = await sessionStorage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      const existingEmail = await sessionStorage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const { confirmPassword, ...userData } = validatedData;
      const displayName = `${userData.username}@${userData.city}, ${userData.country}`;
      const newUser = await sessionStorage.createUser({
        ...userData,
        password: hashedPassword,
        displayName
      });
      const token = generateToken(newUser.id, newUser.username);
      const { password, ...userWithoutPassword } = newUser;
      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  },
  // Login
  async login(req, res) {
    try {
      console.log("Login request body:", req.body);
      const validatedData = loginSchema.parse(req.body);
      const user = await sessionStorage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const validPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const token = generateToken(user.id, user.username);
      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  },
  // Get current user
  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await sessionStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  },
  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { bio, city, country, avatar } = req.body;
      const username = req.user?.username;
      if (!username) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const updatedUser = await sessionStorage.updateUser(userId, {
        bio,
        city,
        country,
        avatar,
        displayName: `${username}@${city || "Unknown"}, ${country || "Unknown"}`
      });
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
};

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  communityComments: () => communityComments,
  communityCommentsRelations: () => communityCommentsRelations,
  communityThreads: () => communityThreads,
  communityThreadsRelations: () => communityThreadsRelations,
  episodeComments: () => episodeComments,
  episodeCommentsRelations: () => episodeCommentsRelations,
  episodes: () => episodes,
  episodesRelations: () => episodesRelations,
  insertCommunityCommentSchema: () => insertCommunityCommentSchema,
  insertCommunityThreadSchema: () => insertCommunityThreadSchema,
  insertEpisodeCommentSchema: () => insertEpisodeCommentSchema,
  insertEpisodeSchema: () => insertEpisodeSchema,
  insertPrayerCircleMemberSchema: () => insertPrayerCircleMemberSchema,
  insertThreadFollowSchema: () => insertThreadFollowSchema,
  insertThreadLikeSchema: () => insertThreadLikeSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoCommentSchema: () => insertVideoCommentSchema,
  insertVideoLikeSchema: () => insertVideoLikeSchema,
  insertVideoPlaylistItemSchema: () => insertVideoPlaylistItemSchema,
  insertVideoPlaylistSchema: () => insertVideoPlaylistSchema,
  insertVideoSchema: () => insertVideoSchema,
  prayerCircleMembers: () => prayerCircleMembers,
  prayerCircleMembersRelations: () => prayerCircleMembersRelations,
  threadFollows: () => threadFollows,
  threadFollowsRelations: () => threadFollowsRelations,
  threadLikes: () => threadLikes,
  threadLikesRelations: () => threadLikesRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  videoComments: () => videoComments,
  videoCommentsRelations: () => videoCommentsRelations,
  videoLikes: () => videoLikes,
  videoLikesRelations: () => videoLikesRelations,
  videoPlaylistItems: () => videoPlaylistItems,
  videoPlaylistItemsRelations: () => videoPlaylistItemsRelations,
  videoPlaylists: () => videoPlaylists,
  videoPlaylistsRelations: () => videoPlaylistsRelations,
  videos: () => videos,
  videosRelations: () => videosRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"),
  // in seconds
  hostName: text("host_name"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").array(),
  isLive: boolean("is_live").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull(),
  // Worship, Youth, Healing, Teachings
  duration: integer("duration"),
  // in seconds
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  hostName: text("host_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var videoLikes = pgTable("video_likes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  uniqueUserVideo: unique().on(table.videoId, table.userId)
}));
var videoComments = pgTable("video_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"),
  // for nested replies
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var videoPlaylists = pgTable("video_playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var videoPlaylistItems = pgTable("video_playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => videoPlaylists.id).notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var communityThreads = pgTable("community_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category").notNull(),
  // Prayer Requests, Praise Reports, Testimonies, etc.
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"),
  // for nested replies - self reference
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var episodeComments = pgTable("episode_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  episodeId: integer("episode_id").references(() => episodes.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var threadLikes = pgTable("thread_likes", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var threadFollows = pgTable("thread_follows", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var prayerCircleMembers = pgTable("prayer_circle_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true)
});
var usersRelations = relations(users, ({ many }) => ({
  communityThreads: many(communityThreads),
  communityComments: many(communityComments),
  episodeComments: many(episodeComments),
  threadLikes: many(threadLikes),
  threadFollows: many(threadFollows),
  prayerCircleMembership: many(prayerCircleMembers),
  videoLikes: many(videoLikes),
  videoComments: many(videoComments),
  videoPlaylists: many(videoPlaylists)
}));
var videosRelations = relations(videos, ({ many }) => ({
  likes: many(videoLikes),
  comments: many(videoComments),
  playlistItems: many(videoPlaylistItems)
}));
var videoLikesRelations = relations(videoLikes, ({ one }) => ({
  video: one(videos, {
    fields: [videoLikes.videoId],
    references: [videos.id]
  }),
  user: one(users, {
    fields: [videoLikes.userId],
    references: [users.id]
  })
}));
var videoCommentsRelations = relations(videoComments, ({ one, many }) => ({
  video: one(videos, {
    fields: [videoComments.videoId],
    references: [videos.id]
  }),
  author: one(users, {
    fields: [videoComments.authorId],
    references: [users.id]
  }),
  parent: one(videoComments, {
    fields: [videoComments.parentId],
    references: [videoComments.id],
    relationName: "VideoCommentParent"
  }),
  replies: many(videoComments, {
    relationName: "VideoCommentParent"
  })
}));
var videoPlaylistsRelations = relations(videoPlaylists, ({ one, many }) => ({
  creator: one(users, {
    fields: [videoPlaylists.creatorId],
    references: [users.id]
  }),
  items: many(videoPlaylistItems)
}));
var videoPlaylistItemsRelations = relations(videoPlaylistItems, ({ one }) => ({
  playlist: one(videoPlaylists, {
    fields: [videoPlaylistItems.playlistId],
    references: [videoPlaylists.id]
  }),
  video: one(videos, {
    fields: [videoPlaylistItems.videoId],
    references: [videos.id]
  })
}));
var threadLikesRelations = relations(threadLikes, ({ one }) => ({
  thread: one(communityThreads, {
    fields: [threadLikes.threadId],
    references: [communityThreads.id]
  }),
  user: one(users, {
    fields: [threadLikes.userId],
    references: [users.id]
  })
}));
var threadFollowsRelations = relations(threadFollows, ({ one }) => ({
  thread: one(communityThreads, {
    fields: [threadFollows.threadId],
    references: [communityThreads.id]
  }),
  user: one(users, {
    fields: [threadFollows.userId],
    references: [users.id]
  })
}));
var prayerCircleMembersRelations = relations(prayerCircleMembers, ({ one }) => ({
  user: one(users, {
    fields: [prayerCircleMembers.userId],
    references: [users.id]
  })
}));
var communityThreadsRelations = relations(communityThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [communityThreads.authorId],
    references: [users.id]
  }),
  comments: many(communityComments),
  likes: many(threadLikes),
  follows: many(threadFollows)
}));
var communityCommentsRelations = relations(communityComments, ({ one, many }) => ({
  author: one(users, {
    fields: [communityComments.authorId],
    references: [users.id]
  }),
  thread: one(communityThreads, {
    fields: [communityComments.threadId],
    references: [communityThreads.id]
  }),
  parent: one(communityComments, {
    fields: [communityComments.parentId],
    references: [communityComments.id],
    relationName: "CommentParent"
  }),
  replies: many(communityComments, {
    relationName: "CommentParent"
  })
}));
var episodesRelations = relations(episodes, ({ many }) => ({
  comments: many(episodeComments)
}));
var episodeCommentsRelations = relations(episodeComments, ({ one }) => ({
  author: one(users, {
    fields: [episodeComments.authorId],
    references: [users.id]
  }),
  episode: one(episodes, {
    fields: [episodeComments.episodeId],
    references: [episodes.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  city: true,
  country: true,
  bio: true,
  avatar: true
});
var insertEpisodeSchema = createInsertSchema(episodes).pick({
  title: true,
  description: true,
  audioUrl: true,
  duration: true,
  hostName: true,
  thumbnailUrl: true,
  tags: true,
  isLive: true
});
var insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  videoUrl: true,
  thumbnailUrl: true,
  category: true,
  duration: true,
  tags: true,
  hostName: true,
  isNew: true,
  isFeatured: true
});
var insertVideoLikeSchema = createInsertSchema(videoLikes).pick({
  videoId: true,
  userId: true
});
var insertVideoCommentSchema = createInsertSchema(videoComments).pick({
  content: true,
  videoId: true,
  authorId: true,
  parentId: true
});
var insertVideoPlaylistSchema = createInsertSchema(videoPlaylists).pick({
  name: true,
  description: true,
  creatorId: true,
  isPublic: true
});
var insertVideoPlaylistItemSchema = createInsertSchema(videoPlaylistItems).pick({
  playlistId: true,
  videoId: true,
  position: true
});
var insertCommunityThreadSchema = createInsertSchema(communityThreads).pick({
  title: true,
  content: true,
  category: true,
  authorId: true
});
var insertCommunityCommentSchema = createInsertSchema(communityComments).pick({
  content: true,
  threadId: true,
  authorId: true,
  parentId: true
});
var insertEpisodeCommentSchema = createInsertSchema(episodeComments).pick({
  content: true,
  episodeId: true,
  authorId: true
});
var insertThreadLikeSchema = createInsertSchema(threadLikes).pick({
  threadId: true,
  userId: true
});
var insertThreadFollowSchema = createInsertSchema(threadFollows).pick({
  threadId: true,
  userId: true
});
var insertPrayerCircleMemberSchema = createInsertSchema(prayerCircleMembers).pick({
  userId: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/seed-videos.ts
var sampleVideos = [
  {
    title: "Sunday Service: The Power of Forgiveness",
    description: "Pastor Michael delivers a powerful message about the transformative power of forgiveness in our lives.",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl: null,
    category: "Worship",
    duration: 5130,
    // 1:25:30 in seconds
    views: 2450,
    likes: 189,
    isNew: true,
    isFeatured: false,
    tags: ["forgiveness", "sunday service", "pastor michael"],
    hostName: "Pastor Michael"
  },
  {
    title: "Youth Revival: Finding Purpose in God's Plan",
    description: "An inspiring youth service focused on discovering God's unique purpose for each young believer.",
    videoUrl: "https://example.com/video2.mp4",
    thumbnailUrl: null,
    category: "Youth",
    duration: 2720,
    // 45:20 in seconds
    views: 1820,
    likes: 156,
    isNew: false,
    isFeatured: true,
    tags: ["youth", "purpose", "god's plan"],
    hostName: "Youth Pastor Sarah"
  },
  {
    title: "Healing Prayer Session with Minister Grace",
    description: "Join Minister Grace for a powerful healing prayer session that has touched thousands of lives.",
    videoUrl: "https://example.com/video3.mp4",
    thumbnailUrl: null,
    category: "Healing",
    duration: 1935,
    // 32:15 in seconds
    views: 3200,
    likes: 298,
    isNew: false,
    isFeatured: false,
    tags: ["healing", "prayer", "minister grace"],
    hostName: "Minister Grace"
  },
  {
    title: "Bible Study: Understanding the Beatitudes",
    description: "Deep dive into the Beatitudes with Pastor David, exploring their relevance in modern Christian life.",
    videoUrl: "https://example.com/video4.mp4",
    thumbnailUrl: null,
    category: "Teachings",
    duration: 3945,
    // 1:05:45 in seconds
    views: 1650,
    likes: 134,
    isNew: false,
    isFeatured: false,
    tags: ["bible study", "beatitudes", "pastor david"],
    hostName: "Pastor David"
  },
  {
    title: "Worship Night: Songs of Praise and Adoration",
    description: "Experience an evening of beautiful worship music and heartfelt praise that will lift your spirit.",
    videoUrl: "https://example.com/video5.mp4",
    thumbnailUrl: null,
    category: "Worship",
    duration: 6930,
    // 1:55:30 in seconds
    views: 4100,
    likes: 387,
    isNew: false,
    isFeatured: true,
    tags: ["worship", "music", "praise"],
    hostName: "Worship Team"
  },
  {
    title: "Testimony: God's Provision in Difficult Times",
    description: "Sister Maria shares her powerful testimony of God's faithfulness during challenging circumstances.",
    videoUrl: "https://example.com/video6.mp4",
    thumbnailUrl: null,
    category: "Healing",
    duration: 1800,
    // 30:00 in seconds
    views: 2800,
    likes: 245,
    isNew: true,
    isFeatured: false,
    tags: ["testimony", "provision", "faith"],
    hostName: "Sister Maria"
  }
];
async function seedVideos() {
  try {
    console.log("\u{1F331} Seeding video data...");
    const existingVideos = await db.select().from(videos).limit(1);
    if (existingVideos.length > 0) {
      console.log("\u{1F4F9} Videos already exist, skipping seed");
      return;
    }
    await db.insert(videos).values(sampleVideos);
    console.log(`\u2705 Successfully seeded ${sampleVideos.length} videos`);
  } catch (error) {
    console.error("\u274C Failed to seed videos:", error);
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  await seedVideos();
  app2.get("/api/azuracast/status", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      const [stationStatus, currentTrack, isLive] = await Promise.all([
        azuraCastAPI.getStationStatus(),
        azuraCastAPI.getCurrentTrack(),
        azuraCastAPI.isStationLive()
      ]);
      res.json({
        isLive,
        listeners: stationStatus.listeners?.total || 0,
        currentTrack,
        station: stationStatus.station
      });
    } catch (error) {
      console.error("AzuraCast status error:", error);
      res.status(500).json({ error: "Failed to get station status" });
    }
  });
  app2.get("/api/azuracast/stream-url", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      const streamUrl = await azuraCastAPI.getStreamUrl();
      res.json({ streamUrl });
    } catch (error) {
      console.error("Failed to get stream URL:", error);
      res.status(500).json({ error: "Failed to get stream URL" });
    }
  });
  app2.get("/api/azuracast/current-track", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      const currentTrack = await azuraCastAPI.getCurrentTrack();
      res.json(currentTrack);
    } catch (error) {
      console.error("Failed to get current track:", error);
      res.status(500).json({ error: "Failed to get current track" });
    }
  });
  app2.get("/api/azuracast/history", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      const limit = parseInt(req.query.limit) || 10;
      const history = await azuraCastAPI.getStreamHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to get stream history:", error);
      res.status(500).json({ error: "Failed to get stream history" });
    }
  });
  app2.post("/api/azuracast/start", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      await azuraCastAPI.startStation();
      res.json({ success: true, message: "Station started" });
    } catch (error) {
      console.error("Failed to start station:", error);
      res.status(500).json({ error: "Failed to start station" });
    }
  });
  app2.post("/api/azuracast/stop", async (req, res) => {
    try {
      if (!azuraCastAPI.isConfigured()) {
        return res.status(503).json({ error: "AzuraCast not configured" });
      }
      await azuraCastAPI.stopStation();
      res.json({ success: true, message: "Station stopped" });
    } catch (error) {
      console.error("Failed to stop station:", error);
      res.status(500).json({ error: "Failed to stop station" });
    }
  });
  app2.get("/api/broadcast/status", (req, res) => {
    if (liveStreamManager) {
      res.json(liveStreamManager.getBroadcastStatus());
    } else {
      res.json({ activeBroadcasters: 0, totalListeners: 0, totalConnections: 0 });
    }
  });
  app2.get("/api/episodes", async (req, res) => {
    try {
      const episodes2 = await sessionStorage.getEpisodes();
      res.json(episodes2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });
  app2.get("/api/videos", async (req, res) => {
    try {
      const { category, search, sortBy, limit, offset, userId } = req.query;
      const allVideos = await sessionStorage.getVideos();
      let videos2 = allVideos;
      if (category && category !== "All") {
        videos2 = videos2.filter((v) => v.category === category);
      }
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        videos2 = videos2.filter(
          (v) => v.title.toLowerCase().includes(searchLower) || v.description && v.description.toLowerCase().includes(searchLower)
        );
      }
      if (sortBy === "popular") {
        videos2.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sortBy === "views") {
        videos2.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (sortBy === "trending") {
        videos2.sort((a, b) => (b.views || 0) + (b.likes || 0) * 2 - ((a.views || 0) + (a.likes || 0) * 2));
      } else {
        videos2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (offset && typeof offset === "string") {
        videos2 = videos2.slice(parseInt(offset));
      }
      if (limit && typeof limit === "string") {
        videos2 = videos2.slice(0, parseInt(limit));
      }
      const transformedVideos = videos2.map((video) => ({
        ...video,
        uploadDate: getTimeAgo(video.createdAt),
        isNew: video.isNew || false,
        thumbnail: video.thumbnailUrl || `${video.category.toLowerCase()}-${video.id}`
      }));
      res.json(transformedVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });
  app2.get("/api/videos/categories", async (req, res) => {
    try {
      const videos2 = await sessionStorage.getVideos();
      const categoryMap = /* @__PURE__ */ new Map();
      videos2.forEach((video) => {
        const count = categoryMap.get(video.category) || 0;
        categoryMap.set(video.category, count + 1);
      });
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch video categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const videos2 = await sessionStorage.getVideos();
      const video = videos2.find((v) => v.id === videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      const response = {
        ...video,
        uploadDate: getTimeAgo(video.createdAt),
        isNew: video.isNew || false,
        thumbnail: video.thumbnailUrl || `${video.category.toLowerCase()}-${video.id}`
      };
      res.json(response);
    } catch (error) {
      console.error("Failed to fetch video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });
  app2.get("/api/owncast/status", async (req, res) => {
    try {
      const { getOwncastStatus: getOwncastStatus2 } = await Promise.resolve().then(() => (init_owncast_proxy(), owncast_proxy_exports));
      const status = await getOwncastStatus2();
      res.json(status);
    } catch (error) {
      console.error("Owncast proxy error:", error);
      res.json({
        online: false,
        // Return actual offline status
        viewerCount: 0,
        streamTitle: "GKP Radio Live",
        error: "Connection failed"
      });
    }
  });
  app2.get("/api/owncast/stream.m3u8", async (req, res) => {
    try {
      const fetch5 = (await import("node-fetch")).default;
      const response = await fetch5("https://74.208.102.89:8080/hls/stream.m3u8");
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (response.ok) {
        let content = await response.text();
        content = content.replace(/stream(\d+\.ts)/g, "/api/owncast/stream$1");
        content = content.replace(/(\d+)\/stream\.m3u8/g, "/api/owncast/$1/stream.m3u8");
        res.send(content);
      } else {
        res.status(response.status).send("Stream not available");
      }
    } catch (error) {
      console.error("HLS proxy error:", error);
      res.status(503).send("Stream proxy error");
    }
  });
  app2.get("/api/owncast/stream:segment.ts", async (req, res) => {
    try {
      const fetch5 = (await import("node-fetch")).default;
      const segment = req.params.segment;
      const response = await fetch5(`https://74.208.102.89:8080/hls/stream${segment}.ts`);
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader("Cache-Control", "max-age=10");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (response.ok) {
        const buffer = await response.buffer();
        res.send(buffer);
      } else {
        res.status(response.status).send("Segment not available");
      }
    } catch (error) {
      console.error("Segment proxy error:", error);
      res.status(503).send("Segment proxy error");
    }
  });
  app2.get("/api/owncast/:variant/stream.m3u8", async (req, res) => {
    try {
      const fetch5 = (await import("node-fetch")).default;
      const variant = req.params.variant;
      const response = await fetch5(`https://74.208.102.89:8080/hls/${variant}/stream.m3u8`);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (response.ok) {
        let content = await response.text();
        content = content.replace(/stream(\d+\.ts)/g, `/api/owncast/${variant}/stream$1`);
        res.send(content);
      } else {
        res.status(response.status).send("Variant stream not available");
      }
    } catch (error) {
      console.error("Variant HLS proxy error:", error);
      res.status(503).send("Variant stream proxy error");
    }
  });
  app2.get("/api/owncast/:variant/stream:segment.ts", async (req, res) => {
    try {
      const fetch5 = (await import("node-fetch")).default;
      const { variant, segment } = req.params;
      const response = await fetch5(`https://74.208.102.89:8080/hls/${variant}/stream${segment}.ts`);
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader("Cache-Control", "max-age=10");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (response.ok) {
        const buffer = await response.buffer();
        res.send(buffer);
      } else {
        res.status(response.status).send("Segment not available");
      }
    } catch (error) {
      console.error("Variant segment proxy error:", error);
      res.status(503).send("Variant segment proxy error");
    }
  });
  app2.post("/api/auth/signup", authRoutes.signup);
  app2.post("/api/auth/login", authRoutes.login);
  app2.get("/api/auth/me", authenticateToken, authRoutes.getCurrentUser);
  app2.patch("/api/auth/profile", authenticateToken, authRoutes.updateProfile);
  app2.get("/api/community/threads", async (req, res) => {
    try {
      const { category, search, tab, userId } = req.query;
      const requestingUserId = userId ? parseInt(userId) : void 0;
      let threads;
      if (tab === "following" && userId) {
        threads = await sessionStorage.getFollowedThreadsByUser(parseInt(userId));
      } else if (search) {
        threads = await sessionStorage.searchCommunityThreads(search, requestingUserId);
      } else if (category && category !== "All") {
        threads = await sessionStorage.getCommunityThreadsByCategory(category, requestingUserId);
      } else {
        threads = await sessionStorage.getCommunityThreadsWithStats(requestingUserId);
      }
      const transformedThreads = threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        excerpt: thread.content ? thread.content.substring(0, 150) + "..." : "",
        category: thread.category,
        author: thread.author ? thread.author.displayName : "Loading user data...",
        authorInfo: thread.author,
        lastActivity: getTimeAgo(thread.updatedAt),
        replies: thread.replies || 0,
        likes: thread.likes || 0,
        isLiked: thread.isLiked || false,
        isFollowing: thread.isFollowing || false,
        isPinned: false,
        // Can be enhanced later
        isHot: (thread.likeCount || 0) > 10 || (thread.commentCount || 0) > 5,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      }));
      if (tab === "popular") {
        transformedThreads.sort((a, b) => b.likes + b.replies - (a.likes + a.replies));
      } else if (tab === "unanswered") {
        const unanswered = transformedThreads.filter((thread) => thread.replies === 0);
        res.json(unanswered);
        return;
      }
      res.json(transformedThreads);
    } catch (error) {
      console.error("Failed to get community threads:", error);
      res.status(500).json({ error: "Failed to load discussions" });
    }
  });
  app2.post("/api/community/threads", authenticateToken, async (req, res) => {
    try {
      const { title, content, category } = req.body;
      const userId = req.user.userId;
      if (!title || !category) {
        return res.status(400).json({ error: "Title and category are required" });
      }
      const thread = await sessionStorage.createCommunityThread({
        title,
        content,
        category,
        authorId: userId
      });
      res.json(thread);
    } catch (error) {
      console.error("Failed to create thread:", error);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  });
  app2.post("/api/community/threads/:threadId/like", authenticateToken, async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const userId = req.user.userId;
      const isLiked = await sessionStorage.isThreadLikedByUser(threadId, userId);
      if (isLiked) {
        await sessionStorage.unlikeThread(threadId, userId);
      } else {
        await sessionStorage.likeThread({ threadId, userId });
      }
      const likeCount = await sessionStorage.getThreadLikeCount(threadId);
      res.json({
        liked: !isLiked,
        likeCount
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      res.status(500).json({ error: "Failed to update like" });
    }
  });
  app2.post("/api/community/threads/:threadId/follow", authenticateToken, async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const userId = req.user.userId;
      const isFollowed = await sessionStorage.isThreadFollowedByUser(threadId, userId);
      if (isFollowed) {
        await sessionStorage.unfollowThread(threadId, userId);
      } else {
        await sessionStorage.followThread({ threadId, userId });
      }
      res.json({
        following: !isFollowed
      });
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      res.status(500).json({ error: "Failed to update follow status" });
    }
  });
  app2.post("/api/community/prayer-circle/join", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const isAlreadyMember = await sessionStorage.isUserInPrayerCircle(userId);
      if (isAlreadyMember) {
        return res.status(400).json({ error: "Already a member of prayer circle" });
      }
      await sessionStorage.joinPrayerCircle({ userId });
      res.json({ success: true, message: "Joined prayer circle successfully" });
    } catch (error) {
      console.error("Failed to join prayer circle:", error);
      res.status(500).json({ error: "Failed to join prayer circle" });
    }
  });
  app2.post("/api/community/threads/:threadId/comments/test", async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const { content, authorId } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      if (!authorId) {
        return res.status(400).json({ error: "AuthorId is required for test" });
      }
      const comment = await sessionStorage.createCommunityComment({
        content: content.trim(),
        threadId,
        authorId,
        parentId: null
      });
      res.json(comment);
    } catch (error) {
      console.error("Failed to create test comment:", error);
      res.status(500).json({ error: "Failed to create test comment" });
    }
  });
  app2.get("/api/community/stats", async (req, res) => {
    try {
      const stats = await sessionStorage.getCommunityStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get community stats:", error);
      res.status(500).json({ error: "Failed to load community stats" });
    }
  });
  app2.get("/api/community/user-interactions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { threadIds } = req.query;
      if (!threadIds) {
        return res.json({});
      }
      const ids = threadIds.split(",").map((id) => parseInt(id));
      const interactions = {};
      for (const threadId of ids) {
        const liked = await sessionStorage.isThreadLikedByUser(threadId, userId);
        const followed = await sessionStorage.isThreadFollowedByUser(threadId, userId);
        interactions[threadId] = { liked, followed };
      }
      res.json(interactions);
    } catch (error) {
      console.error("Failed to get user interactions:", error);
      res.status(500).json({ error: "Failed to load user interactions" });
    }
  });
  app2.post("/api/community/threads/:threadId/comments", authenticateToken, async (req, res) => {
    try {
      const comment = await sessionStorage.createCommunityComment({
        content: req.body.content,
        threadId: parseInt(req.params.threadId),
        authorId: req.user.userId,
        parentId: req.body.parentId || null
      });
      res.json(comment);
    } catch (error) {
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
  app2.get("/api/community/threads/:threadId/comments", async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const comments = await sessionStorage.getThreadComments(threadId);
      res.json(comments);
    } catch (error) {
      console.error("Failed to get comments:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });
  app2.get("/api/community/threads/:threadId", async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const userId = req.user?.userId;
      const thread = await sessionStorage.getThreadById(threadId, userId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      res.json(thread);
    } catch (error) {
      console.error("Failed to get thread:", error);
      res.status(500).json({ error: "Failed to get thread" });
    }
  });
  const { proxyWebRTCRequest: proxyWebRTCRequest2, getWebRTCStatus: getWebRTCStatus2 } = await Promise.resolve().then(() => (init_webrtc_proxy(), webrtc_proxy_exports));
  app2.post("/api/webrtc/:path(*)/whep", proxyWebRTCRequest2);
  app2.options("/api/webrtc/:path(*)/whep", proxyWebRTCRequest2);
  app2.get("/api/webrtc/status", getWebRTCStatus2);
  app2.get("/vps-webrtc-setup.sh", (req, res) => {
    res.sendFile("vps-webrtc-setup.sh", { root: "." });
  });
  const httpServer = createServer(app2);
  const liveStreamManager = setupWebSocket(httpServer);
  return httpServer;
}
function getTimeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1e3);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  const WebSocketStreamingManager = (await Promise.resolve().then(() => (init_websocket_streaming(), websocket_streaming_exports))).default;
  const webSocketStreamingManager = new WebSocketStreamingManager(server);
  const { registerStreamingRoutes: registerStreamingRoutes2 } = await Promise.resolve().then(() => (init_streaming_routes(), streaming_routes_exports));
  registerStreamingRoutes2(app, webSocketStreamingManager);
  const { startRTMPServer: startRTMPServer2 } = await Promise.resolve().then(() => (init_rtmp_server(), rtmp_server_exports));
  startRTMPServer2();
  const { setupHLSStreaming: setupHLSStreaming2 } = await Promise.resolve().then(() => (init_hls_streaming(), hls_streaming_exports));
  setupHLSStreaming2(app);
  const { getServerMetrics: getServerMetrics2 } = await Promise.resolve().then(() => (init_stream_optimizer(), stream_optimizer_exports));
  app.get("/api/server/metrics", (req, res) => {
    res.json(getServerMetrics2());
  });
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
