import { useState } from "react";
import { Check, Star, Zap, Crown, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Promotions = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    contactEmail: "",
    phone: "",
    websiteUrl: "",
    socialMediaLinks: "",
    ministryDescription: "",
    message: "",
    packageType: ""
  });
  const { toast } = useToast();

  const packages = [
    {
      id: "starter",
      name: "Faith Starter",
      icon: <Star className="w-6 h-6" />,
      price: "$99",
      duration: "/month",
      description: "Perfect for small ministries and local businesses",
      features: [
        "5 sponsor mentions per day",
        "Featured in sponsor carousel",
        "Basic advertisement slots",
        "Community board listing",
        "Monthly performance report"
      ],
      popular: false,
      color: "border-gray-200"
    },
    {
      id: "growth",
      name: "Kingdom Growth", 
      icon: <Zap className="w-6 h-6" />,
      price: "$249",
      duration: "/month",
      description: "Ideal for growing ministries and established businesses",
      features: [
        "15 sponsor mentions per day",
        "Premium carousel placement",
        "Video advertisement slots",
        "Featured community posts",
        "Weekly performance reports",
        "Live show mentions",
        "Social media promotion"
      ],
      popular: true,
      color: "border-faith-gold"
    },
    {
      id: "premium",
      name: "Divine Premium",
      icon: <Crown className="w-6 h-6" />,
      price: "$499",
      duration: "/month", 
      description: "Maximum exposure for ministries and enterprises",
      features: [
        "Unlimited sponsor mentions",
        "Priority carousel placement",
        "Custom video advertisements",
        "Dedicated show segments",
        "Daily performance reports",
        "Live interview opportunities",
        "Custom landing page",
        "Personal account manager",
        "Cross-platform promotion"
      ],
      popular: false,
      color: "border-purple-500"
    }
  ];

  const handlePackageSelect = (packageData: any) => {
    setSelectedPackage(packageData.id);
    setFormData(prev => ({ ...prev, packageType: packageData.name }));
    setIsOrderOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!formData.businessName || !formData.contactPerson || !formData.contactEmail || !formData.ministryDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected package to get the price
    const selectedPkg = packages.find(pkg => pkg.name === formData.packageType);
    
    try {
      const response = await fetch("/api/promotional-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          packagePrice: selectedPkg?.price || ""
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit order");
      }

      const result = await response.json();
      
      toast({
        title: "Application Submitted for Review!",
        description: "We'll review your application and contact you within 24-48 hours with next steps.",
      });
      
      setIsOrderOpen(false);
      setFormData({
        businessName: "",
        contactPerson: "",
        contactEmail: "",
        phone: "",
        websiteUrl: "",
        socialMediaLinks: "",
        ministryDescription: "",
        message: "",
        packageType: ""
      });
      setSelectedPackage("");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-serif font-bold text-4xl md:text-5xl mb-6">
            Advertising Promotions
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
            Reach thousands of faithful listeners across our community. Partner with GKP Radio 
            to share your ministry, business, or message with our growing audience of believers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-live-indicator rounded-full animate-pulse"></div>
              <span>2,500+ Daily Listeners</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-faith-gold rounded-full"></div>
              <span>24/7 Christian Broadcasting</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Global Faith Community</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative ${pkg.color} ${pkg.popular ? 'ring-2 ring-faith-gold' : ''} hover:shadow-lg transition-all duration-300`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-faith-gold text-black">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${pkg.popular ? 'bg-faith-gold/10 text-faith-gold' : 'bg-accent/10 text-accent'}`}>
                    {pkg.icon}
                  </div>
                </div>
                <CardTitle className="font-serif text-2xl mb-2">{pkg.name}</CardTitle>
                <CardDescription className="text-sm mb-4">{pkg.description}</CardDescription>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">{pkg.price}</span>
                  <span className="text-muted-foreground ml-1">{pkg.duration}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-faith-gold mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handlePackageSelect(pkg)}
                  className={`w-full ${pkg.popular ? 'btn-faith-gold' : 'bg-accent hover:bg-accent/90'}`}
                  size="lg"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Choose {pkg.name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <h2 className="font-serif font-bold text-2xl mb-4">Why Advertise with GKP Radio?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-faith-gold/10 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-faith-gold" />
              </div>
              <h3 className="font-semibold">Faithful Audience</h3>
              <p className="text-sm text-muted-foreground">
                Connect with a dedicated community of believers who value faith-centered content and services.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-live-indicator/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-live-indicator" />
              </div>
              <h3 className="font-semibold">24/7 Reach</h3>
              <p className="text-sm text-muted-foreground">
                Your message broadcasts around the clock to listeners across different time zones and schedules.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Trusted Platform</h3>
              <p className="text-sm text-muted-foreground">
                Partner with a respected Christian radio station that shares your values and mission.
              </p>
            </div>
          </div>
        </div>

        {/* Order Dialog */}
        <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Submit Application for Review</DialogTitle>
              <DialogDescription>
                Please provide your ministry/business information for verification. We'll review your application and contact you within 24-48 hours regarding your {formData.packageType} package.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="businessName">Business/Ministry Name *</Label>
                <Input
                  id="businessName"
                  data-testid="input-business-name"
                  placeholder="Enter your business or ministry name"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  data-testid="input-contact-person"
                  placeholder="Full name of primary contact"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  data-testid="input-contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  data-testid="input-website-url"
                  placeholder="https://www.yourwebsite.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="socialMediaLinks">Social Media Links</Label>
                <Textarea
                  id="socialMediaLinks"
                  data-testid="input-social-media"
                  placeholder="Facebook, Instagram, Twitter/X, etc. (one per line)"
                  rows={2}
                  value={formData.socialMediaLinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialMediaLinks: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="ministryDescription">Ministry/Business Description *</Label>
                <Textarea
                  id="ministryDescription"
                  data-testid="input-ministry-description"
                  placeholder="Please describe your ministry or business, its mission, and how it aligns with Kingdom principles..."
                  rows={4}
                  value={formData.ministryDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, ministryDescription: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  data-testid="input-additional-message"
                  placeholder="Any specific advertising goals or special requirements..."
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsOrderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitOrder} className="btn-faith-gold" data-testid="button-submit-review">
                  Submit for Review
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Promotions;