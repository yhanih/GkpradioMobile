import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface PrivacyPolicyScreenProps {
  onBack?: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
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
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-bold">Privacy Policy</h1>
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
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                GKP Radio collects minimal information necessary to provide our services. 
                This includes your email address and name when you create an account, and 
                any content you voluntarily share in our community features.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Provide and maintain our radio and community services</li>
                <li>Enable you to participate in prayer requests and discussions</li>
                <li>Send you important updates about our services</li>
                <li>Improve and personalize your experience</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal 
                information. Your data is stored securely using industry-standard 
                encryption and security practices.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Sharing of Information</h3>
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. 
                Community content you share (prayer requests, testimonies, discussions) 
                will be visible to other community members.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Access your personal information</li>
                <li>Request correction of your data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Children's Privacy</h3>
              <p className="text-muted-foreground">
                Our services are not directed to children under 13. We do not knowingly 
                collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@gkpradio.com
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
