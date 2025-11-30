import { Radio, Volume2, Heart, MessageCircle, Users, Calendar, Waves, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAudio } from '../utils/AudioContext';

export function LiveScreen() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [liveChat, setLiveChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPlaying, playLiveStream, pause, error } = useAudio();

  useEffect(() => {
    loadLiveData();
  }, []);

  async function loadLiveData() {
    try {
      setLoading(true);
      const [scheduleData, chatData] = await Promise.all([
        apiCall('/schedule'),
        apiCall('/live-chat')
      ]);
      setSchedule(scheduleData);
      setLiveChat(chatData);
    } catch (error) {
      console.error('Error loading live data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostMessage(message: string, user: string) {
    try {
      const newMessage = await apiCall('/live-chat', {
        method: 'POST',
        body: { user, message }
      });
      setLiveChat(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Error posting message:', error);
    }
  }

  return (
    <div className="pb-32">
      {/* Live Player with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-500 to-teal-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15),transparent_70%)]"></div>
        
        <div className="relative text-white px-5 pt-6 pb-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <Badge className="bg-red-500 border-0 shadow-lg font-bold">LIVE</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Users className="h-4 w-4" />
              <span>1,234 listening</span>
            </div>
          </div>

          {/* Radio Visualizer */}
          <div className="relative mb-7">
            <div className="h-52 flex items-center justify-center">
              <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 bg-white/5 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 bg-white/10 rounded-full animate-ping"></div>
                </div>
                
                {/* Main radio container with Glass */}
                <div className="relative h-36 w-36 bg-white/15 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl ring-1 ring-white/20 border border-white/10">
                  <div className="h-28 w-28 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Radio className="h-14 w-14" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Now Playing */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-red-500/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full mb-3 border border-red-400/20">
              <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wide">Live Now</span>
            </div>
            <h2 className="text-[23px] font-bold mb-2">Morning Devotion</h2>
            <p className="text-[15px] text-white/90 mb-1 font-medium">Pastor James Williams</p>
            <p className="text-xs text-white/70 font-medium">Broadcasting 24/7 • GKP Radio</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-white hover:bg-white/15 rounded-3xl backdrop-blur-md transition-all hover:scale-105"
            >
              <Heart className="h-6 w-6" strokeWidth={2} />
            </Button>
            
            <Button 
              onClick={() => isPlaying ? pause() : playLiveStream()}
              className="h-20 w-20 bg-white/15 hover:bg-white/25 rounded-full backdrop-blur-xl shadow-2xl transition-all hover:scale-105 border border-white/20 relative"
            >
              {isPlaying ? (
                <>
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
                  <Volume2 className="h-9 w-9 relative z-10" strokeWidth={2.5} />
                </>
              ) : (
                <Volume2 className="h-9 w-9" strokeWidth={2.5} />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-white hover:bg-white/15 rounded-3xl backdrop-blur-md transition-all hover:scale-105"
            >
              <MessageCircle className="h-6 w-6" strokeWidth={2} />
            </Button>
          </div>

          {/* Audio Wave Visualization */}
          <div className="flex items-center gap-1 justify-center">
            {[3, 7, 4, 9, 5, 8, 3, 6].map((height, i) => (
              <div
                key={i}
                className="w-1 bg-white/40 rounded-full transition-all"
                style={{
                  height: `${height * 3}px`,
                  animation: `pulse ${1 + i * 0.1}s ease-in-out infinite`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-7 space-y-6">
        {/* Stream Configuration Notice */}
        <div className="p-4 bg-blue-50/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-blue-900 mb-1">Demo Stream Active</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Currently using a demo stream. To connect your Azuracast stream, update the URL in{' '}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded text-[11px] font-mono">/utils/AudioContext.tsx</code>
              </p>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold">Today's Schedule</h3>
            <Button variant="ghost" className="h-auto p-0 text-primary text-sm font-semibold hover:underline">
              <Calendar className="h-4 w-4 mr-1.5" strokeWidth={2} />
              Full Schedule
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 transition-all bg-white/60 backdrop-blur-xl rounded-3xl border shadow-lg shadow-black/5 ${
                    index === 0 
                      ? 'border-primary/40 shadow-primary/10' 
                      : 'border-white/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
                        index === 0 
                          ? 'bg-gradient-to-br from-primary to-emerald-600 text-white' 
                          : 'bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm text-muted-foreground'
                      }`}>
                        <Radio className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-[15px]">{item.program}</p>
                        <p className="text-sm text-muted-foreground font-medium">{item.host}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[15px] mb-1">{item.time}</p>
                      {index === 0 && (
                        <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/10 text-primary font-bold backdrop-blur-sm">
                          Now Playing
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Chat */}
        <div>
          <h3 className="mb-4 text-[17px] font-semibold">Live Chat</h3>
          <div className="p-5 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
            <div className="space-y-4 mb-5">
              {liveChat.slice(0, 3).map((chat, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white font-semibold text-sm">
                      {chat.user.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{chat.user}</p>
                      <span className="text-xs text-muted-foreground font-medium">{chat.time}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => handlePostMessage("Amen! Blessed by this message 🙏", "Guest")}
              className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 rounded-2xl font-semibold"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Join the Conversation
            </Button>
          </div>
        </div>

        {/* Share */}
        <div className="p-6 text-center bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/15 to-primary/5 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Radio className="h-8 w-8 text-primary" strokeWidth={2.5} />
          </div>
          <h3 className="mb-2 font-semibold text-[17px]">Share GKP Radio</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Invite others to listen and be blessed
          </p>
          <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 rounded-2xl font-semibold">
            Share Live Stream
          </Button>
        </div>
      </div>
    </div>
  );
}