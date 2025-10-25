import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, User, Mail, Phone, MapPin, Award, Heart, Users, Mic, Radio } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";

// Team member data based on the screenshot
const teamMembers = [
  {
    id: 1,
    name: "Marcus Henley",
    role: "Morning Show Host",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Leading morning devotions and inspiring conversations to start your day with faith.",
    email: "marcus@gkpradio.com",
    phone: "(816) 555-0101",
    location: "Kansas City, MO"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Program Director",
    image: "https://images.unsplash.com/photo-1494790108755-2616b332c88c?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Coordinating our faith-based programming and ensuring quality content delivery.",
    email: "sarah@gkpradio.com",
    phone: "(816) 555-0102",
    location: "Kansas City, MO"
  },
  {
    id: 3,
    name: "David Miller",
    role: "Youth Ministry Host",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Connecting with the next generation through relevant biblical teachings and music.",
    email: "david@gkpradio.com",
    phone: "(816) 555-0103",
    location: "Kansas City, MO"
  },
  {
    id: 4,
    name: "Pastor George Sheffield",
    role: "Teaching Pastor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Delivering powerful sermons and biblical insights during Sheffield Family Hour.",
    email: "george@gkpradio.com",
    phone: "(816) 555-0104",
    location: "Sheffield Family Life Center"
  },
  {
    id: 5,
    name: "Joyce Smith",
    role: "Meditation Host",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Guiding listeners through peaceful devotionals and spiritual meditation sessions.",
    email: "joyce@gkpradio.com",
    phone: "(816) 555-0105",
    location: "Kansas City, MO"
  },
  {
    id: 6,
    name: "Marcus Rogers",
    role: "Technical Director",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    description: "Managing our technical operations and ensuring seamless broadcasting quality.",
    email: "marcus.r@gkpradio.com",
    phone: "(816) 555-0106",
    location: "Kansas City, MO"
  },
  {
    id: 7,
    name: "Tommy Powell",
    role: "Evening Host",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    rating: 4,
    description: "Bringing evening inspiration through music and thoughtful biblical discussions.",
    email: "tommy@gkpradio.com",
    phone: "(816) 555-0107",
    location: "Kansas City, MO"
  },
  {
    id: 8,
    name: "Yolanda Walker",
    role: "Community Outreach",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    rating: 4,
    description: "Connecting GKP Radio with the local community and organizing faith-based events.",
    email: "yolanda@gkpradio.com",
    phone: "(816) 555-0108",
    location: "Kansas City, MO"
  }
];

const Team = () => {
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-faith-gold text-faith-gold" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <section className="pt-20 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-primary mb-6">
            TEAM MEMBERS
          </h1>
          <div className="w-24 h-1 bg-faith-gold mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Meet the dedicated voices and hearts behind GKP Radio, bringing you faith-inspired content 24/7
          </p>
        </div>
      </section>

      {/* Team Stats Section - Using faith-gold consistently */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-faith-gold/10 rounded-full mb-4">
                <Users className="w-8 h-8 text-faith-gold" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">8+</h3>
              <p className="text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-faith-gold/10 rounded-full mb-4">
                <Radio className="w-8 h-8 text-faith-gold" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">24/7</h3>
              <p className="text-muted-foreground">Broadcasting</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-faith-gold/10 rounded-full mb-4">
                <Award className="w-8 h-8 text-faith-gold" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">5+</h3>
              <p className="text-muted-foreground">Years Experience</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-faith-gold/10 rounded-full mb-4">
                <Heart className="w-8 h-8 text-faith-gold" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">1000+</h3>
              <p className="text-muted-foreground">Lives Touched</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid - Simpler design consistent with existing pages */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <Card 
                key={member.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-card border border-border/50"
                onClick={() => setSelectedMember(member)}
              >
                <CardContent className="p-0">
                  {/* Member Image */}
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <Button size="sm" className="w-full btn-faith-gold">
                          <Play className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Member Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-foreground mb-2">
                      {member.name}
                    </h3>
                    <Badge className="mb-3 bg-faith-gold text-black">
                      {member.role}
                    </Badge>
                    <div className="mb-3">
                      {renderStars(member.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {member.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
              Join Our Ministry
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Feel called to serve? We're always looking for passionate individuals to join our team and spread God's word through radio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-faith-gold text-lg px-8 py-3">
                <Mail className="w-5 h-5 mr-2" />
                Apply Now
              </Button>
              <Button variant="outline" className="text-lg px-8 py-3">
                <Phone className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Member Detail Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMember(null)}
        >
          <Card 
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-card border-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              {/* Enhanced Header Image */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors backdrop-blur-sm"
                >
                  <span className="text-white text-xl font-bold">×</span>
                </button>
                
                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge className="bg-faith-gold text-black font-medium px-3 py-1">
                      {selectedMember.role}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {renderStars(selectedMember.rating)}
                    </div>
                  </div>
                  <h2 className="font-serif font-bold text-4xl mb-2">
                    {selectedMember.name}
                  </h2>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="font-bold text-xl text-foreground mb-4">About</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {selectedMember.description}
                  </p>
                </div>
                
                {/* Contact Info Grid */}
                <div className="mb-8">
                  <h3 className="font-bold text-xl text-foreground mb-4">Get In Touch</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                      <div className="bg-faith-gold/10 p-2 rounded-full">
                        <Mail className="w-5 h-5 text-faith-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Email</p>
                        <p className="text-muted-foreground text-sm">{selectedMember.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                      <div className="bg-faith-gold/10 p-2 rounded-full">
                        <Phone className="w-5 h-5 text-faith-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Phone</p>
                        <p className="text-muted-foreground text-sm">{selectedMember.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                      <div className="bg-faith-gold/10 p-2 rounded-full">
                        <MapPin className="w-5 h-5 text-faith-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Location</p>
                        <p className="text-muted-foreground text-sm">{selectedMember.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1 btn-faith-gold text-lg py-3">
                    <Mail className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="flex-1 text-lg py-3">
                    <Mic className="w-5 h-5 mr-2" />
                    View Programs
                  </Button>
                  <Button variant="outline" className="flex-1 text-lg py-3">
                    <Heart className="w-5 h-5 mr-2" />
                    Follow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Team;