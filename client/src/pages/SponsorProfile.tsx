import { useParams } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Mail, Globe, MapPin } from "lucide-react";

// This would normally come from your database
const sponsorsData: Record<string, any> = {
  'faith-community': {
    name: 'Faith Community Church',
    logo: 'https://ui-avatars.com/api/?name=Faith+Community&background=FFD700&color=000&bold=true&size=400',
    description: 'A vibrant community of believers dedicated to spreading the Gospel and serving our local community through worship, outreach, and discipleship.',
    website: 'https://faithcommunitychurch.com',
    email: 'info@faithcommunitychurch.com',
    location: 'Atlanta, Georgia',
    established: '1995',
    focus: ['Worship Services', 'Youth Ministry', 'Community Outreach', 'Bible Study'],
    testimonial: "Partnering with GKP Radio has expanded our reach beyond our local congregation. The platform allows us to share our sermons and teachings with believers worldwide."
  },
  'kingdom-network': {
    name: 'Kingdom Network',
    logo: 'https://ui-avatars.com/api/?name=Kingdom+Network&background=4B0082&color=fff&bold=true&size=400',
    description: 'A global Christian media network connecting believers through broadcasting, streaming, and digital ministry platforms.',
    website: 'https://kingdomnetwork.org',
    email: 'contact@kingdomnetwork.org',
    location: 'Dallas, Texas',
    established: '2010',
    focus: ['Christian Broadcasting', 'Digital Ministry', 'Content Creation', 'Global Missions'],
    testimonial: "GKP Radio aligns perfectly with our mission to spread faith-based content globally. Together, we're building a stronger digital community of believers."
  },
  'shepherds-foundation': {
    name: "Shepherd's Foundation",
    logo: 'https://ui-avatars.com/api/?name=Shepherds+Foundation&background=228B22&color=fff&bold=true&size=400',
    description: 'A non-profit organization focused on pastoral care, leadership development, and supporting church leaders worldwide.',
    website: 'https://shepherdsfoundation.org',
    email: 'support@shepherdsfoundation.org',
    location: 'Nashville, Tennessee',
    established: '2005',
    focus: ['Pastoral Care', 'Leadership Training', 'Church Resources', 'Ministry Support'],
    testimonial: "Through GKP Radio, we've been able to reach and support more pastors and church leaders than ever before. The platform is truly a blessing."
  },
  'grace-ministries': {
    name: 'Grace Ministries International',
    logo: 'https://ui-avatars.com/api/?name=Grace+Ministries&background=87CEEB&color=000&bold=true&size=400',
    description: 'An international ministry organization dedicated to spreading the message of God\'s grace through teaching, missions, and humanitarian work.',
    website: 'https://graceministries.org',
    email: 'info@graceministries.org',
    location: 'Chicago, Illinois',
    established: '1988',
    focus: ['International Missions', 'Bible Teaching', 'Humanitarian Aid', 'Prayer Ministry'],
    testimonial: "GKP Radio has become an essential partner in our mission work. The platform helps us share testimonies and teachings from our mission fields around the world."
  },
  'hope-center': {
    name: 'Hope & Healing Center',
    logo: 'https://ui-avatars.com/api/?name=Hope+Center&background=FF6B6B&color=fff&bold=true&size=400',
    description: 'A Christian counseling and recovery center offering faith-based healing programs for individuals and families.',
    website: 'https://hopehealingcenter.org',
    email: 'care@hopehealingcenter.org',
    location: 'Phoenix, Arizona',
    established: '2015',
    focus: ['Christian Counseling', 'Recovery Programs', 'Family Support', 'Mental Health'],
    testimonial: "GKP Radio provides a platform for us to share stories of hope and healing. Many have found help through the testimonies and teachings we've shared on the station."
  }
};

const Sponsor = () => {
  const { id } = useParams();
  const sponsor = sponsorsData[id || ''];

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Sponsor Not Found</h1>
              <p className="text-muted-foreground mb-6">The sponsor you're looking for doesn't exist.</p>
              <Button asChild>
                <a href="/">Return Home</a>
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
        <AudioPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden ring-4 ring-faith-gold/20">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="font-serif text-4xl font-bold mb-4">{sponsor.name}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {sponsor.description}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="p-4 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-2 text-faith-gold" />
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{sponsor.location}</p>
            </Card>
            <Card className="p-4 text-center">
              <Globe className="w-5 h-5 mx-auto mb-2 text-faith-gold" />
              <p className="text-sm text-muted-foreground">Established</p>
              <p className="font-medium">{sponsor.established}</p>
            </Card>
            <Card className="p-4 text-center">
              <Mail className="w-5 h-5 mx-auto mb-2 text-faith-gold" />
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium text-sm truncate">{sponsor.email}</p>
            </Card>
          </div>

          {/* Ministry Focus */}
          <Card className="p-8 mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4">Ministry Focus</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {sponsor.focus.map((item: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-faith-gold rounded-full"></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Testimonial */}
          <Card className="p-8 mb-12 bg-muted/30">
            <h2 className="font-serif text-2xl font-bold mb-4">Partnership Testimony</h2>
            <blockquote className="text-lg italic text-muted-foreground">
              "{sponsor.testimonial}"
            </blockquote>
          </Card>

          {/* Contact Section */}
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-4">Connect with {sponsor.name}</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild>
                <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${sponsor.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/sponsor/advertise">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Become a Sponsor
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default Sponsor;