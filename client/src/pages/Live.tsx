import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Users, MessageCircle, Heart, Send, Calendar, Clock, Mic, Radio } from "@/lib/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { SimpleCustomPlayer } from "@/components/SimpleCustomPlayer";
import { ScheduleSkeleton } from "@/components/skeletons/ScheduleSkeleton";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { EventsSkeleton } from "@/components/skeletons/EventsSkeleton";
import { liveStreamRealtime, realtimeService } from "@/lib/supabase-realtime";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  userId?: string | null;
  isVerified?: boolean;
  roomId?: string;
}

const Live = () => {
  const [chatMessage, setChatMessage] = useState("");
  const [username, setUsername] = useState("Faith Friend");
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load chat history from Supabase
  const { data: chatHistory = [], isLoading: chatLoading } = useQuery({
    queryKey: ['liveChatMessages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liveChatMessages')
        .select('*')
        .eq('roomId', 'main')
        .order('timestamp', { ascending: true })
        .limit(50);
      
      if (error) {
        return [];
      }
      
      return data as ChatMessage[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation to save chat message to Supabase
  const sendMessage = useMutation({
    mutationFn: async (data: { username: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: savedMessage, error } = await supabase
        .from('liveChatMessages')
        .insert({
          username: data.username,
          message: data.message,
          userId: user?.id || null,
          isVerified: user?.user_metadata?.role === 'admin' || false,
          roomId: 'main',
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Also broadcast via Realtime for instant updates
      await liveStreamRealtime.sendChatMessage(data.message, data.username);
      
      return savedMessage;
    },
    onSuccess: (newMessage) => {
      // Optimistically update the chat
      queryClient.setQueryData(['liveChatMessages'], (old: ChatMessage[] = []) => {
        return [...old, newMessage];
      });
      
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['liveChatMessages'] });
      
      setChatMessage("");
      
      // Auto-scroll to bottom
      if (chatScrollRef.current) {
        setTimeout(() => {
          chatScrollRef.current?.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize Supabase Realtime
  useEffect(() => {
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('live-chat-main')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'liveChatMessages',
          filter: 'roomId=eq.main'
        },
        (payload) => {
          // Add new message to chat
          queryClient.setQueryData(['liveChatMessages'], (old: ChatMessage[] = []) => {
            // Check if message already exists to avoid duplicates
            const exists = old.some((msg: ChatMessage) => msg.id === payload.new.id);
            if (!exists) {
              return [...old, payload.new as ChatMessage];
            }
            return old;
          });
          
          // Auto-scroll to bottom
          if (chatScrollRef.current) {
            setTimeout(() => {
              chatScrollRef.current?.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      )
      .subscribe();

    // Request notification permission
    realtimeService.requestNotificationPermission();

    // Track user presence
    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'Faith Friend');
      }
    };
    trackPresence();

    // Set up presence tracking
    const presenceChannel = supabase.channel('online-listeners', {
      config: {
        presence: {
          key: crypto.randomUUID(), // Unique key for each listener
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Listener joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Listener left
      });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          online_at: new Date().toISOString(),
          username: username,
        });
        setIsConnected(true);
      }
    });

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
      presenceChannel.untrack().then(() => {
        presenceChannel.unsubscribe();
      });
    };
  }, [username, queryClient]);

  // Real schedule data
  const realScheduleData = [
    { 
      id: 1,
      title: 'Wake Up Y\'all', 
      time: '6:00 AM – 9:00 AM', 
      host: 'GKPRadio Morning Team', 
      description: 'Start your morning with faith-driven conversation, motivation, and music for the soul.',
      category: 'Talk Show',
      startHour: 6, 
      endHour: 9,
      isLive: false
    },
    { 
      id: 2,
      title: 'In Case You Did Not Know', 
      time: '9:00 AM – 10:00 AM', 
      host: 'GKPRadio Team',
      description: 'Discover surprising facts and insights you might have missed.',
      category: 'Talk Show',
      startHour: 9, 
      endHour: 10,
      isLive: false
    },
    { 
      id: 3,
      title: 'Kingdom Teachings', 
      time: '10:00 AM – 11:00 AM', 
      host: 'Pastor Myles Monroe',
      description: 'Powerful kingdom-focused teaching on purpose, leadership, and spiritual authority.',
      category: 'Teaching',
      startHour: 10, 
      endHour: 11,
      isLive: false
    },
    { 
      id: 4,
      title: 'Lunch Time', 
      time: '11:00 AM – 12:00 PM', 
      host: 'Jane Peter',
      description: 'Midday conversations and community connection time.',
      category: 'Talk Show',
      startHour: 11, 
      endHour: 12,
      isLive: false
    },
    { 
      id: 5,
      title: 'Marriage Talk', 
      time: '12:00 PM – 1:00 PM', 
      host: 'Dustin Scott',
      description: 'Insights and discussions about godly marriage and relationships.',
      category: 'Marriage',
      startHour: 12, 
      endHour: 13,
      isLive: false
    },
    { 
      id: 6,
      title: 'Testimonies', 
      time: '1:00 PM – 2:00 PM', 
      host: 'Stan Lewis',
      description: 'Share and hear powerful testimonies of God\'s goodness.',
      category: 'Testimony',
      startHour: 13, 
      endHour: 14,
      isLive: false
    },
    { 
      id: 7,
      title: 'Youth Corner', 
      time: '6:00 PM – 7:00 PM', 
      host: 'Melissa Burt',
      description: 'Engaging content and discussions for young believers.',
      category: 'Youth',
      startHour: 18, 
      endHour: 19,
      isLive: false
    },
    { 
      id: 8,
      title: 'Praise & Worship Music', 
      time: '10:00 PM – 12:00 AM', 
      host: 'Auto-DJ',
      description: 'Late night praise and worship music for your soul.',
      category: 'Music',
      startHour: 22, 
      endHour: 24,
      isLive: false
    }
  ];

  // Detect current live show
  const getCurrentShow = () => {
    const now = new Date();
    const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const currentHour = centralTime.getHours();
    
    const activeShow = realScheduleData.find(show => 
      currentHour >= show.startHour && currentHour < show.endHour
    );
    
    if (activeShow) {
      return { ...activeShow, isLive: true };
    }
    return null;
  };

  // Mark current show as live in the schedule
  const scheduleWithLiveStatus = realScheduleData.map(show => {
    const currentShow = getCurrentShow();
    return {
      ...show,
      isLive: currentShow && currentShow.id === show.id
    };
  });

  // Upcoming events (static for now)
  const upcomingEvents = [
    {
      id: 1,
      title: "Sunday Service Live",
      formattedDate: "This Sunday",
      time: "10:00 AM EST",
      category: "Worship Service"
    },
    {
      id: 2,
      title: "Bible Study Marathon", 
      formattedDate: "Tuesday",
      time: "7:00 PM EST",
      category: "Study Session"
    },
    {
      id: 3,
      title: "Youth Revival Night",
      formattedDate: "Friday", 
      time: "8:00 PM EST",
      category: "Youth Event"
    }
  ];

  // Handle sending chat message
  const handleSendMessage = () => {
    if (!chatMessage.trim() || !username.trim()) return;
    
    sendMessage.mutate({
      username: username.trim(),
      message: chatMessage.trim()
    });
  };

  const handleRemindMe = (program: any) => {
    toast({
      title: "Reminder set",
      description: `We'll notify you when "${program.title}" starts at ${program.time}`,
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  const currentShow = getCurrentShow();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-16 pb-16">
        {/* Compact Header Section */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Badge className={`${currentShow ? 'btn-live animate-pulse' : 'bg-blue-600'} text-sm font-medium`}>
            {currentShow ? '🔴 LIVE NOW' : '📻 RADIO STREAM'}
          </Badge>
          <span className="text-muted-foreground">
            {viewerCount > 0 ? `${viewerCount} listeners online` : 'Loading listeners...'}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Live Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Stream Player */}
            <SimpleCustomPlayer />

            {/* Current Show Info */}
            {currentShow && (
              <Card className="border-accent">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Radio className="w-5 h-5 text-accent" />
                        <Badge className="btn-live animate-pulse">ON AIR</Badge>
                      </div>
                      <h2 className="text-2xl font-bold font-serif">{currentShow.title}</h2>
                      <p className="text-muted-foreground mt-1">with {currentShow.host}</p>
                      <p className="text-sm mt-2">{currentShow.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Program Schedule */}
            <Card>
              <CardHeader>
                <h3 className="font-serif font-bold text-xl">Today's Schedule</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduleWithLiveStatus.map((event) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      event.isLive ? 'border-accent bg-accent/10' : 'hover:bg-secondary/50'
                    } transition-colors`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        {event.isLive && (
                          <Badge className="bg-live-indicator text-live-foreground text-xs animate-pulse">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.category}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={event.isLive ? undefined : () => handleRemindMe(event)}
                      data-testid={`button-${event.isLive ? 'join' : 'remind'}-${event.id}`}
                    >
                      {event.isLive ? "Listening" : "Remind Me"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Chat with Supabase Persistence */}
            <Card>
              <CardHeader>
                <h3 className="font-serif font-bold text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Live Chat
                  {isConnected && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Connected
                    </Badge>
                  )}
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80 px-4" ref={chatScrollRef}>
                  <div className="space-y-3 py-4">
                    {chatLoading ? (
                      <ChatSkeleton />
                    ) : chatHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Be the first to say hello!
                      </div>
                    ) : (
                      chatHistory.map((message) => (
                        <div key={message.id} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              message.isVerified ? 'text-accent' : 'text-primary'
                            }`}>
                              {message.username}
                              {message.isVerified && (
                                <Badge className="ml-1 bg-accent text-accent-foreground text-xs">
                                  ✓
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {message.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <div className="space-y-2">
                    <Input
                      placeholder="Your name..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-sm"
                      disabled={sendMessage.isPending}
                      data-testid="input-username"
                    />
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !sendMessage.isPending && handleSendMessage()}
                        className="flex-1"
                        disabled={sendMessage.isPending}
                        data-testid="input-chat-message"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage}
                        disabled={!isConnected || sendMessage.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <h3 className="font-serif font-bold text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Events
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 rounded-lg border">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.formattedDate} at {event.time}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {event.category}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Prayer Requests */}
            <Card>
              <CardHeader>
                <h3 className="font-serif font-bold text-lg">Prayer Requests</h3>
              </CardHeader>
              <CardContent>
                <Link href="/community" data-testid="link-prayer-request">
                  <Button className="w-full bg-black hover:bg-gray-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200">
                    <Heart className="w-4 h-4 mr-2" />
                    Submit Prayer Request
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Our community will pray for you
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default Live;