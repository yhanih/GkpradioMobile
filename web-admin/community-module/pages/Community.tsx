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

// Module internal imports
import CreateDiscussionButton from "../components/CreateDiscussionButton";
import {
    useCommunityThreads,
    useCommunityComments,
    useCreateComment,
    useCommunityStats,
    useToggleThreadLike,
    useDeleteThread,
    useDeleteComment
} from "../hooks/useCommunity";

// External components (assumed available in destination project)
// Header, Footer, AudioPlayer are usually app-level layouts.
// If not available, replace with appropriate placeholders or remove.
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Community = () => {
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

    // Helper function to format user identity consistently
    const formatUserIdentity = (authorInfo: any) => {
        if (!authorInfo) return "Anonymous Member";
        if (authorInfo.fullname && authorInfo.fullname.includes('@')) return authorInfo.fullname;
        const username = authorInfo.username || `User${authorInfo.id || 'Member'}`;
        return authorInfo.fullname || `${username}@Community`;
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
        const name = authorInfo.fullname || authorInfo.username || 'U';
        return name.charAt(0).toUpperCase();
    };

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get current user
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

    const { data: allThreads = [], isLoading } = useCommunityThreads(
        selectedCategory === "All" ? undefined : selectedCategory
    );

    const getDiscussionsForTab = (tab: string) => {
        if (!Array.isArray(allThreads)) return [];
        let filtered = allThreads;
        if (debouncedSearchQuery) {
            filtered = allThreads.filter((thread: any) =>
                thread.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                thread.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            );
        }

        switch (tab) {
            case "popular":
                return [...filtered].sort((a: any, b: any) => (b.viewCount + b.replyCount) - (a.viewCount + a.replyCount));
            case "unanswered":
                return filtered.filter((d: any) => d.replyCount === 0);
            case "following":
                return filtered;
            case "recent":
            default:
                return filtered;
        }
    };

    const discussions = getDiscussionsForTab(activeTab);
    const { data: communityStats } = useCommunityStats();

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

    const categories = baseCategories.map(baseCategory => {
        if (baseCategory.name === "All") return { ...baseCategory, count: allThreads?.length || 0 };
        const count = allThreads?.filter((d: any) => d.category === baseCategory.name).length || 0;
        return { ...baseCategory, count };
    });

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

    const startReply = (discussionId: string) => {
        setReplyingTo(discussionId);
        if (!expandedDiscussions.has(discussionId)) toggleDiscussionExpansion(discussionId);
    };

    const replyMutation = useCreateComment();
    const likeMutation = useToggleThreadLike();
    const deleteMutation = useDeleteThread();

    const handleReply = () => {
        if (!currentUser) {
            toast({ title: "Please Login First", description: "You need to sign in to reply.", variant: "destructive" });
            return;
        }
        if (!replyingTo || !replyContent.trim()) return;

        replyMutation.mutate(
            { threadId: replyingTo, content: replyContent },
            { onSuccess: () => { setReplyContent(""); setReplyingTo(null); } }
        );
    };

    const handleLikeToggle = (discussionId: string) => {
        if (!currentUser) {
            toast({ title: "Please Login First", description: "You need to sign in to like discussions.", variant: "destructive" });
            return;
        }
        likeMutation.mutate(discussionId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
            <Header />
            <AudioPlayer />
            <main className="pt-24 pb-16">
                <section className="py-8">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Sidebar - Categories */}
                            <div className="lg:w-72">
                                <Card className="sticky top-28 border-none shadow-premium bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="pb-4">
                                        <h3 className="font-serif font-bold text-xl flex items-center gap-2 text-primary">
                                            <Filter className="w-5 h-5 text-accent" />
                                            Ministry Fields
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1.5">
                                            {categories.map((category) => (
                                                <button
                                                    key={category.name}
                                                    onClick={() => setSelectedCategory(category.name)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-between group ${selectedCategory === category.name
                                                        ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                                                        : "hover:bg-accent/10 text-muted-foreground hover:text-accent"
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="text-xl group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                                                        <span className="text-sm font-medium tracking-tight">{category.name}</span>
                                                    </span>
                                                    {category.count > 0 && (
                                                        <Badge
                                                            variant={selectedCategory === category.name ? "secondary" : "outline"}
                                                            className={`ml-2 rounded-full px-2 min-w-[20px] justify-center ${selectedCategory === category.name ? "bg-white/20 border-none" : "border-accent/20 text-accent"
                                                                }`}
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
                                <div className="mb-8 space-y-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="text-left w-full">
                                            <h1 className="font-serif font-bold text-3xl md:text-4xl text-primary mb-2">Community Conversations</h1>
                                            <p className="text-muted-foreground">Share your journey, find support, and grow in faith with fellow believers.</p>
                                        </div>
                                        <CreateDiscussionButton />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 relative group">
                                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors w-5 h-5" />
                                            <Input
                                                placeholder="Search for prayers, testimonies, or discussions..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-12 py-6 bg-card border-none shadow-sm rounded-2xl focus-visible:ring-accent transition-all hover:shadow-md"
                                            />
                                        </div>
                                    </div>

                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <TabsList className="flex w-full overflow-x-auto h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-2xl gap-1 no-scrollbar">
                                            <TabsTrigger value="recent" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-accent">
                                                <Clock className="w-4 h-4 mr-2" />
                                                Recent
                                            </TabsTrigger>
                                            <TabsTrigger value="popular" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-accent">
                                                <Heart className="w-4 h-4 mr-2" />
                                                Popular
                                            </TabsTrigger>
                                            <TabsTrigger value="unanswered" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-accent">
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Unanswered
                                            </TabsTrigger>
                                            <TabsTrigger value="following" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-accent">
                                                <Users className="w-4 h-4 mr-2" />
                                                Following
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {isLoading ? (
                                    <div className="grid gap-6">
                                        {[...Array(3)].map((_, i) => (
                                            <Card key={i} className="animate-pulse border-none bg-card/50">
                                                <CardContent className="p-8">
                                                    <div className="h-6 bg-muted rounded-full w-3/4 mb-4" />
                                                    <div className="h-4 bg-muted rounded-full w-1/2 mb-6" />
                                                    <div className="space-y-2">
                                                        <div className="h-3 bg-muted rounded-full w-full" />
                                                        <div className="h-3 bg-muted rounded-full w-5/6" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : discussions.length === 0 ? (
                                    <Card className="text-center py-20 border-none bg-card/50 backdrop-blur-sm shadow-premium rounded-3xl">
                                        <CardContent>
                                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <MessageCircle className="w-10 h-10 text-muted-foreground opacity-50" />
                                            </div>
                                            <h3 className="text-2xl font-serif font-bold mb-3 text-primary">No Discussions Found</h3>
                                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                                {searchQuery || selectedCategory !== "All"
                                                    ? "We couldn't find anything matching your search. Try adjusting your filters or search keywords."
                                                    : "Be the light in this category! Start a meaningful conversation and connect with others."}
                                            </p>
                                            {currentUser && <CreateDiscussionButton />}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-6">
                                        {discussions.map((discussion: any) => (
                                            <Card
                                                key={discussion.id}
                                                className="group border-none shadow-sm hover:shadow-premium bg-card/80 backdrop-blur-sm transition-all duration-300 rounded-3xl overflow-hidden"
                                            >
                                                <CardHeader className="p-6 md:p-8 pb-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-none rounded-full px-3 py-1 font-medium text-xs">
                                                                    {discussion.category}
                                                                </Badge>
                                                                {discussion.taggedSpouse && (
                                                                    <Badge variant="outline" className="bg-red-50 border-red-100 text-red-600 rounded-full px-3 py-1 font-medium text-xs">
                                                                        <Heart className="w-3 h-3 mr-1 fill-current" />
                                                                        To {discussion.taggedSpouse.fullname || discussion.taggedSpouse.username}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <h3
                                                                className="font-serif font-bold text-xl md:text-2xl text-primary group-hover:text-accent transition-colors cursor-pointer mb-3 leading-tight"
                                                                onClick={() => toggleDiscussionExpansion(discussion.id)}
                                                            >
                                                                {discussion.title}
                                                                {discussion.taggedSpouseId && (
                                                                    <span className="ml-2 inline-flex items-center animate-pulse">
                                                                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <p className="text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3 mb-6">
                                                                {discussion.content}
                                                            </p>

                                                            <div className="flex items-center gap-4 flex-wrap">
                                                                <div className="flex items-center gap-2 group/author">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-faith-gold flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-background">
                                                                        {getUserAvatarContent(discussion.author)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-primary">
                                                                            {formatUserIdentity(discussion.author)}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                            <Clock className="w-2.5 h-2.5" />
                                                                            {formatDate(discussion.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 md:p-8 pt-0">
                                                    <div className="flex items-center gap-2 border-t pt-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`rounded-full px-4 h-9 transition-all ${discussion.isLiked ? "bg-red-50 text-red-600 hover:bg-red-100" : "hover:bg-accent/10 hover:text-accent"}`}
                                                            onClick={() => handleLikeToggle(discussion.id)}
                                                        >
                                                            <Heart className={`w-4 h-4 mr-2 ${discussion.isLiked ? "fill-current" : ""}`} />
                                                            <span className="font-bold">{discussion.likeCount || 0}</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-full px-4 h-9 hover:bg-accent/10 hover:text-accent transition-all"
                                                            onClick={() => startReply(discussion.id)}
                                                        >
                                                            <MessageCircle className="w-4 h-4 mr-2" />
                                                            <span className="font-bold">Reply ({discussion.replyCount || 0})</span>
                                                        </Button>

                                                        <div className="flex-1" />

                                                        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-accent/10 hover:text-accent transition-all" onClick={() => toggleDiscussionExpansion(discussion.id)}>
                                                            {expandedDiscussions.has(discussion.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                        </Button>

                                                        {currentUserIntId && discussion.author?.id === currentUserIntId && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-destructive hover:bg-destructive/10 transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-3xl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="font-serif">Delete Discussion?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This action will permanently remove this discussion and all associated replies. This cannot be undone.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => deleteMutation.mutate(discussion.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                                                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Discussion"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>

                                                    {expandedDiscussions.has(discussion.id) && (
                                                        <div className="mt-8 space-y-6 pt-6 border-t animate-in fade-in slide-in-from-top-4 duration-300">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-serif font-bold text-lg text-primary">Fellow Believers' Replies</h4>
                                                                <Badge variant="outline" className="text-xs font-bold border-accent/20 text-accent rounded-full">
                                                                    {discussion.replyCount || 0} Comments
                                                                </Badge>
                                                            </div>

                                                            <CommentsSection threadId={discussion.id} currentUserIntId={currentUserIntId} />

                                                            {replyingTo === discussion.id && (
                                                                <div className="mt-8 p-6 bg-muted/20 rounded-2xl space-y-4">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                                                            <MessageCircle className="w-4 h-4 text-accent" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-primary">Joining the conversation...</span>
                                                                    </div>
                                                                    <Textarea
                                                                        placeholder="Speak life into this conversation... Write your message here."
                                                                        value={replyContent}
                                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                                        className="min-h-[120px] bg-card border-none rounded-xl focus-visible:ring-accent shadow-sm"
                                                                    />
                                                                    <div className="flex justify-end gap-3">
                                                                        <Button variant="ghost" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="rounded-xl font-bold">Cancel</Button>
                                                                        <Button onClick={handleReply} disabled={!replyContent.trim() || replyMutation.isPending} className="btn-faith-primary rounded-xl font-bold px-6">
                                                                            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Reply</>}
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

const CommentsSection = ({ threadId, currentUserIntId }: { threadId: string; currentUserIntId: number | null }) => {
    const { data: comments = [], isLoading } = useCommunityComments(threadId);
    const deleteCommentMutation = useDeleteComment();

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "Recently";
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "Recently";
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatUserIdentity = (authorInfo: any) => {
        if (!authorInfo) return "Anonymous Member";
        if (authorInfo.fullname && authorInfo.fullname.includes('@')) return authorInfo.fullname;
        const username = authorInfo.username || `User${authorInfo.id || 'Member'}`;
        return authorInfo.fullname || `${username}@Community`;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4" />
                            <div className="h-4 bg-muted rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-8 bg-muted/10 rounded-2xl border border-dashed border-muted">
                <p className="text-sm text-muted-foreground italic">No replies yet. Be the first to speak life into this conversation!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {comments.map((comment: any) => (
                <div key={comment.id} className="group relative flex gap-4 items-start pl-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent shrink-0 ring-2 ring-background shadow-sm">
                        {(comment.author?.fullname || comment.author?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-muted/10 group-hover:bg-muted/20 p-4 rounded-2xl rounded-tl-none transition-colors border border-transparent group-hover:border-accent/10">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-primary">{formatUserIdentity(comment.author)}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{formatDate(comment.createdAt)}</span>
                            </div>
                            {currentUserIntId && (comment.userId === currentUserIntId || comment.author?.id === currentUserIntId) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-serif">Delete reply?</AlertDialogTitle>
                                            <AlertDialogDescription>This comment will be permanently removed. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteCommentMutation.mutate({ commentId: comment.id, threadId })} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                                {deleteCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Reply"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed italic">\"{comment.content}\"</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Community;
