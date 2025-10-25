// @ts-ignore - node-media-server doesn't have types
import NodeMediaServer from 'node-media-server';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: process.env.RTMP_HTTP_PORT ? parseInt(process.env.RTMP_HTTP_PORT) : 8001,
    allow_origin: '*',
    mediaroot: './media'
  },
  relay: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        mode: 'push',
        edge: process.env.RTMP_EDGE_URL ? `${process.env.RTMP_EDGE_URL}/hls` : undefined
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

// Event handlers
nms.on('preConnect', (id: string, args: any) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id: string, args: any) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id: string, streamPath: string, args: any) => {
  console.log('[NodeEvent on prePublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
  // Here you can add authentication logic
  // For now, allow all streams with the key 'gkp_radio_live'
});

nms.on('postPublish', (id: string, streamPath: string, args: any) => {
  console.log('[NodeEvent on postPublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
  // Notify your application that a stream has started
  console.log('🔴 GKP Radio Live Stream Started!');
});

nms.on('donePublish', (id: string, streamPath: string, args: any) => {
  console.log('[NodeEvent on donePublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
  console.log('⚫ GKP Radio Live Stream Ended!');
});

export const startRTMPServer = () => {
  nms.run();
  console.log('🎥 RTMP Server started on port 1935');
  console.log(`📺 HTTP Server started on port ${config.http.port}`);
  console.log('🎙️ Ready for OBS Studio streaming!');
  console.log('');
  console.log('OBS Settings:');
  console.log('- Service: Custom');
  const rtmpUrl = process.env.RTMP_BASE_URL || 
                   (process.env.SITE_URL ? process.env.SITE_URL.replace('https://', 'rtmp://').replace('http://', 'rtmp://') : 'rtmp://localhost') + ':1935';
  console.log(`- Server: ${rtmpUrl}/live`);
  console.log('- Stream Key: gkp_radio_live');
  console.log('');
};

export default nms;