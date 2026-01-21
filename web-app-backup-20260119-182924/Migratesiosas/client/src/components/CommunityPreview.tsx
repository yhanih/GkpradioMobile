import { MessageCircle, Heart, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const CommunityPreview = () => {
  const discussions = [
    {
      id: 1,
      title: "Prayer Request: Healing for My Mother",
      author: "Sarah@NashvilleUSA",
      category: "Prayer Requests",
      replies: 18,
      lastActivity: "2 hours ago",
      excerpt: "Join Us in Prayer: My mother undergoes surgery this week. Your prayers strengthen our family.",
      isHot: true
    },
    {
      id: 2,
      title: "Testimony: God's Provision in Hard Times",
      author: "Michael@AtlantaUSA",
      category: "Testimonies", 
      replies: 32,
      lastActivity: "4 hours ago",
      excerpt: "✨ We Never Went Hungry: How God provided when I lost my job. His faithfulness never fails.",
      isHot: false
    },
    {
      id: 3,
      title: "Youth Discussion: Faith in College",
      author: "Emma@DallasUSA",
      category: "Youth Voices",
      replies: 25,
      lastActivity: "6 hours ago",
      excerpt: "How do you maintain your faith while navigating college life and peer pressure?",
      isHot: true
    }
  ];

  const categoryIcons = {
    "Prayer Requests": "🙏",
    "Testimonies": "✨",
    "Youth Voices": "🎓"
  };

  return (
    <section className="py-12 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Ministry Indicator - Above section content, centered */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-live-indicator text-xs animate-pulse text-[#ffffff]">
            <Heart className="w-3 h-3 mr-1" />
            <span>Ministry Fields</span>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="font-serif font-bold text-2xl md:text-3xl mb-3">"Ministry Fields": Share Stories, Request Prayers & Grow Together</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join 2,500+ believers sharing authentic testimonies, lifting prayers, and 
            building community. Your voice matters here.
          </p>
        </div>

        {/* See More Link */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold">Featured Discussions</h3>
          <Link href="/community">
            <Button size="sm" className="btn-faith-gold font-medium">
              See More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="card-hover group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Category and Hot Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {categoryIcons[discussion.category as keyof typeof categoryIcons]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {discussion.category}
                        </Badge>
                      </div>
                      {discussion.isHot && (
                        <Badge className="bg-live-indicator text-live-foreground text-xs">
                          Hot
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-bold text-lg leading-tight group-hover:text-accent transition-colors">
                      {discussion.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {discussion.excerpt}
                    </p>

                    {/* Author and Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">
                          {discussion.author}
                        </span>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{discussion.lastActivity}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {discussion.replies} replies
                          </span>
                        </div>
                        
                        <Link href="/community">
                          <Button variant="ghost" size="sm" className="group/btn">
                            Join Discussion
                            <MessageCircle className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 rounded-xl bg-card">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div className="font-bold text-2xl">2.5K+</div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-faith-gold/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-faith-gold" />
            </div>
            <div className="font-bold text-2xl">8.2K</div>
            <div className="text-sm text-muted-foreground">Discussions</div>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-live-indicator/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-live-indicator" />
            </div>
            <div className="font-bold text-2xl">45K</div>
            <div className="text-sm text-muted-foreground">Prayer Requests</div>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div className="font-bold text-2xl">24/7</div>
            <div className="text-sm text-muted-foreground">Community Support</div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/community">
            <Button size="lg" className="btn-faith-primary group">
              <Users className="w-5 h-5 mr-2" />
              Join the Community
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            Share your story, ask for prayer, and connect with believers worldwide
          </p>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;