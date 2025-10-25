import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  id: number;
  type: "episode" | "community" | "video" | "live";
  title: string;
  description: string;
  category?: string;
  author?: string;
  duration?: string;
  timestamp?: string;
}

const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);

  // Fetch search results from API
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/search', { query: searchQuery, type: filters.length > 0 ? filters.join(',') : 'all' }],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const filterParam = filters.length > 0 ? filters.join(',') : 'all';
      return await apiRequest(`/api/search?query=${encodeURIComponent(searchQuery)}&type=${filterParam}&limit=20`);
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2, // Cache results for 2 minutes
  });

  // Results are already filtered by the API, no need for client-side filtering
  const filteredResults = searchResults;

  const toggleFilter = (filterType: string) => {
    setFilters(prev => 
      prev.includes(filterType) 
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "episode": return "🎧";
      case "community": return "💬";
      case "video": return "📺";
      case "live": return "🔴";
      default: return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "episode": return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "community": return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "video": return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      case "live": return "bg-red-500/20 text-red-700 dark:text-red-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex">
          <Search className="w-4 h-4 mr-2" />
          Search...
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Search GKP Radio</DialogTitle>
          <DialogDescription>
            Find episodes, community discussions, videos, and live content across our platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search episodes, discussions, videos, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Filter by:</span>
            {["episode", "community", "video", "live"].map((type) => (
              <Button
                key={type}
                variant={filters.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(type)}
                className="text-xs capitalize"
              >
                {getTypeIcon(type)} {type}s
              </Button>
            ))}
            {filters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters([])}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchQuery.length > 0 ? (
              filteredResults.length > 0 ? (
                filteredResults.map((result: SearchResult) => (
                  <Card key={result.id} className="card-hover cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{getTypeIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" className={`text-xs ${getTypeColor(result.type)}`}>
                              {result.type}
                            </Badge>
                            {result.category && (
                              <Badge variant="outline" className="text-xs">
                                {result.category}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-base mb-1 line-clamp-1">
                            {result.title}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {result.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{result.author}</span>
                            <span>{result.duration || result.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm">Try searching with different keywords</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search across all content</p>
                <p className="text-sm">Find episodes, discussions, videos, and live streams</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {searchQuery.length === 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Episodes
                </Button>
                <Button variant="outline" className="justify-start">
                  <Search className="w-4 h-4 mr-2" />
                  Join Discussions
                </Button>
                <Button variant="outline" className="justify-start">
                  <Search className="w-4 h-4 mr-2" />
                  Watch Videos
                </Button>
                <Button variant="outline" className="justify-start">
                  <Search className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchComponent;