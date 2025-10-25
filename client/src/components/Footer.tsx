import { Heart, Radio, Mail, MapPin, Phone } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import unnamed__1_ from "@assets/unnamed (1).png";

const Footer = () => {
  const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "Podcasts", href: "/podcasts" },
    { name: "Community", href: "/community" },
    { name: "Videos", href: "/videos" },
    { name: "Connect", href: "/connect" }
  ];

  const communityLinks = [
    { name: "Prayer Requests", href: "/community?category=prayer" },
    { name: "Testimonies", href: "/community?category=testimonies" },
    { name: "Youth Voices", href: "/community?category=youth" },
    { name: "Faith Stories", href: "/community?category=stories" }
  ];

  const socialLinks = [
    { name: "Facebook", href: "#", icon: "📘" },
    { name: "YouTube", href: "#", icon: "📺" },
    { name: "Instagram", href: "#", icon: "📷" },
    { name: "Twitter", href: "#", icon: "🐦" }
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src={unnamed__1_}
                alt="GKP Radio"
                width="160"
                height="40"
                loading="lazy"
                decoding="async"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Where two or three gather in my name, there am I with them. - Matthew 18:20
            </p>
            <p className="text-primary-foreground/70 text-xs mt-2">
              A faith-centered community where believers worship, learn, and grow together.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contactus@gkpradio.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-PRAY</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Stay Connected</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Get daily devotions and community updates delivered to your inbox.
            </p>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Your email for daily encouragement"
                  className="flex-1 px-3 py-2 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-sm placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button size="sm" className="btn-faith-gold">
                  Subscribe for Updates
                </Button>
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                    title={social.name}
                  >
                    <span className="text-sm">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scripture Quote */}
        <div className="border-t border-primary-foreground/20 pt-8 mb-8">
          <div className="text-center">
            <p className="font-serif text-lg md:text-xl italic text-primary-foreground/90 mb-2">
              "For where two or three gather in my name, there am I with them."
            </p>
            <p className="text-sm text-primary-foreground/70">Matthew 18:20</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-primary-foreground/60">
              © 2025 GKP Radio. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Terms of Use
              </Link>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-primary-foreground/60">
              Made with <Heart className="w-4 h-4 text-live-indicator mx-1" /> for the Kingdom
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;