import { useState, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Users, MessageCircle, Settings, Upload, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface BroadcastingDashboardProps {
  user: any;
}

const BroadcastingDashboard = ({ user }: BroadcastingDashboardProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentListeners, setCurrentListeners] = useState(0);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastDescription, setBroadcastDescription] = useState("");
  const [audioLevel, setAudioLevel] = useState([75]);
  const [streamQuality, setStreamQuality] = useState("128kbps");

  // Simulate live data updates
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setCurrentListeners(prev => Math.max(0, prev + Math.floor(Math.random() * 10) - 5));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const liveMessages = [
    { id: 1, user: "Sarah@ChicagoUSA", message: "Powerful message today! Blessing from Chicago 🙏", time: "1 min ago" },
    { id: 2, user: "Michael@LondonUK", message: "Listening from London. God bless this ministry!", time: "2 min ago" },
    { id: 3, user: "Grace@TorontoCA", message: "Please pray for my family during this difficult time", time: "3 min ago" },
    { id: 4, user: "David@SydneyAU", message: "Amazing worship session. Hearts touched in Australia!", time: "5 min ago" }
  ];

  const upcomingShows = [
    { id: 1, title: "Morning Prayer", time: "6:00 AM", host: "Minister Grace", duration: "1h" },
    { id: 2, title: "Youth Hour", time: "7:00 PM", host: "Pastor Mike", duration: "1h" },
    { id: 3, title: "Healing Service", time: "9:00 PM", host: "Dr. Sarah", duration: "1h 30m" }
  ];

  const startBroadcast = () => {
    if (!broadcastTitle.trim()) {
      alert("Please enter a broadcast title before going live");
      return;
    }
    setIsLive(true);
    setCurrentListeners(Math.floor(Math.random() * 50) + 10);
  };

  const stopBroadcast = () => {
    setIsLive(false);
    setCurrentListeners(0);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-3xl">Broadcasting Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.displayName || "Broadcaster"}</p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${isLive ? 'bg-live-indicator text-live-foreground animate-pulse' : 'bg-secondary'}`}>
            {isLive ? '🔴 LIVE' : '⚪ OFFLINE'}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Broadcasting Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Broadcast Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Broadcast Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcast-title">Broadcast Title *</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="e.g., Faith Talk with Pastor David"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    disabled={isLive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broadcast-description">Description</Label>
                  <Textarea
                    id="broadcast-description"
                    placeholder="Share what this broadcast is about..."
                    value={broadcastDescription}
                    onChange={(e) => setBroadcastDescription(e.target.value)}
                    disabled={isLive}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Label>Audio Level</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={audioLevel}
                        onValueChange={setAudioLevel}
                        max={100}
                        step={1}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">{audioLevel[0]}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stream Quality</Label>
                    <select 
                      className="px-3 py-2 border rounded-md bg-background"
                      value={streamQuality}
                      onChange={(e) => setStreamQuality(e.target.value)}
                      disabled={isLive}
                    >
                      <option value="64kbps">64 kbps (Mobile)</option>
                      <option value="128kbps">128 kbps (Standard)</option>
                      <option value="256kbps">256 kbps (High Quality)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Live Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  {!isLive ? (
                    <Button 
                      onClick={startBroadcast}
                      className="btn-live text-xl px-8 py-6"
                      size="lg"
                    >
                      <Play className="w-6 h-6 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={stopBroadcast}
                        variant="destructive"
                        size="lg"
                        className="px-8 py-6"
                      >
                        <Pause className="w-6 h-6 mr-2" />
                        End Broadcast
                      </Button>
                      
                      <Button 
                        onClick={() => setIsMuted(!isMuted)}
                        variant={isMuted ? "destructive" : "outline"}
                        size="lg"
                      >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </Button>
                    </>
                  )}
                </div>

                {isLive && (
                  <div className="mt-6 p-4 bg-live-indicator/10 rounded-lg">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">NOW BROADCASTING</h3>
                      <p className="text-sm text-muted-foreground">{broadcastTitle}</p>
                      <div className="flex items-center justify-center mt-2 space-x-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="font-medium">{currentListeners} listeners</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Live for 15:32</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Audio Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Upload audio files for your broadcast</p>
                  <Button variant="outline">
                    Browse Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Live Chat
                  {isLive && <Badge className="ml-2 bg-live-indicator text-live-foreground">ACTIVE</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  {isLive ? (
                    <div className="space-y-3">
                      {liveMessages.map((message) => (
                        <div key={message.id} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-primary">{message.user}</span>
                            <span className="text-xs text-muted-foreground">{message.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start broadcasting to see live messages</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Shows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Shows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingShows.map((show) => (
                  <div key={show.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">{show.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {show.time} • {show.host} • {show.duration}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="font-bold text-2xl text-primary">{isLive ? currentListeners : 0}</div>
                  <div className="text-sm text-muted-foreground">Current Listeners</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-accent">2.5K</div>
                  <div className="text-sm text-muted-foreground">Total Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-faith-gold">45</div>
                  <div className="text-sm text-muted-foreground">Shows This Month</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastingDashboard;