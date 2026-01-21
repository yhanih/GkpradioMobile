// GKP Radio Live Broadcasting Configuration
// Update this file with your AzuraCast server details

export const radioConfig = {
  // AzuraCast Stream Configuration (proxied through our server to handle CORS)
  streamUrl: "/api/stream/proxy",
  
  // AzuraCast API Configuration (for metadata and stats)
  azuraCast: {
    baseUrl: import.meta.env.VITE_AZURACAST_BASE_URL || "",
    stationId: parseInt(import.meta.env.VITE_AZURACAST_STATION_ID || "1"),
    apiKey: "",
  },
  
  // Station Information
  stationName: "GKP Radio",
  tagline: "Faith-Based Community Radio",
  
  // Live Broadcasting Programs
  programs: {
    autodj: {
      title: "GKP Radio Music",
      host: "AutoDJ",
      description: "Faith-based music and worship songs"
    },
    live: {
      title: "GKP Radio Live",
      host: "Live DJ",
      description: "Live broadcasting with music and talk"
    },
    talkShow: {
      title: "Faith Talk Live",
      host: "Pastor Team",
      description: "Live radio show with spiritual discussions"
    }
  },
  
  // Stream Settings
  defaultVolume: 75,
  autoReconnect: true,
  reconnectDelay: 5000, // 5 seconds
  metadataRefreshInterval: 30000, // 30 seconds - reduced polling frequency
  
  // Low Latency Settings
  lowLatency: {
    enabled: true,
    bufferTime: 0.1, // 100ms buffer for live streaming
    maxBufferTime: 0.5, // 500ms max buffer
  }
};

// Instructions for updating after AzuraCast setup:
// 1. Replace 'your-azuracast-domain' with your actual AzuraCast server domain
// 2. Update stationId if you have multiple stations
// 3. The website will automatically connect to your live stream
// 4. Metadata will show current song/program information