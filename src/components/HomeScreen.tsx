import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, MessageCircle, Share2, Users, MessageSquare, HandHeart, Play, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function HomeScreen() {
  const stats = [
    { label: 'Members', value: '2.5K', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Messages', value: '8.2K', icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { label: 'Prayers', value: '45K', icon: HandHeart, color: 'from-primary to-emerald-600' },
  ];

  const featuredContent = [
    {
      id: 1,
      title: 'Kingdom Principles: Understanding Your Purpose',
      speaker: 'Pastor James Williams',
      category: 'Teaching',
      duration: '45 min',
      image: 'https://images.unsplash.com/photo-1629143949694-606987575b07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwcHJhaXNlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      likes: 245,
      comments: 32,
    },
    {
      id: 2,
      title: 'Financial Freedom Through Faith',
      speaker: 'Dr. Sarah Johnson',
      category: 'Finance',
      duration: '38 min',
      image: 'https://images.unsplash.com/photo-1612350275854-f96a246cfc2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmF5ZXIlMjBoYW5kcyUyMGJpYmxlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      likes: 189,
      comments: 24,
    },
  ];

  return (
    <div className="pb-32 bg-gradient-to-b from-muted/30 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative text-white px-5 pt-6 pb-8">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30 shadow-xl">
                <span className="text-white text-xl font-bold">GKP</span>
              </div>
              <div>
                <h2 className="text-[21px] font-semibold mb-0.5">Welcome back!</h2>
                <p className="text-sm text-white/80">Kingdom Principles Radio</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-white/70" />
          </div>
          
          <p className="text-[15px] text-white/90 mb-4 leading-relaxed">
            Broadcasting Truth • Building Community • Transforming Lives
          </p>
          
          <Button className="w-full bg-white/95 text-primary hover:bg-white hover:scale-[1.02] h-12 shadow-xl shadow-black/10 backdrop-blur-sm transition-all rounded-xl font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              Listen Live Now
            </div>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-6 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-xl shadow-black/5 border border-border/50">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group cursor-pointer">
                  <div className={`bg-gradient-to-br ${stat.color} h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[19px] font-semibold mb-0.5">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-7">
        <h3 className="mb-4 text-[17px] font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-5 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-border/50 bg-gradient-to-br from-white to-muted/20">
            <div className="h-11 w-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-3 shadow-sm">
              <MessageCircle className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-[15px] mb-1">Prayer Request</p>
            <p className="text-xs text-muted-foreground">Share your needs</p>
          </Card>
          
          <Card className="p-5 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-border/50 bg-gradient-to-br from-white to-muted/20">
            <div className="h-11 w-11 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl flex items-center justify-center mb-3 shadow-sm">
              <Heart className="h-5 w-5 text-purple-500" strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-[15px] mb-1">Testimony</p>
            <p className="text-xs text-muted-foreground">Share God's work</p>
          </Card>
        </div>
      </div>

      {/* Featured Content */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-semibold">Featured Content</h3>
          <Button variant="ghost" className="h-auto p-0 text-primary text-sm font-semibold hover:underline">
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {featuredContent.map((content) => (
            <Card key={content.id} className="overflow-hidden hover:shadow-xl transition-all border-border/50 group">
              <div className="relative h-52 overflow-hidden">
                <ImageWithFallback
                  src={content.image}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-16 w-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
                    <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
                
                <Badge className="absolute top-4 left-4 bg-white/95 text-primary border-0 shadow-lg backdrop-blur-sm font-semibold">
                  {content.category}
                </Badge>
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {content.duration}
                </div>
              </div>
              
              <div className="p-5 bg-gradient-to-br from-white to-muted/10">
                <h4 className="mb-1.5 line-clamp-2 font-semibold">{content.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 font-medium">{content.speaker}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                      <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover/btn:bg-primary/10 transition-colors">
                        <Heart className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium">{content.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                      <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover/btn:bg-primary/10 transition-colors">
                        <MessageCircle className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium">{content.comments}</span>
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl">
                    <Share2 className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
