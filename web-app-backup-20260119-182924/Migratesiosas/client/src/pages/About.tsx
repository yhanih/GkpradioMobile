import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Book, Users, Zap, Mail, Phone, MapPin } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <main className="pt-24">

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle className="text-3xl font-serif text-center mb-4">Our Mission</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed mb-6">
                    The mission of GKPRadio is to counteract the trend of spiritual ignorance by spreading 
                    the knowledge of God's Kingdom to the world through a variety of channels such as teaching, 
                    prayer, music, meditation, marriage, family, and finances. This is a powerful platform for 
                    educating individuals, families, and communities on the life-changing principles of God that 
                    empower believers to live abundant lives.
                  </p>
                  
                  <div className="bg-accent/10 p-6 rounded-lg mb-6">
                    <p className="text-lg italic text-center font-serif">
                      "My people are destroyed for lack of knowledge" - Hosea 4:6
                    </p>
                  </div>

                  <p className="text-lg leading-relaxed mb-6">
                    One of the most important aspects of this mission is the realization that the lack of 
                    knowledge is not just about not knowing information, but about being disconnected from 
                    the Source of all wisdom: God Himself. Without understanding His ways, we find ourselves 
                    disconnected from His provision, His protection, and His purpose for our lives.
                  </p>
                </CardContent>
              </Card>

              {/* Key Areas Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <Card className="text-center">
                  <CardHeader>
                    <Heart className="w-12 h-12 text-live-indicator mx-auto mb-4" />
                    <CardTitle className="text-xl">Marriage & Family</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      When couples apply God's principles of love, respect, and unity, 
                      they experience healing, restoration, and growth that mirrors Christ's love.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <Zap className="w-12 h-12 text-faith-gold mx-auto mb-4" />
                    <CardTitle className="text-xl">Financial Wisdom</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      God's Word offers practical advice on managing money wisely, giving generously, 
                      and stewarding resources with integrity for abundant provision.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <Book className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">Prayer & Meditation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Through prayer and meditation on His Word, we open doors for God to speak, 
                      offering guidance, wisdom, and spiritual growth.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Scripture Section */}
              <Card className="mb-12">
                <CardContent className="p-8">
                  <div className="text-center">
                    <p className="text-2xl font-serif italic text-primary mb-4">
                      "For the Lord gives wisdom; from His mouth come knowledge and understanding."
                    </p>
                    <p className="text-lg text-muted-foreground">Proverbs 2:6</p>
                  </div>
                </CardContent>
              </Card>

              {/* Family Restoration */}
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle className="text-3xl font-serif text-center mb-4">
                    Restoring the Family Unit
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed mb-6">
                    At the core of GKPRadio's mission is the restoration of the family unit. Families are 
                    the bedrock of society, and when the family unit is strengthened, society as a whole 
                    flourishes. Knowledge of God's principles regarding family roles, parenting, and the 
                    covenant of marriage is essential for creating loving, nurturing environments where 
                    individuals can thrive.
                  </p>
                  
                  <p className="text-lg leading-relaxed">
                    As families embrace God's wisdom, they break generational cycles of dysfunction and 
                    establish legacies of faith, peace, and prosperity. When parents model biblical principles, 
                    children are equipped to live lives that honor God and reflect His love to the world.
                  </p>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="text-center bg-primary text-primary-foreground">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-serif font-bold mb-4">Join Our Faith Community</h3>
                  <p className="text-lg mb-6 opacity-90">
                    The message of Hosea 4:6 is clear: the lack of knowledge leads to destruction, 
                    but the pursuit of divine wisdom leads to life.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="secondary" size="lg" className="btn-faith-gold">
                      <Users className="w-5 h-5 mr-2" />
                      Join Community
                    </Button>
                    <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Us
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-serif font-bold mb-8">Get In Touch</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center">
                  <Mail className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <p className="text-sm text-muted-foreground">contactus@gkpradio.com</p>
                </div>
                <div className="flex flex-col items-center">
                  <Phone className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Call Us</h3>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-PRAY</p>
                </div>
                <div className="flex flex-col items-center">
                  <MapPin className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Visit Us</h3>
                  <p className="text-sm text-muted-foreground">Broadcasting Worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;