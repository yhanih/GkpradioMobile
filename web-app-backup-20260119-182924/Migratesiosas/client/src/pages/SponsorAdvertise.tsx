import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Heart, Users, Radio, Globe } from "lucide-react";

const sponsorFormSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  message: z.string().min(20, "Please provide more details about your organization"),
});

type SponsorFormData = z.infer<typeof sponsorFormSchema>;

const SponsorAdvertise = () => {
  const { toast } = useToast();
  const form = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorFormSchema),
    defaultValues: {
      organizationName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      message: "",
    },
  });

  const onSubmit = async (data: SponsorFormData) => {
    toast({
      title: "Thank you for your interest!",
      description: "We'll contact you within 24-48 hours to discuss sponsorship opportunities.",
    });
    form.reset();
  };

  const benefits = [
    {
      icon: <Users className="w-8 h-8 text-faith-gold" />,
      title: "Reach Thousands",
      description: "Connect with our growing community of faith-driven listeners worldwide",
    },
    {
      icon: <Radio className="w-8 h-8 text-faith-gold" />,
      title: "24/7 Exposure",
      description: "Your message broadcasts round the clock to engaged audiences",
    },
    {
      icon: <Heart className="w-8 h-8 text-faith-gold" />,
      title: "Kingdom Impact",
      description: "Support faith-based programming while growing your ministry",
    },
    {
      icon: <Globe className="w-8 h-8 text-faith-gold" />,
      title: "Global Reach",
      description: "Expand your influence across continents through digital streaming",
    },
  ];

  const packages = [
    {
      name: "Faith Seed",
      price: "$250/month",
      features: [
        "Logo on website",
        "Monthly social media mentions",
        "Sponsor acknowledgment during programs",
        "Basic analytics report",
      ],
    },
    {
      name: "Kingdom Builder",
      price: "$500/month",
      features: [
        "Everything in Faith Seed",
        "Dedicated sponsor segment (2 min/day)",
        "Featured sponsor of the week",
        "Advanced analytics dashboard",
        "Email newsletter inclusion",
      ],
      popular: true,
    },
    {
      name: "Gospel Champion",
      price: "$1000/month",
      features: [
        "Everything in Kingdom Builder",
        "Prime time exclusive sponsorship",
        "Custom promotional content",
        "Live interview opportunities",
        "Annual partnership celebration",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Partner with Purpose
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join GKP Radio in spreading the Gospel through strategic sponsorship opportunities
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl font-bold text-center mb-12">
              Why Partner with GKP Radio?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="mb-4">{benefit.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl font-bold text-center mb-12">
              Sponsorship Packages
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {packages.map((pkg, index) => (
                <Card 
                  key={index} 
                  className={`p-8 ${pkg.popular ? 'ring-2 ring-faith-gold relative' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-faith-gold text-faith-gold-foreground px-4 py-1 rounded-full text-sm font-bold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="font-serif text-2xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-3xl font-bold text-faith-gold mb-6">{pkg.price}</p>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="p-8">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Start Your Partnership Journey
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Faith Community Church" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Pastor John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="info@yourministry.org" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://yourministry.org" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell Us About Your Organization</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your ministry's mission, values, and why you're interested in partnering with GKP Radio..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-faith-gold hover:bg-faith-gold/90"
                    size="lg"
                  >
                    Submit Partnership Inquiry
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default SponsorAdvertise;