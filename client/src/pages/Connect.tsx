import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Phone, MapPin, Clock, Send, Heart, Users, Headphones, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { useTeamMembers } from "@/hooks/useSupabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s()+-]+$/.test(val), {
      message: "Please enter a valid phone number"
    }),
  subject: z.string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
  contactReason: z.string()
    .optional()
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const Connect = () => {
  const { toast } = useToast();
  const { data: teamMembers = [] } = useTeamMembers();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      contactReason: ""
    }
  });

  // Create mutation for submitting contact form via API
  const submitContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit contact message');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
        duration: 5000,
      });
      
      // Reset form
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    submitContact.mutate(data);
  };

  // Subscribe to newsletter
  const subscribeNewsletter = useMutation({
    mutationFn: async (email: string) => {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('newsletterSubscribers')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        throw new Error('You are already subscribed!');
      }

      // Add new subscriber
      const { error } = await supabase
        .from('newsletterSubscribers')
        .insert({
          email,
          isActive: true,
          subscribedAt: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "Welcome to our community. You'll receive our newsletter soon.",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Issue",
        description: error.message || "Could not subscribe at this time.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleNewsletter = () => {
    if (newsletterEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      subscribeNewsletter.mutate(newsletterEmail);
      setNewsletterEmail("");
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
    }
  };

  // Default team members if none in database
  const defaultTeamMembers = [
    {
      name: "Pastor Johnson",
      role: "Lead Pastor & Radio Host",
      bio: "Sharing God's Word with passion and purpose for over 15 years.",
      department: "Leadership"
    },
    {
      name: "Minister Sarah",
      role: "Women's Ministry Leader",
      bio: "Empowering women to walk in their God-given purpose and destiny.",
      department: "Ministry"
    },
    {
      name: "Deacon Michael",
      role: "Youth Pastor & Music Director",
      bio: "Inspiring the next generation through music and biblical teaching.",
      department: "Youth"
    }
  ];

  const displayTeamMembers = (teamMembers && teamMembers.length > 0) ? teamMembers : defaultTeamMembers;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <main className="pt-24">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
                Connect With Us
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                We'd love to hear from you! Reach out for prayer, questions, or just to say hello.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif">Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your full name"
                                  {...field}
                                  disabled={submitContact.isPending}
                                  data-testid="input-contact-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your@email.com"
                                  {...field}
                                  disabled={submitContact.isPending}
                                  data-testid="input-contact-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="(555) 123-4567"
                                  {...field}
                                  disabled={submitContact.isPending}
                                  data-testid="input-contact-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Contact</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={submitContact.isPending}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-contact-reason">
                                    <SelectValue placeholder="Select a reason" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="prayer">Prayer Request</SelectItem>
                                  <SelectItem value="question">General Question</SelectItem>
                                  <SelectItem value="testimony">Share Testimony</SelectItem>
                                  <SelectItem value="volunteer">Volunteer Opportunity</SelectItem>
                                  <SelectItem value="feedback">Feedback</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="What's this about?"
                                {...field}
                                disabled={submitContact.isPending}
                                data-testid="input-contact-subject"
                              />
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
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share your heart with us..."
                                rows={5}
                                {...field}
                                disabled={submitContact.isPending}
                                data-testid="textarea-contact-message"
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0} / 2000 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full"
                        disabled={submitContact.isPending}
                        data-testid="button-submit-contact"
                      >
                        {submitContact.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif">Get In Touch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Email Us</h3>
                        <p className="text-muted-foreground">contactus@gkpradio.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Call Us</h3>
                        <p className="text-muted-foreground">+1 (555) 123-PRAY</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Broadcasting From</h3>
                        <p className="text-muted-foreground">Reaching the World with God's Love</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Response Time</h3>
                        <p className="text-muted-foreground">We typically respond within 24 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-prayer-request">
                      <Heart className="w-4 h-4 mr-2" />
                      Request Prayer
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-join-community">
                      <Users className="w-4 h-4 mr-2" />
                      Join Our Community
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-listen-live">
                      <Headphones className="w-4 h-4 mr-2" />
                      Listen Live
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Meet Our Team</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {displayTeamMembers && displayTeamMembers.map((member: any, index: number) => (
                <Card key={index} className="text-center" data-testid={`card-team-${index}`}>
                  <CardHeader>
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <p className="text-primary font-medium">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="text-center bg-primary text-primary-foreground">
              <CardContent className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-4">Stay Connected</h3>
                <p className="text-lg mb-6 opacity-90">
                  Join our community of believers and never miss an inspiring message
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Input 
                    placeholder="Your email address" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={subscribeNewsletter.isPending}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                    data-testid="input-newsletter-email"
                  />
                  <Button 
                    variant="secondary" 
                    className="btn-faith-gold"
                    onClick={handleNewsletter}
                    disabled={subscribeNewsletter.isPending}
                    data-testid="button-subscribe-newsletter"
                  >
                    {subscribeNewsletter.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Connect;