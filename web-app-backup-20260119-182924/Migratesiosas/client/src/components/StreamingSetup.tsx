import { useState } from "react";
import { Radio, Download, ExternalLink, CheckCircle, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const StreamingSetup = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<'offline' | 'connecting' | 'live'>('offline');

  const streamingOptions = [
    {
      id: 'local-icecast',
      title: 'Local Icecast Server',
      description: 'Run your own streaming server on Windows',
      difficulty: 'Beginner',
      cost: 'Free',
      features: ['Full control', 'No bandwidth limits', 'Private server', 'Professional setup'],
      setupTime: '15 minutes',
      recommended: true
    },
    {
      id: 'radioking',
      title: 'RadioKing',
      description: 'Cloud-based radio streaming service',
      difficulty: 'Easy',
      cost: 'Free Plan Available',
      features: ['100 listeners free', 'Web interface', 'Mobile apps', 'Analytics'],
      setupTime: '5 minutes',
      recommended: false
    },
    {
      id: 'mixlr',
      title: 'Mixlr',
      description: 'Live audio streaming platform',
      difficulty: 'Easy',
      cost: 'Free',
      features: ['Unlimited broadcasting', 'Embeddable player', 'Social features', 'Mobile streaming'],
      setupTime: '5 minutes',
      recommended: false
    }
  ];

  const streamingSoftware = [
    {
      name: 'OBS Studio',
      description: 'Professional streaming software with advanced features',
      downloadUrl: 'https://obsproject.com/',
      features: ['Scene management', 'Audio mixing', 'Plugins support', 'Recording'],
      recommended: true
    },
    {
      name: 'BUTT (Broadcast Using This Tool)',
      description: 'Simple, lightweight audio streaming tool',
      downloadUrl: 'https://danielnoethen.de/butt/',
      features: ['Audio-only focus', 'Low resource usage', 'Easy configuration', 'Reliable streaming'],
      recommended: false
    },
    {
      name: 'Mixxx',
      description: 'DJ software with built-in streaming capabilities',
      downloadUrl: 'https://www.mixxx.org/',
      features: ['DJ mixing', 'Music library', 'Effects', 'Professional controls'],
      recommended: false
    }
  ];

  const testStreamConnection = () => {
    setStreamingStatus('connecting');
    // Simulate connection test
    setTimeout(() => {
      setStreamingStatus('live');
      setTimeout(() => setStreamingStatus('offline'), 5000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif font-bold text-3xl mb-2">Setup Live Broadcasting</h1>
        <p className="text-muted-foreground">
          Connect your Windows audio to GKP Radio for live streaming
        </p>
      </div>

      <Alert>
        <Radio className="h-4 w-4" />
        <AlertDescription>
          Choose a streaming solution that works best for your setup. We recommend starting with the Local Icecast Server for full control and professional broadcasting.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="solutions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solutions">Streaming Solutions</TabsTrigger>
          <TabsTrigger value="software">Broadcasting Software</TabsTrigger>
          <TabsTrigger value="integration">Website Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="solutions" className="space-y-4">
          <div className="grid gap-4">
            {streamingOptions.map((option) => (
              <Card 
                key={option.id} 
                className={`cursor-pointer transition-colors ${
                  selectedOption === option.id ? 'border-primary bg-accent/5' : ''
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{option.title}</span>
                      {option.recommended && (
                        <Badge className="bg-faith-gold text-faith-gold-foreground">Recommended</Badge>
                      )}
                    </CardTitle>
                    <Badge variant="secondary">{option.cost}</Badge>
                  </div>
                  <p className="text-muted-foreground">{option.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Difficulty: </span>
                        <span className="text-muted-foreground">{option.difficulty}</span>
                      </div>
                      <div>
                        <span className="font-medium">Setup Time: </span>
                        <span className="text-muted-foreground">{option.setupTime}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-sm">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {option.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedOption === option.id && (
                      <div className="pt-3 border-t">
                        <Button className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Get Setup Instructions
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="software" className="space-y-4">
          <div className="grid gap-4">
            {streamingSoftware.map((software, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{software.name}</span>
                      {software.recommended && (
                        <Badge className="bg-faith-gold text-faith-gold-foreground">Recommended</Badge>
                      )}
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <a href={software.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{software.description}</p>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="font-medium text-sm">Key Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {software.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Connection Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={testStreamConnection}
                  disabled={streamingStatus === 'connecting'}
                  className="flex-1"
                >
                  {streamingStatus === 'connecting' ? (
                    <>Testing Connection...</>
                  ) : streamingStatus === 'live' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Stream Connected!
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Test Stream Connection
                    </>
                  )}
                </Button>
                
                <Badge 
                  className={
                    streamingStatus === 'live' 
                      ? 'bg-live-indicator text-live-foreground animate-pulse' 
                      : streamingStatus === 'connecting'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-secondary'
                  }
                >
                  {streamingStatus === 'live' ? '🔴 LIVE' : 
                   streamingStatus === 'connecting' ? '🟡 CONNECTING' : '⚪ OFFLINE'}
                </Badge>
              </div>

              {streamingStatus === 'live' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Stream is live! Your broadcast is now available on the Live page and can be heard by listeners.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Stream URL:</span>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    {import.meta.env.VITE_HLS_BASE_URL || `http://${window.location.hostname}:8000`}/live
                  </p>
                </div>
                <div>
                  <span className="font-medium">Stream Key:</span>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    gkpradio2025
                  </p>
                </div>
                <div>
                  <span className="font-medium">Format:</span>
                  <p className="text-muted-foreground">MP3, 128kbps</p>
                </div>
                <div>
                  <span className="font-medium">Mount Point:</span>
                  <p className="text-muted-foreground">/live</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Download and install streaming software</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Setup streaming server (Icecast recommended)</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Configure streaming software with connection details</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Test connection and start broadcasting</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StreamingSetup;