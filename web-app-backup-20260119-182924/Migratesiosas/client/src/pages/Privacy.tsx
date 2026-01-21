import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AudioPlayer />
      
      <main className="pt-24">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-serif font-bold text-primary mb-8 text-center">
                Privacy Policy
              </h1>
              
              <Card className="mb-8">
                <CardContent className="prose prose-lg max-w-none p-8">
                  <p className="text-muted-foreground mb-6">
                    <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Information We Collect</h2>
                  <p className="mb-4">
                    At GKP Radio, we collect information you provide directly to us, such as when you:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>Create an account or profile</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Submit prayer requests or testimonies</li>
                    <li>Contact us through our forms</li>
                    <li>Participate in community discussions</li>
                  </ul>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">How We Use Your Information</h2>
                  <p className="mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>Provide and improve our radio streaming services</li>
                    <li>Send you spiritual content and updates</li>
                    <li>Respond to your prayer requests and inquiries</li>
                    <li>Facilitate community interactions</li>
                    <li>Comply with legal obligations</li>
                  </ul>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Information Sharing</h2>
                  <p className="mb-6">
                    We do not sell, trade, or otherwise transfer your personal information to third parties. 
                    We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>With your explicit consent</li>
                    <li>To comply with legal requirements</li>
                    <li>To protect our rights and safety</li>
                    <li>With service providers who assist our operations (under strict confidentiality)</li>
                  </ul>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Data Security</h2>
                  <p className="mb-6">
                    We implement appropriate technical and organizational measures to protect your personal 
                    information against unauthorized access, alteration, disclosure, or destruction.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Your Rights</h2>
                  <p className="mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 mb-6">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request data portability</li>
                  </ul>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Cookies and Tracking</h2>
                  <p className="mb-6">
                    We use cookies and similar technologies to enhance your experience, analyze usage, 
                    and provide personalized content. You can control cookie settings through your browser.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Children's Privacy</h2>
                  <p className="mb-6">
                    Our services are not directed to children under 13. We do not knowingly collect 
                    personal information from children under 13 without parental consent.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Changes to This Policy</h2>
                  <p className="mb-6">
                    We may update this privacy policy from time to time. We will notify you of any 
                    changes by posting the new policy on this page and updating the "last updated" date.
                  </p>

                  <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4">Contact Us</h2>
                  <p className="mb-4">
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <ul className="list-none mb-6">
                    <li><strong>Email:</strong> contactus@gkpradio.com</li>
                    <li><strong>Phone:</strong> +1 (555) 123-PRAY</li>
                  </ul>

                  <div className="bg-primary/5 p-6 rounded-lg mt-8">
                    <p className="text-center italic font-serif text-primary">
                      "The Lord your God is in your midst, a mighty one who will save; 
                      he will rejoice over you with gladness; he will quiet you by his love; 
                      he will exult over you with loud singing." - Zephaniah 3:17
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

export default Privacy;