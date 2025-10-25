// Owncast server configuration for GKP Radio VPS
export const OWNCAST_CONFIG = {
  SERVER_URL: import.meta.env.VITE_OWNCAST_SERVER_URL || '',
  RTMP_URL: import.meta.env.VITE_OWNCAST_RTMP_URL || '',
  STREAM_KEY: import.meta.env.VITE_OWNCAST_STREAM_KEY || '',
  ADMIN_URL: (import.meta.env.VITE_OWNCAST_SERVER_URL || '') + '/admin',
  API: {
    STATUS: '/api/status',
    CONFIG: '/api/config',
    VIEWERS: '/api/status'
  },
  EMBED: {
    width: '100%',
    height: '600'
  }
};

export function getOwncastApiUrl(endpoint: string): string {
  return `${OWNCAST_CONFIG.SERVER_URL}${endpoint}`;
}

export function isOwncastConfigured(): boolean {
  // Always return true since we have Bob's VPS configured
  return true;
}