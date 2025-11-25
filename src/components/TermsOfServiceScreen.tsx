import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TermsOfServiceScreenProps {
  onBack?: () => void;
}

export function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
  return (
    <div className="pb-32 pt-4 px-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="font-bold">Terms of Service</h1>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4 text-[15px]">
            <section>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using GKP Radio, you accept and agree to be bound by 
                these Terms of Service. If you do not agree to these terms, please do 
                not use our services.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Description of Service</h3>
              <p className="text-muted-foreground">
                GKP Radio provides 24/7 faith-based radio broadcasting, podcasts, videos, 
                and community features including prayer requests, testimonies, and 
                discussion forums.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground">
                To access certain features, you may need to create an account. You are 
                responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Community Guidelines</h3>
              <p className="text-muted-foreground">
                When participating in our community, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Be respectful and kind to all members</li>
                <li>Not post offensive, harmful, or inappropriate content</li>
                <li>Not spam or harass other users</li>
                <li>Share genuine prayer requests and testimonies</li>
                <li>Respect the Christian values of our community</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Content Ownership</h3>
              <p className="text-muted-foreground">
                You retain ownership of content you post. However, by posting content, 
                you grant GKP Radio a license to use, display, and distribute that 
                content within our services.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Prohibited Uses</h3>
              <p className="text-muted-foreground">
                You may not use our services to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Violate any laws or regulations</li>
                <li>Infringe on others' intellectual property</li>
                <li>Transmit malicious code or viruses</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Impersonate others or misrepresent your affiliation</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Disclaimer</h3>
              <p className="text-muted-foreground">
                Our services are provided "as is" without warranties of any kind. 
                We do not guarantee uninterrupted or error-free service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use 
                of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">9. Contact Information</h3>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: support@gkpradio.com
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
