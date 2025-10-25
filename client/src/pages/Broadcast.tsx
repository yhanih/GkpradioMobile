import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AudioPlayer from '@/components/AudioPlayer';
import { OWNCAST_CONFIG, isOwncastConfigured } from '@/config/owncast';
import { VPSStatusCheck } from '@/components/VPSStatusCheck';
import { Radio, Clock, Mic, Monitor, ExternalLink, Server, Settings, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const Broadcast = () => {
  const isConfigured = isOwncastConfigured();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      // Silent fail - clipboard operation failed
    }
  };

  const obsSettings = [
    {
      title: "RTMP Settings",
      settings: [
        { label: "Service", value: "Custom" },
        { label: "Server", value: OWNCAST_CONFIG.RTMP_URL },
        { label: "Stream Key", value: OWNCAST_CONFIG.STREAM_KEY }
      ]
    },
    {
      title: "Video Settings",
      settings: [
        { label: "Resolution", value: "1280x720 (720p)" },
        { label: "FPS", value: "30" },
        { label: "Bitrate", value: "2500 kbps" }
      ]
    },
    {
      title: "Audio Settings",
      settings: [
        { label: "Sample Rate", value: "44.1 kHz" },
        { label: "Bitrate", value: "128 kbps" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Badge className="btn-faith-primary text-sm font-medium">
              🎙️ BROADCASTING STUDIO
            </Badge>
          </div>
          
          <h1 className="font-serif font-bold text-4xl md:text-5xl mb-4">
            GKP Radio Broadcasting
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage your VPS-based Owncast streaming server and configure OBS Studio for live broadcasting.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Broadcasting Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {!isConfigured ? (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                    <Settings className="w-5 h-5" />
                    <span>VPS Configuration Required</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-amber-700 dark:text-amber-300">
                    Your Owncast VPS server needs to be configured before you can start broadcasting.
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Required Environment Variables:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div>VITE_OWNCAST_SERVER_URL=http://YOUR-VPS-IP:8080</div>
                      <div>VITE_OWNCAST_RTMP_URL=rtmp://YOUR-VPS-IP:1935/live</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => window.open('/owncast-vps-setup.md', '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Setup Guide</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Server Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Badge className="bg-green-500">✅ CONFIGURED</Badge>
                      <span>VPS Streaming Server</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Server URL</h4>
                        <p className="font-mono text-sm">{OWNCAST_CONFIG.SERVER_URL}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">RTMP URL</h4>
                        <p className="font-mono text-sm">{OWNCAST_CONFIG.RTMP_URL}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => window.open(OWNCAST_CONFIG.SERVER_URL, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Stream Viewer</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(OWNCAST_CONFIG.ADMIN_URL, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <Server className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* OBS Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>OBS Studio Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {obsSettings.map((section, index) => (
                      <div key={index}>
                        <h4 className="font-semibold mb-3">{section.title}</h4>
                        <div className="space-y-2">
                          {section.settings.map((setting, settingIndex) => (
                            <div key={settingIndex} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <span className="font-medium">{setting.label}:</span>
                              <div className="flex items-center space-x-2">
                                <code className="bg-background px-2 py-1 rounded text-sm">{setting.value}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(setting.value, `${section.title}-${setting.label}`)}
                                  className="h-8 w-8 p-0"
                                >
                                  {copiedItem === `${section.title}-${setting.label}` ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* VPS Status */}
            <VPSStatusCheck />
            
            {/* Quick Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>Quick Setup Guide</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-faith-gold text-white text-sm flex items-center justify-center font-bold">1</div>
                    <div className="text-sm">
                      <strong>Setup VPS</strong>
                      <p className="text-muted-foreground">Install Owncast on your VPS server</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-faith-gold text-white text-sm flex items-center justify-center font-bold">2</div>
                    <div className="text-sm">
                      <strong>Configure Environment</strong>
                      <p className="text-muted-foreground">Set VPS IP in Replit environment variables</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-faith-gold text-white text-sm flex items-center justify-center font-bold">3</div>
                    <div className="text-sm">
                      <strong>Configure OBS</strong>
                      <p className="text-muted-foreground">Use RTMP settings shown above</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-faith-gold text-white text-sm flex items-center justify-center font-bold">4</div>
                    <div className="text-sm">
                      <strong>Start Streaming</strong>
                      <p className="text-muted-foreground">Click "Start Streaming" in OBS</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => window.open('/owncast-vps-setup.md', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  VPS Setup Guide
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => window.open('/obs-video-streaming-guide.md', '_blank')}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  OBS Configuration Guide
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => window.open('https://owncast.online/docs/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Owncast Documentation
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Radio className="w-5 h-5" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VPS Configuration</span>
                    <Badge variant={isConfigured ? "default" : "secondary"}>
                      {isConfigured ? "Ready" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audio Stream</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <AudioPlayer data-testid="audio-player" />
      <Footer />
    </div>
  );
};

export default Broadcast;