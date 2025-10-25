import { Request, Response } from 'express';
import fetch from 'node-fetch';

// Proxy WebRTC WHEP requests to MediaMTX
export async function proxyWebRTCRequest(req: Request, res: Response) {
  try {
    const mediamtxUrl = `${process.env.MEDIAMTX_BASE_URL || ''}${req.path}`;
    
    const response = await fetch(mediamtxUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/sdp',
      },
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const responseText = await response.text();
    
    // Forward all headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.status(response.status).send(responseText);
  } catch (error) {
    console.error('WebRTC proxy error:', error);
    res.status(500).json({ error: 'WebRTC proxy failed' });
  }
}

// Get WebRTC status from MediaMTX
export async function getWebRTCStatus(req: Request, res: Response) {
  try {
    const response = await fetch(`${process.env.MEDIAMTX_API_URL || ''}/v3/paths/list`);
    const data = await response.json() as any;
    
    // Check if 'live' path exists and has readers
    const livePath = data?.items?.find((item: any) => item.name === 'live');
    const isLive = livePath && livePath.source && livePath.source.type === 'rtmpConn';
    const viewers = livePath?.readers?.length || 0;
    
    res.json({
      online: isLive,
      viewerCount: viewers,
      streamTitle: 'GKP Radio Live Stream',
      lastConnectTime: livePath?.source?.createdAt || null,
    });
  } catch (error) {
    console.error('WebRTC status error:', error);
    res.json({
      online: false,
      viewerCount: 0,
      streamTitle: 'GKP Radio Live Stream',
      lastConnectTime: null,
    });
  }
}