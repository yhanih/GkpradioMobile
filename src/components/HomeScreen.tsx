import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, MessageCircle, Share2, Users, MessageSquare, HandHeart, Play, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

export function HomeScreen() {
  const [stats, setStats] = useState({ members: '2.5K', messages: '8.2K', prayers: '45K' });
  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, contentData] = await Promise.all([
        apiCall('/stats'),
        apiCall('/featured-content')
      ]);
      setStats(statsData);
      setFeaturedContent(contentData);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(contentId: number) {
    try {
      const result = await apiCall(`/content/${contentId}/like`, { method: 'POST' });
      setFeaturedContent(prev => 
        prev.map(item => 
          item.id === contentId ? { ...item, likes: result.likes } : item
        )
      );
    } catch (error) {
      console.error('Error liking content:', error);
    }
  }

  const statsDisplay = [
    { label: 'Members', value: stats.members, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Messages', value: stats.messages, icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { label: 'Prayers', value: stats.prayers, icon: HandHeart, color: 'from-primary to-emerald-600' },
  ];

  if (loading) {
    return (
      <div className="pb-32 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Hero Section with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-500 to-teal-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]"></div>
        
        <div className="relative text-white px-5 pt-6 pb-8">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center ring-1 ring-white/20 shadow-2xl">
                <span className="text-white text-xl font-semibold">GKP</span>
              </div>
              <div>
                <h2 className="text-[21px] font-semibold mb-0.5">Welcome back!</h2>
                <p className="text-sm text-white/80">Kingdom Principles Radio</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-white/60" />
          </div>
          
          <p className="text-[15px] text-white/90 mb-5 leading-relaxed">
            Broadcasting Truth • Building Community • Transforming Lives
          </p>
          
          <Button className="w-full bg-white/90 text-primary hover:bg-white hover:scale-[1.01] h-12 shadow-2xl shadow-black/20 backdrop-blur-md transition-all rounded-2xl font-semibold border border-white/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              Listen Live Now
            </div>
          </Button>
        </div>
      </div>

      {/* Stats with Glass Cards */}
      <div className="px-5 -mt-6 mb-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-2xl shadow-black/8 border border-white/40">
          <div className="grid grid-cols-3 gap-4">
            {statsDisplay.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group cursor-pointer">
                  <div className={`bg-gradient-to-br ${stat.color} h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-black/10 group-hover:scale-110 group-hover:shadow-xl transition-all`}>
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
          <div className="p-5 hover:scale-[1.02] transition-all cursor-pointer bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
            <div className="h-11 w-11 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <MessageCircle className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-[15px] mb-1">Prayer Request</p>
            <p className="text-xs text-muted-foreground">Share your needs</p>
          </div>
          
          <div className="p-5 hover:scale-[1.02] transition-all cursor-pointer bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
            <div className="h-11 w-11 bg-gradient-to-br from-purple-500/15 to-purple-500/5 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <Heart className="h-5 w-5 text-purple-500" strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-[15px] mb-1">Testimony</p>
            <p className="text-xs text-muted-foreground">Share God's work</p>
          </div>
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
            <div key={content.id} className="overflow-hidden hover:scale-[1.01] transition-all group bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
              <div className="relative h-52 overflow-hidden">
                <ImageWithFallback
                  src={content.image}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-16 w-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                    <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
                
                <Badge className="absolute top-4 left-4 bg-white/90 text-primary border-0 shadow-lg backdrop-blur-md font-semibold">
                  {content.category}
                </Badge>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                  {content.duration}
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="mb-1.5 line-clamp-2 font-semibold">{content.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 font-medium">{content.speaker}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(content.id)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn"
                    >
                      <div className="h-8 w-8 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20 transition-all">
                        <Heart className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium">{content.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                      <div className="h-8 w-8 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20 transition-all">
                        <MessageCircle className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium">{content.comments}</span>
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-2xl">
                    <Share2 className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}