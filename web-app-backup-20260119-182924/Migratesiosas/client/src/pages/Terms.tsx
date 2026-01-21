import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <main className="pt-24">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-serif font-bold text-primary mb-8 text-center">
                Terms of Use
              </h1>
              
              <Card className="mb-8">
                <CardContent className="prose prose-lg max-w-none p-8">
                  <p className="text-muted-foreground mb-6">
                    <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Acceptance of Terms</h2>
                  <p className="mb-6">
                    By accessing and using GKP Radio's website and services, you accept and agree to be 
                    bound by the terms and provision of this agreement. If you do not agree to abide by 
                    the above, please do not use this service.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Our Mission and Values</h2>
                  <p className="mb-6">
                    GKP Radio is committed to spreading the knowledge of God's Kingdom through teaching, 
                    prayer, music, and community fellowship. All content and interactions should align 
                    with biblical principles and Christian values.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">User Conduct</h2>
                  <p className="mb-4">
                    When using our services, you agree to:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>Treat all community members with respect and Christian love</li>
                    <li>Share content that is appropriate and edifying</li>
                    <li>Respect intellectual property rights</li>
                    <li>Not use our platform for commercial purposes without permission</li>
                    <li>Report any inappropriate content or behavior</li>
                  </ul>

                  <p className="mb-4">
                    You agree NOT to:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>Post content that is offensive, discriminatory, or harmful</li>
                    <li>Share false information or engage in deceptive practices</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Attempt to hack or disrupt our services</li>
                    <li>Share content that violates biblical principles</li>
                  </ul>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Content and Intellectual Property</h2>
                  <p className="mb-6">
                    All content on GKP Radio, including but not limited to text, graphics, logos, audio 
                    clips, and software, is the property of GKP Radio or its content suppliers and is 
                    protected by copyright laws. You may not reproduce, distribute, or create derivative 
                    works without written permission.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">User-Generated Content</h2>
                  <p className="mb-6">
                    By submitting content to GKP Radio (including prayer requests, testimonies, and 
                    community posts), you grant us a non-exclusive, royalty-free license to use, 
                    reproduce, and distribute such content in connection with our services.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Privacy and Data</h2>
                  <p className="mb-6">
                    Your privacy is important to us. Please review our Privacy Policy to understand 
                    how we collect, use, and protect your information.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Disclaimers</h2>
                  <p className="mb-6">
                    GKP Radio provides spiritual content and community services "as is" without any 
                    warranties. While we strive to provide accurate and helpful content, we make no 
                    guarantees about the completeness or reliability of any information provided.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Limitation of Liability</h2>
                  <p className="mb-6">
                    GKP Radio shall not be liable for any direct, indirect, incidental, special, or 
                    consequential damages resulting from the use or inability to use our services.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Termination</h2>
                  <p className="mb-6">
                    We reserve the right to terminate or suspend access to our services immediately, 
                    without prior notice, for conduct that we believe violates these Terms of Use or 
                    is harmful to other users or our ministry.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Modifications</h2>
                  <p className="mb-6">
                    GKP Radio reserves the right to modify these terms at any time. We will notify users 
                    of significant changes through our website or email communications.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Governing Law</h2>
                  <p className="mb-6">
                    These terms shall be governed by and construed in accordance with applicable local laws, 
                    with disputes resolved through biblical principles of reconciliation when possible.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Contact Information</h2>
                  <p className="mb-4">
                    For questions about these Terms of Use, please contact us:
                  </p>
                  <ul className="list-none mb-6">
                    <li><strong>Email:</strong> contactus@gkpradio.com</li>
                    <li><strong>Phone:</strong> +1 (555) 123-PRAY</li>
                  </ul>

                  <div className="bg-primary/5 p-6 rounded-lg mt-8">
                    <p className="text-center italic font-serif text-primary">
                      "Let your light shine before others, that they may see your good deeds 
                      and glorify your Father in heaven." - Matthew 5:16
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;