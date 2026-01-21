import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Edit, Heart, MessageCircle, Calendar, MapPin, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUserStats, useUserThreads, useUserComments, useUserPrayerActivity } from "@/hooks/useSupabase";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Profile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserIntId, setCurrentUserIntId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    bio: "",
    city: "",
    country: "",
    avatar: ""
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
      return;
    }
    if (user) {
      setEditForm({
        bio: user.user_metadata?.bio || "",
        city: user.user_metadata?.city || "",
        country: user.user_metadata?.country || "",
        avatar: user.user_metadata?.avatar || ""
      });
      
      const getUserIntId = async () => {
        if (user.email) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
          
          setCurrentUserIntId(dbUser?.id || null);
        }
      };
      
      getUserIntId();
    }
  }, [user, loading, setLocation]);

  const { data: userStats, isLoading: statsLoading } = useUserStats(currentUserIntId || 0);
  const { data: userThreads = [], isLoading: threadsLoading } = useUserThreads(currentUserIntId || 0);
  const { data: userComments = [], isLoading: commentsLoading } = useUserComments(currentUserIntId || 0);
  const { data: userPrayers = [], isLoading: prayersLoading } = useUserPrayerActivity(currentUserIntId || 0);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          bio: editForm.bio,
          city: editForm.city,
          country: editForm.country,
          avatar: editForm.avatar,
          displayName: user.user_metadata?.displayName || user.email?.split('@')[0],
          username: user.user_metadata?.username || user.email?.split('@')[0]
        }
      });
      
      if (error) throw error;
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const stats = {
    threadsCreated: userStats?.threadsCreated || 0,
    commentsPosted: userStats?.commentsPosted || 0,
    prayersOffered: userStats?.prayersOffered || 0,
    memberSince: new Date(user.created_at).toLocaleDateString()
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={user.user_metadata?.avatar} alt={user.user_metadata?.displayName || user.email} />
                      <AvatarFallback className="bg-faith-gold text-white text-2xl">
                        {(user.user_metadata?.username || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-xl font-serif">{user.user_metadata?.displayName || user.user_metadata?.username || user.email?.split('@')[0] || 'User'}</CardTitle>
                  <p className="text-sm text-muted-foreground">@{user.user_metadata?.username || user.email?.split('@')[0] || 'user'}</p>
                  
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{user.user_metadata?.city || "Unknown"}, {user.user_metadata?.country || "Unknown"}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {!isEditing ? (
                    <>
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">About</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.user_metadata?.bio || "No bio added yet. Share a little about yourself and your faith journey!"}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setIsEditing(true)} 
                        variant="outline" 
                        className="w-full"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Your city"
                            value={editForm.city}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            placeholder="Country"
                            value={editForm.country}
                            onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={isLoading} className="flex-1 btn-faith-gold">
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          onClick={() => setIsEditing(false)} 
                          variant="outline"
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-3">Community Stats</h4>
                    {statsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <div className="font-semibold text-faith-gold">{stats.threadsCreated}</div>
                          <div className="text-xs text-muted-foreground">Discussions</div>
                        </div>
                        <div>
                          <div className="font-semibold text-faith-gold">{stats.commentsPosted}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                        <div>
                          <div className="font-semibold text-faith-gold">{stats.prayersOffered}</div>
                          <div className="text-xs text-muted-foreground">Prayers</div>
                        </div>
                        <div>
                          <div className="font-semibold text-faith-gold">
                            <Calendar className="w-3 h-3 inline mr-1" />
                          </div>
                          <div className="text-xs text-muted-foreground">Since {stats.memberSince}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">My Community Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="discussions" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="discussions">Discussions</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="prayers">Prayers</TabsTrigger>
                      <TabsTrigger value="following">Following</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="discussions" className="mt-6">
                      {threadsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : userThreads.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-2">Your Discussions</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Discussions you've started will appear here
                          </p>
                          <Button variant="outline" onClick={() => setLocation("/community")} data-testid="button-start-discussion">
                            Start a Discussion
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userThreads.map((thread: any) => (
                            <Card key={thread.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/community")}>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{thread.title}</h4>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline">{thread.category}</Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(thread.createdat), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-muted-foreground">
                                    <div>{thread.replycount || 0} replies</div>
                                    <div>{thread.viewcount || 0} views</div>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="comments" className="mt-6">
                      {commentsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : userComments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-2">Your Comments</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Comments and replies you've made will appear here
                          </p>
                          <Button variant="outline" onClick={() => setLocation("/community")} data-testid="button-join-conversations">
                            Join Conversations
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userComments.map((comment: any) => (
                            <Card key={comment.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/community")}>
                              <CardHeader>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{comment.thread?.title}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{comment.thread?.category}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.createdat), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="prayers" className="mt-6">
                      {prayersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : userPrayers.length === 0 ? (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-2">Prayer Requests</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your prayer requests and prayers offered will appear here
                          </p>
                          <Button variant="outline" onClick={() => setLocation("/community")} data-testid="button-share-prayer">
                            Share a Prayer Request
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userPrayers.map((prayer: any) => (
                            <Card key={prayer.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/community")}>
                              <CardHeader>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{prayer.title}</h4>
                                    <Heart className="w-4 h-4 text-red-500" />
                                  </div>
                                  {prayer.content && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{prayer.content}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <Badge variant="outline">Prayer Request</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(prayer.createdat), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="following" className="mt-6">
                      <div className="text-center py-8">
                        <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">Following</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Discussions you're following will appear here
                        </p>
                        <Button variant="outline" onClick={() => setLocation("/community")}>
                          Explore Community
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;