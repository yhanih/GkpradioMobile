import { ImageWithFallback } from './figma/ImageWithFallback';
import { Play, Eye, ThumbsUp, Share2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function VideoScreen() {
  const videos = [
    {
      id: 1,
      title: 'Sunday Service - Walking in Victory',
      thumbnail: 'https://images.unsplash.com/photo-1629143949694-606987575b07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwcHJhaXNlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      duration: '1:45:20',
      views: '3.2K',
      likes: 245,
      category: 'Service',
      date: 'Oct 19, 2025',
      live: false,
    },
    {
      id: 2,
      title: 'Wednesday Bible Study - Romans 8',
      thumbnail: 'https://images.unsplash.com/photo-1612350275854-f96a246cfc2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmF5ZXIlMjBoYW5kcyUyMGJpYmxlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      duration: '52:15',
      views: '1.8K',
      likes: 167,
      category: 'Bible Study',
      date: 'Oct 17, 2025',
      live: false,
    },
    {
      id: 3,
      title: 'Praise & Worship Night',
      thumbnail: 'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      duration: '1:15:30',
      views: '2.5K',
      likes: 312,
      category: 'Worship',
      date: 'Oct 15, 2025',
      live: false,
    },
    {
      id: 4,
      title: 'Youth Conference 2025 - Day 1',
      thumbnail: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2RjYXN0JTIwbWljcm9waG9uZXxlbnwxfHx8fDE3NjA4NjkzNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      duration: '2:10:45',
      views: '4.1K',
      likes: 428,
      category: 'Conference',
      date: 'Oct 12, 2025',
      live: false,
    },
  ];

  return (
    <div className="pb-32 bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative text-white px-5 py-6">
          <h2 className="text-[21px] font-semibold mb-2">Video Messages</h2>
          <p className="text-[15px] text-white/90 leading-relaxed">
            Watch services, teachings, and special events
          </p>
        </div>
      </div>

      {/* Live Now Banner */}
      <div className="px-5 pt-6 pb-4">
        <Card className="overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl shadow-red-500/20">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm font-bold">LIVE NOW</Badge>
            </div>
            <h3 className="mb-1.5 font-semibold text-[17px]">Sunday Morning Service</h3>
            <p className="text-sm text-white/90 mb-4">Join us live as we worship together</p>
            <Button className="w-full bg-white/95 text-red-600 hover:bg-white hover:scale-[1.02] h-11 shadow-xl transition-all rounded-xl font-semibold">
              <Play className="h-4 w-4 mr-2" fill="currentColor" />
              Watch Live
            </Button>
          </div>
        </Card>
      </div>

      {/* Video Categories */}
      <div className="px-5 pb-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Services', 'Bible Study', 'Worship', 'Conferences', 'Testimonies'].map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              className={`flex-shrink-0 rounded-xl font-semibold ${
                category === 'All' 
                  ? 'bg-primary shadow-lg shadow-primary/25' 
                  : 'border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-5 space-y-4">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-xl transition-all border-border/50 group">
            <div className="relative overflow-hidden">
              <div className="relative h-56">
                <ImageWithFallback
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
                
                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {video.duration}
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-white to-muted/10">
              <Badge variant="outline" className="text-[11px] mb-2.5 font-medium border-border/50">
                {video.category}
              </Badge>
              <h4 className="mb-2 font-semibold group-hover:text-primary transition-colors">{video.title}</h4>
              <p className="text-sm text-muted-foreground mb-4 font-medium">{video.date}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                    <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover/btn:bg-primary/10 transition-colors">
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium">{video.views}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                    <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover/btn:bg-primary/10 transition-colors">
                      <ThumbsUp className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium">{video.likes}</span>
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
  );
}
