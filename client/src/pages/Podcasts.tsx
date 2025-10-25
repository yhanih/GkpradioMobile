import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Calendar, Search, Filter, Download, Share2 } from "lucide-react";
import { useEpisodes } from "@/hooks/useSupabase";
import { PodcastSkeleton } from "@/components/skeletons/PodcastSkeleton";

const Podcasts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch episodes using Supabase
  const { data: episodes = [], isLoading } = useEpisodes();

  const categories = ["All", "Teaching", "Prayer", "Worship", "Testimony", "Family", "Finance"];

  const filteredEpisodes = (episodes || []).filter((episode: any) => {
    const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         episode.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
                           episode.tags?.includes(selectedCategory) || 
                           episode.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <main className="pt-24">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6" data-testid="text-page-title">
                Faith-Filled Podcasts
              </h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="text-page-subtitle">
                Dive deep into God's Word with our inspiring podcast episodes
              </p>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search episodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-episodes"
                  />
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      data-testid={`button-filter-${category.toLowerCase()}`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Episodes Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <PodcastSkeleton />
            ) : filteredEpisodes.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-2xl font-semibold mb-4" data-testid="text-no-episodes">No Episodes Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== "All" 
                    ? "Try adjusting your search or filter criteria"
                    : "Check back soon for new episodes!"
                  }
                </p>
                <Button 
                  onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEpisodes.map((episode: any) => (
                  <Card key={episode.id} className="group hover:shadow-lg transition-shadow" data-testid={`card-episode-${episode.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle 
                            className="text-lg mb-2 group-hover:text-primary transition-colors"
                            data-testid={`text-episode-title-${episode.id}`}
                          >
                            {episode.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-episode-date-${episode.id}`}>
                              {formatDate(episode.publishedAt || episode.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {episode.tags && episode.tags.length > 0 ? (
                              episode.tags.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" data-testid="badge-default-category">Teaching</Badge>
                            )}
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              <span data-testid={`text-duration-${episode.id}`}>
                                {formatDuration(episode.duration || 1800)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground mb-4 line-clamp-3"
                        data-testid={`text-episode-description-${episode.id}`}
                      >
                        {episode.description || "Join us for an inspiring message from God's Word that will strengthen your faith and encourage your heart."}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-play-${episode.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play Episode
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-download-${episode.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-share-${episode.id}`}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {episode.hostName && (
                        <p 
                          className="text-xs text-muted-foreground mt-3"
                          data-testid={`text-host-${episode.id}`}
                        >
                          Hosted by {episode.hostName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Series */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12" data-testid="text-featured-series-title">
              Featured Series
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10" data-testid="card-series-kingdom">
                <CardHeader>
                  <CardTitle className="text-xl">Kingdom Principles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discover the foundational principles of God's Kingdom and how to apply them in daily life.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-view-kingdom-series"
                  >
                    View Series
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-faith-gold/10 to-primary/10" data-testid="card-series-marriage">
                <CardHeader>
                  <CardTitle className="text-xl">Marriage & Family</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Biblical wisdom for building strong marriages and raising godly families.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-view-marriage-series"
                  >
                    View Series
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-live-indicator/10 to-accent/10" data-testid="card-series-financial">
                <CardHeader>
                  <CardTitle className="text-xl">Financial Freedom</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    God's principles for managing money, debt freedom, and generous giving.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-view-financial-series"
                  >
                    View Series
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Podcasts;