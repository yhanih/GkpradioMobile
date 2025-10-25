import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OWNCAST_CONFIG } from '@/config/owncast';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface VPSStatus {
  webServer: boolean;
  rtmpServer: boolean;
  owncastAPI: boolean;
  isLive: boolean;
  loading: boolean;
}

export function VPSStatusCheck() {
  const [status, setStatus] = useState<VPSStatus>({
    webServer: false,
    rtmpServer: false,
    owncastAPI: false,
    isLive: false,
    loading: true
  });

  const checkVPSStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));

    try {
      // Check Owncast API and web server
      const response = await fetch(`${OWNCAST_CONFIG.SERVER_URL}/api/status`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          webServer: true,
          rtmpServer: true, // If API works, RTMP should be working too
          owncastAPI: true,
          isLive: data.online || false,
          loading: false
        });
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.log('VPS Status Check:', error);
      setStatus({
        webServer: false,
        rtmpServer: false,
        owncastAPI: false,
        isLive: false,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkVPSStatus();
    const interval = setInterval(checkVPSStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isWorking: boolean, loading: boolean) => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return isWorking ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isWorking: boolean, loading: boolean) => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>;
    return isWorking ? 
      <Badge className="bg-green-500">Online</Badge> : 
      <Badge variant="destructive">Offline</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>VPS Server Status</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkVPSStatus}
            disabled={status.loading}
          >
            <RefreshCw className={`h-4 w-4 ${status.loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.webServer, status.loading)}
              <span className="text-sm">Web Server (Port 8080)</span>
            </div>
            {getStatusBadge(status.webServer, status.loading)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.owncastAPI, status.loading)}
              <span className="text-sm">Owncast API</span>
            </div>
            {getStatusBadge(status.owncastAPI, status.loading)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status.isLive ? 
                <CheckCircle className="h-4 w-4 text-red-500" /> : 
                <AlertCircle className="h-4 w-4 text-gray-400" />
              }
              <span className="text-sm">Live Stream</span>
            </div>
            <Badge className={status.isLive ? "bg-red-500 animate-pulse" : "variant-secondary"}>
              {status.isLive ? "🔴 LIVE" : "Offline"}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Server:</strong> 74.208.102.89</div>
            <div><strong>RTMP:</strong> rtmp://74.208.102.89:1935/live</div>
            <div><strong>Stream Key:</strong> gkpAdmin2025@</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(OWNCAST_CONFIG.SERVER_URL, '_blank')}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>View Stream</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(OWNCAST_CONFIG.ADMIN_URL, '_blank')}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Admin</span>
          </Button>
        </div>

        {!status.webServer && !status.loading && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 dark:text-red-300">
              VPS server not responding. Check if Owncast is running on your server.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}