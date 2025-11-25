import { MessageCircle, Heart, TrendingUp, Plus, Flame } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'sonner@2.0.3';

interface CommunityScreenProps {
  onNavigateToProfile?: () => void;
}

export function CommunityScreen({ onNavigateToProfile }: CommunityScreenProps) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscussions();
  }, []);

  async function loadDiscussions() {
    try {
      setLoading(true);
      const data = await apiCall('/discussions');
      setDiscussions(data);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(discussionId: number) {
    try {
      const result = await apiCall(`/discussions/${discussionId}/like`, { method: 'POST' });
      setDiscussions(prev => 
        prev.map(item => 
          item.id === discussionId ? { ...item, likes: result.likes } : item
        )
      );
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  }

  const handleStartDiscussion = () => {
    if (!user) {
      toast.info('Please sign in to start a discussion', {
        action: {
          label: 'Sign In',
          onClick: () => onNavigateToProfile?.(),
        },
      });
    } else {
      // Future: Open discussion creation dialog
      toast.info('Discussion creation coming soon!');
    }
  };

  const categories = [
    { name: 'Prayer Requests', count: 234, icon: '🙏', color: 'from-blue-500 to-blue-600' },
    { name: 'Testimonies', count: 189, icon: '✨', color: 'from-purple-500 to-purple-600' },
    { name: 'Youth Voices', count: 156, icon: '🎤', color: 'from-pink-500 to-pink-600' },
    { name: 'Praise & Worship', count: 98, icon: '🎵', color: 'from-primary to-emerald-600' },
    { name: 'Bible Study', count: 145, icon: '📖', color: 'from-orange-500 to-orange-600' },
    { name: 'Marriage & Family', count: 87, icon: '💑', color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="pb-32">
      {/* Header Section with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-500 to-teal-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.15),transparent_60%)]"></div>
        
        <div className="relative text-white px-5 py-6">
          <h2 className="text-[21px] font-semibold mb-2">Ministry Fields</h2>
          <p className="text-[15px] text-white/90 mb-5 leading-relaxed">
            A space to share stories, request prayers, and grow together in faith
          </p>
          <Button 
            onClick={handleStartDiscussion}
            className="w-full bg-white/90 text-primary hover:bg-white hover:scale-[1.01] h-12 shadow-2xl shadow-black/20 backdrop-blur-md transition-all rounded-2xl font-semibold border border-white/20"
          >
            <Plus className="h-5 w-5 mr-2" strokeWidth={2.5} />
            Start a Discussion
          </Button>
        </div>
      </div>

      {/* Community Stats with Glass */}
      <div className="px-5 py-5 bg-white/60 backdrop-blur-xl border-y border-white/30">
        <div className="flex items-center justify-around text-center">
          <div className="group cursor-pointer">
            <p className="text-[21px] font-bold bg-gradient-to-br from-primary to-emerald-600 bg-clip-text text-transparent">2.5K</p>
            <p className="text-xs text-muted-foreground font-medium">Members</p>
          </div>
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
          <div className="group cursor-pointer">
            <p className="text-[21px] font-bold bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent">8.2K</p>
            <p className="text-xs text-muted-foreground font-medium">Messages</p>
          </div>
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
          <div className="group cursor-pointer">
            <p className="text-[21px] font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">24/7</p>
            <p className="text-xs text-muted-foreground font-medium">Support</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 py-7">
        <h3 className="mb-4 text-[17px] font-semibold">Discussion Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <div
              key={index}
              className="p-5 hover:scale-[1.02] transition-all cursor-pointer bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`bg-gradient-to-br ${category.color} h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <Badge variant="secondary" className="text-xs font-semibold shadow-sm bg-white/80 backdrop-blur-sm">
                  {category.count}
                </Badge>
              </div>
              <p className="font-semibold text-[15px]">{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Discussions */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-semibold">Recent Discussions</h3>
          <Button variant="ghost" className="h-auto p-0 text-primary text-sm font-semibold hover:underline">
            View All
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="p-5 hover:scale-[1.01] transition-all group cursor-pointer bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white font-semibold">
                      {discussion.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[15px]">{discussion.author}</p>
                      {discussion.trending && (
                        <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          <Flame className="h-3 w-3" fill="currentColor" />
                          <span className="text-[10px] font-bold">HOT</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[11px] px-2 py-0 font-medium border-white/30 bg-white/40 backdrop-blur-sm">
                        {discussion.category}
                      </Badge>
                      <span>•</span>
                      <span className="font-medium">{discussion.time}</span>
                    </div>
                  </div>
                </div>

                <h4 className="mb-2 font-semibold group-hover:text-primary transition-colors">{discussion.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {discussion.excerpt}
                </p>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                    <div className="h-8 w-8 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20 transition-all">
                      <MessageCircle className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium">{discussion.replies}</span>
                  </button>
                  <button 
                    onClick={() => handleLike(discussion.id)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20 transition-all">
                      <Heart className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium">{discussion.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}