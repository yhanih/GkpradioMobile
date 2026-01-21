import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, Filter, Heart, Clock, Users, ChevronDown, ChevronUp, Reply, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import CreateDiscussionButton from "@/components/CreateDiscussionButton";

import { useToast } from "@/hooks/use-toast";
import { 
  useCommunityThreads, 
  useCommunityComments,
  useCreateComment,
  useCommunityStats,
  useToggleThreadLike,
  useDeleteThread,
  useDeleteComment
} from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";

const CommunitySupabase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("recent");
  const [expandedDiscussions, setExpandedDiscussions] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserIntId, setCurrentUserIntId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to format user identity consistently
  const formatUserIdentity = (authorInfo: any) => {
    if (!authorInfo) return "Anonymous Member";
    
    // If fullname is already in correct format (username@location), use it
    if (authorInfo.fullname && authorInfo.fullname.includes('@')) {
      return authorInfo.fullname;
    }
    
    // Otherwise construct from available data
    const username = authorInfo.username || `User${authorInfo.id || 'Member'}`;
    
    if (authorInfo.fullname) {
      return authorInfo.fullname;
    } else {
      return `${username}@Community`;
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Recently";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString();
  };

  // Helper function for Instagram-like avatar display
  const getUserAvatarContent = (authorInfo: any) => {
    if (!authorInfo) return 'U';
    
    // Try to get first letter from fullname, username, or fallback
    if (authorInfo.fullname) {
      return authorInfo.fullname.charAt(0).toUpperCase();
    } else if (authorInfo.username) {
      return authorInfo.username.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
  };


  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get current user from Supabase auth and their integer ID
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user?.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        
        setCurrentUserIntId(dbUser?.id || null);
      } else {
        setCurrentUserIntId(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setCurrentUser(session?.user || null);
      
      if (session?.user?.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
        
        setCurrentUserIntId(dbUser?.id || null);
      } else {
        setCurrentUserIntId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch community threads using Supabase
  const { data: allThreads = [], isLoading, error } = useCommunityThreads(
    selectedCategory === "All" ? undefined : selectedCategory
  );

  // Filter and sort threads based on search and tab
  const getDiscussionsForTab = (tab: string) => {
    if (!Array.isArray(allThreads)) return [];
    
    // Filter by search query
    let filtered = allThreads;
    if (debouncedSearchQuery) {
      filtered = allThreads.filter((thread: any) => 
        thread.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }
    
    // Sort by tab
    switch (tab) {
      case "popular":
        return [...filtered].sort((a: any, b: any) => (b.viewCount + b.replyCount) - (a.viewCount + a.replyCount));
      case "unanswered":
        return filtered.filter((d: any) => d.replyCount === 0);
      case "following":
        // This would require tracking user follows - for now show all
        return filtered;
      case "recent":
      default:
        return filtered;
    }
  };

  const discussions = getDiscussionsForTab(activeTab);

  // Fetch community stats using Supabase
  const { data: communityStats, isLoading: statsLoading } = useCommunityStats();

  // Calculate real-time stats from discussions data for consistency
  const realTimeStats = {
    totalDiscussions: allThreads?.length || 0,
    totalMembers: communityStats?.activeMembers || 0,
    totalPrayers: communityStats?.totalComments || 0,
    totalComments: communityStats?.totalComments || 0,
    onlineNow: communityStats?.onlineNow || 0
  };

  // Base categories structure
  const baseCategories = [
    { name: "All", icon: "🌟" },
    { name: "Prayer Requests", icon: "🙏" },
    { name: "Testimonies", icon: "✨" },
    { name: "Pray for Others", icon: "❤️" },
    { name: "Youth Voices", icon: "🎓" },
    { name: "Praise & Worship", icon: "🎵" },
    { name: "To My Husband", icon: "💙" },
    { name: "To My Wife", icon: "💖" },
    { name: "Words of Encouragement", icon: "💪" },
    { name: "Born Again", icon: "✝️" },
    { name: "Bragging on My Child (ren)", icon: "👶" },
    { name: "Sharing Hobbies", icon: "🎨" },
    { name: "Money & Finances", icon: "💰" },
    { name: "Physical & Mental Health", icon: "🏥" },
  ];

  // Calculate dynamic category counts from discussions data
  const categories = baseCategories.map(baseCategory => {
    if (baseCategory.name === "All") {
      return { ...baseCategory, count: allThreads?.length || 0 };
    }
    const count = allThreads?.filter((d: any) => d.category === baseCategory.name).length || 0;
    return { ...baseCategory, count };
  });


  // Toggle expanded discussion view
  const toggleDiscussionExpansion = (discussionId: string) => {
    const newExpanded = new Set(expandedDiscussions);
    if (newExpanded.has(discussionId)) {
      newExpanded.delete(discussionId);
      setReplyingTo(null);
    } else {
      newExpanded.add(discussionId);
    }
    setExpandedDiscussions(newExpanded);
  };

  // Reply to discussion
  const startReply = (discussionId: string) => {
    setReplyingTo(discussionId);
    if (!expandedDiscussions.has(discussionId)) {
      toggleDiscussionExpansion(discussionId);
    }
  };

  // Reply mutation using Supabase
  const replyMutation = useCreateComment();
  const likeMutation = useToggleThreadLike();
  const deleteMutation = useDeleteThread();

  const handleReply = () => {
    if (!currentUser) {
      toast({
        title: "Please Login First",
        description: "You need to sign in to reply.",
        variant: "destructive",
      });
      return;
    }

    if (!replyingTo || !replyContent.trim()) return;

    replyMutation.mutate(
      {
        threadId: replyingTo,
        content: replyContent,
      },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyingTo(null);
        }
      }
    );
  };

  const handleLikeToggle = async (discussionId: string) => {
    if (!currentUser) {
      toast({
        title: "Please Login First",
        description: "You need to sign in to like discussions.",
        variant: "destructive",
      });
      return;
    }

    likeMutation.mutate(discussionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <AudioPlayer />
      <main className="pt-24">
        {/* Main Content Area */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Sidebar - Categories */}
              <div className="lg:w-64">
                <Card className="sticky top-20">
                  <CardHeader>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Categories
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => setSelectedCategory(category.name)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                            selectedCategory === category.name
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          data-testid={`button-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm">{category.name}</span>
                          </span>
                          {category.count > 0 && (
                            <Badge 
                              variant={selectedCategory === category.name ? "secondary" : "outline"}
                              className="ml-2"
                            >
                              {category.count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                {/* Search Bar and Actions */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-discussions"
                      />
                    </div>
                    <CreateDiscussionButton />
                  </div>

                  {/* Enhanced Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                      <TabsTrigger value="recent" data-testid="tab-recent">
                        <Clock className="w-4 h-4 mr-2" />
                        Recent
                      </TabsTrigger>
                      <TabsTrigger value="popular" data-testid="tab-popular">
                        <Heart className="w-4 h-4 mr-2" />
                        Popular
                      </TabsTrigger>
                      <TabsTrigger value="unanswered" data-testid="tab-unanswered">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Unanswered
                      </TabsTrigger>
                      <TabsTrigger value="following" data-testid="tab-following">
                        <Users className="w-4 h-4 mr-2" />
                        Following
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Discussions List */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                          <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                          <div className="h-3 bg-muted rounded w-full mb-2" />
                          <div className="h-3 bg-muted rounded w-5/6" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : discussions.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No Discussions Found</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery || selectedCategory !== "All"
                          ? "Try adjusting your search or filter criteria"
                          : "Be the first to start a discussion in this category!"}
                      </p>
                      {currentUser && <CreateDiscussionButton />}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((discussion: any) => (
                      <Card 
                        key={discussion.id} 
                        className="hover:shadow-lg transition-all duration-200"
                        data-testid={`card-discussion-${discussion.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 
                                className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer"
                                onClick={() => toggleDiscussionExpansion(discussion.id)}
                                data-testid={`text-discussion-title-${discussion.id}`}
                              >
                                {discussion.title}
                                {discussion.taggedSpouseId && (
                                  <span className="ml-2 inline-flex items-center">
                                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {discussion.content}
                              </p>
                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <Badge variant="secondary" data-testid={`badge-category-${discussion.id}`}>
                                  {discussion.category}
                                </Badge>
                                {discussion.taggedSpouse && (
                                  <Badge variant="outline" className="border-red-300 text-red-600">
                                    <Heart className="w-3 h-3 mr-1 fill-current" />
                                    To {discussion.taggedSpouse.fullname || discussion.taggedSpouse.username}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-semibold">
                                    {getUserAvatarContent(discussion.author)}
                                  </div>
                                  <span data-testid={`text-author-${discussion.id}`}>
                                    {formatUserIdentity(discussion.author)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(discussion.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeToggle(discussion.id)}
                              data-testid={`button-like-${discussion.id}`}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${discussion.isLiked ? "fill-current text-red-500" : ""}`} />
                              {discussion.likeCount || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startReply(discussion.id)}
                              data-testid={`button-reply-${discussion.id}`}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Reply ({discussion.replyCount || 0})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDiscussionExpansion(discussion.id)}
                              data-testid={`button-expand-${discussion.id}`}
                            >
                              {expandedDiscussions.has(discussion.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            
                            {currentUserIntId && discussion.author?.id === currentUserIntId && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    data-testid={`button-delete-thread-${discussion.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this discussion? This action cannot be undone. All comments will also be deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(discussion.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                      data-testid="button-confirm-delete"
                                    >
                                      {deleteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          {/* Comments Section */}
                          {expandedDiscussions.has(discussion.id) && (
                            <div className="mt-4 space-y-4">
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3">Replies</h4>
                                <CommentsSection threadId={discussion.id} currentUserIntId={currentUserIntId} />
                              </div>
                              
                              {/* Reply Input */}
                              {replyingTo === discussion.id && (
                                <div className="mt-4 space-y-2">
                                  <Textarea
                                    placeholder="Write your reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="min-h-[100px]"
                                    data-testid={`textarea-reply-${discussion.id}`}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent("");
                                      }}
                                      data-testid={`button-cancel-reply-${discussion.id}`}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleReply}
                                      disabled={!replyContent.trim() || replyMutation.isPending}
                                      data-testid={`button-submit-reply-${discussion.id}`}
                                    >
                                      {replyMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4 mr-1" />
                                          Reply
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({ threadId, currentUserIntId }: { threadId: string; currentUserIntId: number | null }) => {
  const { data: comments = [], isLoading } = useCommunityComments(threadId);
  const deleteCommentMutation = useDeleteComment();

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Recently";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString();
  };

  const formatUserIdentity = (authorInfo: any) => {
    if (!authorInfo) return "Anonymous Member";
    
    // If fullname is already in correct format (username@location), use it
    if (authorInfo.fullname && authorInfo.fullname.includes('@')) {
      return authorInfo.fullname;
    }
    
    // Otherwise construct from available data
    const username = authorInfo.username || `User${authorInfo.id || 'Member'}`;
    
    if (authorInfo.fullname) {
      return authorInfo.fullname;
    } else {
      return `${username}@Community`;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No replies yet. Be the first to respond!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment: any) => (
        <div key={comment.id} className="pl-4 border-l-2 border-muted">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" data-testid={`text-comment-author-${comment.id}`}>
                {formatUserIdentity(comment.author)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            {currentUserIntId && (comment.userId === currentUserIntId || comment.author?.id === currentUserIntId) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    data-testid={`button-delete-comment-${comment.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete reply?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this reply? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCommentMutation.mutate({ commentId: comment.id, threadId })}
                      className="bg-destructive hover:bg-destructive/90"
                      data-testid={`button-confirm-delete-comment-${comment.id}`}
                    >
                      {deleteCommentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <p className="text-sm" data-testid={`text-comment-content-${comment.id}`}>
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CommunitySupabase;