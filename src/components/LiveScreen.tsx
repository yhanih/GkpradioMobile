import { Radio, Volume2, Heart, MessageCircle, Users, Calendar, Waves } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

export function LiveScreen() {
  const schedule = [
    { time: '6:00 AM', program: 'Morning Devotion', host: 'Pastor Williams' },
    { time: '9:00 AM', program: 'Praise & Worship Hour', host: 'Ministry Team' },
    { time: '12:00 PM', program: 'Midday Prayer', host: 'Elder Thompson' },
    { time: '3:00 PM', program: 'Youth Voices', host: 'Youth Leaders' },
    { time: '6:00 PM', program: 'Evening Service', host: 'Pastor Williams' },
    { time: '9:00 PM', program: 'Night Prayer Watch', host: 'Prayer Team' },
  ];

  const liveChat = [
    { user: 'Sarah J.', message: 'Amen! This message is so powerful 🙏', time: 'Just now' },
    { user: 'Michael B.', message: 'Praying with you all from Texas!', time: '1 min ago' },
    { user: 'Grace W.', message: 'God bless you Pastor!', time: '2 min ago' },
  ];

  return (
    <div className="pb-32 bg-gradient-to-b from-muted/30 to-background">
      {/* Live Player */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1),transparent_70%)]"></div>
        
        <div className="relative text-white px-5 pt-6 pb-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <Badge className="bg-red-500 border-0 shadow-lg font-bold">LIVE</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
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
                
                {/* Main radio container */}
                <div className="relative h-36 w-36 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                  <div className="h-28 w-28 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">
                    <Radio className="h-14 w-14" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Now Playing */}
          <div className="text-center mb-7">
            <h2 className="text-[23px] font-bold mb-2">Morning Devotion</h2>
            <p className="text-[15px] text-white/90 mb-1 font-medium">Pastor James Williams</p>
            <p className="text-xs text-white/70 font-medium">God Kingdom Principles Radio - 24/7</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-white hover:bg-white/20 rounded-2xl transition-all hover:scale-105"
            >
              <Heart className="h-6 w-6" strokeWidth={2} />
            </Button>
            
            <Button className="h-20 w-20 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md shadow-2xl transition-all hover:scale-105">
              <Volume2 className="h-9 w-9" strokeWidth={2.5} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-white hover:bg-white/20 rounded-2xl transition-all hover:scale-105"
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
        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold">Today's Schedule</h3>
            <Button variant="ghost" className="h-auto p-0 text-primary text-sm font-semibold hover:underline">
              <Calendar className="h-4 w-4 mr-1.5" strokeWidth={2} />
              Full Schedule
            </Button>
          </div>

          <div className="space-y-3">
            {schedule.map((item, index) => (
              <Card
                key={index}
                className={`p-4 transition-all border-border/50 bg-gradient-to-br from-white to-muted/10 ${
                  index === 0 
                    ? 'border-2 border-primary shadow-lg shadow-primary/10' 
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
                      index === 0 
                        ? 'bg-gradient-to-br from-primary to-emerald-600 text-white' 
                        : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground'
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
                      <Badge variant="outline" className="text-[11px] border-primary text-primary font-bold">
                        Now Playing
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Chat */}
        <div>
          <h3 className="mb-4 text-[17px] font-semibold">Live Chat</h3>
          <Card className="p-5 border-border/50 bg-gradient-to-br from-white to-muted/10">
            <div className="space-y-4 mb-5">
              {liveChat.map((chat, index) => (
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

            <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 rounded-xl font-semibold">
              <MessageCircle className="h-4 w-4 mr-2" />
              Join the Conversation
            </Button>
          </Card>
        </div>

        {/* Share */}
        <Card className="p-6 text-center border-border/50 bg-gradient-to-br from-white to-muted/10">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Radio className="h-8 w-8 text-primary" strokeWidth={2.5} />
          </div>
          <h3 className="mb-2 font-semibold text-[17px]">Share GKP Radio</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Invite others to listen and be blessed
          </p>
          <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 rounded-xl font-semibold">
            Share Live Stream
          </Button>
        </Card>
      </div>
    </div>
  );
}
