import { ImageWithFallback } from './figma/ImageWithFallback';
import { Play, Clock, Download, Share2, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function PodcastsScreen() {
  const series = [
    {
      id: 1,
      title: 'Kingdom Principles',
      episodes: 24,
      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2RjYXN0JTIwbWljcm9waG9uZXxlbnwxfHx8fDE3NjA4NjkzNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 2,
      title: 'Marriage & Family',
      episodes: 18,
      image: 'https://images.unsplash.com/photo-1629143949694-606987575b07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwcHJhaXNlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 3,
      title: 'Financial Freedom',
      episodes: 15,
      image: 'https://images.unsplash.com/photo-1612350275854-f96a246cfc2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmF5ZXIlMjBoYW5kcyUyMGJpYmxlfGVufDF8fHx8MTc2MDkwMTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const recentEpisodes = [
    {
      id: 1,
      title: 'Walking in Faith: Understanding God\'s Timing',
      series: 'Kingdom Principles',
      speaker: 'Pastor James Williams',
      duration: '45:32',
      date: 'Oct 18, 2025',
      plays: '2.3K',
      trending: true,
    },
    {
      id: 2,
      title: 'Building a Strong Prayer Life',
      series: 'Kingdom Principles',
      speaker: 'Pastor James Williams',
      duration: '38:15',
      date: 'Oct 15, 2025',
      plays: '1.8K',
      trending: false,
    },
    {
      id: 3,
      title: 'Communication in Marriage',
      series: 'Marriage & Family',
      speaker: 'Dr. Sarah Johnson',
      duration: '42:20',
      date: 'Oct 12, 2025',
      plays: '1.5K',
      trending: false,
    },
    {
      id: 4,
      title: 'Breaking Free from Debt',
      series: 'Financial Freedom',
      speaker: 'Elder David Thompson',
      duration: '51:10',
      date: 'Oct 10, 2025',
      plays: '2.1K',
      trending: true,
    },
  ];

  return (
    <div className="pb-32 bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative text-white px-5 py-6">
          <h2 className="text-[21px] font-semibold mb-2">Podcasts</h2>
          <p className="text-[15px] text-white/90 leading-relaxed">
            Listen to inspiring messages anytime, anywhere
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="w-full mb-6 bg-muted/50 p-1 rounded-xl backdrop-blur-sm">
            <TabsTrigger value="recent" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">Recent</TabsTrigger>
            <TabsTrigger value="series" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">Series</TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-3 mt-0">
            {recentEpisodes.map((episode) => (
              <Card key={episode.id} className="p-4 hover:shadow-lg transition-all border-border/50 bg-gradient-to-br from-white to-muted/10 group cursor-pointer">
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <div className="h-16 w-16 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Play className="h-7 w-7 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {episode.trending && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[11px] mb-1.5 font-medium border-border/50">
                      {episode.series}
                    </Badge>
                    <h4 className="mb-1.5 line-clamp-2 font-semibold group-hover:text-primary transition-colors">{episode.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">
                      {episode.speaker}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{episode.duration}</span>
                      </div>
                      <span>•</span>
                      <span>{episode.plays} plays</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl">
                      <Download className="h-4 w-4" strokeWidth={2} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl">
                      <Share2 className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="series" className="mt-0">
            <div className="space-y-4">
              {series.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all border-border/50 group">
                  <div className="relative h-44 overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <h4 className="text-white mb-1.5 font-semibold text-[17px]">{item.title}</h4>
                      <p className="text-white/90 text-sm font-medium">{item.episodes} Episodes</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white to-muted/10">
                    <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 rounded-xl font-semibold">
                      <Play className="h-4 w-4 mr-2" fill="white" />
                      Play Series
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="text-center py-16 px-5">
              <div className="h-20 w-20 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Download className="h-9 w-9 text-muted-foreground" strokeWidth={2} />
              </div>
              <h3 className="mb-2 font-semibold text-[17px]">No saved episodes yet</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Download episodes to listen offline anytime
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
