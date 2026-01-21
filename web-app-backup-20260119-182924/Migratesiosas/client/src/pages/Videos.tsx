import { useState } from "react";
import { Play, Eye, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { useVideos } from "@/hooks/useSupabase";

interface Video {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  views: number | null;
  likes: number | null;
  category: string | null;
  uploadDate: string | null;
  thumbnail: string | null;
  videoUrl: string | null;
  isNew: boolean | null;
  isFeatured: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

interface Category {
  name: string;
  count: number;
}

const Videos = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  // Fetch videos directly from Supabase
  const { data: videos, isLoading: videosLoading, error: videosError } = useVideos();

  // Get unique categories from videos
  const categoriesData: Category[] = (videos || []).reduce((acc: Category[], video: Video) => {
    if (video.category) {
      const existing = acc.find((c: Category) => c.name === video.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: video.category, count: 1 });
      }
    }
    return acc;
  }, []);

  // Add "All" option to categories with total count
  const categories = [
    { name: "All", count: videos?.length || 0 },
    ...categoriesData.sort((a, b) => a.name.localeCompare(b.name))
  ];

  // Helper function to format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const categoryColors = {
    "Worship": "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    "Youth": "bg-green-500/20 text-green-700 dark:text-green-300",
    "Healing": "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    "Teachings": "bg-orange-500/20 text-orange-700 dark:text-orange-300"
  };

  // Filter and sort videos based on current state
  const filteredVideos = (videos || [])
    .filter((video: Video) => {
      if (selectedCategory !== 'All' && video.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          video.title?.toLowerCase().includes(query) ||
          video.description?.toLowerCase().includes(query) ||
          video.category?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a: Video, b: Video) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.uploadDate || b.createdAt || 0).getTime() - new Date(a.uploadDate || a.createdAt || 0).getTime();
        case 'popular':
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'trending':
          // Trending could be a combination of views and recency
          const aScore = (a.views || 0) + (a.likes || 0) * 2;
          const bScore = (b.views || 0) + (b.likes || 0) * 2;
          return bScore - aScore;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos, sermons, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-videos"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40" data-testid="select-sort-videos">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="likes">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {videosLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))
          ) : (
            categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(category.name)}
                data-testid={`button-category-${category.name.toLowerCase()}`}
              >
                {category.name} ({category.count})
              </Button>
            ))
          )}
        </div>

        {/* Video Grid */}
        <div className="space-y-6">
          {/* Loading State */}
          {videosLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {videosError && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Failed to load videos. Please try again.</p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          )}

          {/* Videos Grid */}
          {!videosLoading && !videosError && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-4">No videos found matching your criteria.</p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredVideos.map((video: Video) => (
                  <Card key={video.id} className="card-hover group cursor-pointer overflow-hidden" data-testid={`card-video-${video.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-accent/20 to-primary/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/60 group-hover:bg-primary/70 transition-colors"></div>
                      <Button 
                        size="lg" 
                        className="btn-faith-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"
                        data-testid={`button-play-${video.id}`}
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                      
                      {/* Duration Badge */}
                      {video.duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                          {formatDuration(video.duration)}
                        </Badge>
                      )}
                      
                      {/* New Badge */}
                      {video.isNew && (
                        <Badge className="absolute top-2 left-2 bg-live-indicator text-live-foreground">
                          NEW
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Category */}
                        {video.category && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${categoryColors[video.category as keyof typeof categoryColors] || 'bg-secondary'}`}
                          >
                            {video.category}
                          </Badge>
                        )}
                        
                        {/* Title */}
                        <h3 className="font-serif font-bold text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2" data-testid={`text-title-${video.id}`}>
                          {video.title}
                        </h3>
                        
                        {/* Description */}
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1" data-testid={`text-views-${video.id}`}>
                              <Eye className="w-4 h-4" />
                              <span>{video.views?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1" data-testid={`text-likes-${video.id}`}>
                              <Heart className="w-4 h-4" />
                              <span>{video.likes || 0}</span>
                            </div>
                          </div>
                          <span data-testid={`text-date-${video.id}`}>
                            {video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default Videos;