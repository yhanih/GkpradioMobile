import { useEffect } from "react";
import { Heart, CheckCircle, ArrowLeft } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

const DonateSuccess = () => {
  useEffect(() => {
    // Clear any stored donation data
    localStorage.removeItem('donationData');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-green-700">
              Thank You for Your Donation!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-muted-foreground">
              <p className="text-lg mb-4">
                Your generous gift helps us continue spreading the Gospel through GKP Radio.
              </p>
              <p className="text-sm">
                You should receive a confirmation email shortly with your donation receipt.
              </p>
            </div>

            {/* Impact Message */}
            <div className="bg-accent/10 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Impact</h4>
                  <p className="text-sm text-muted-foreground">
                    Your donation directly supports our mission to reach souls with the message of faith, hope, and love. 
                    Thank you for being a vital part of the GKP Radio family and helping us continue this important work.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to GKP Radio
                </Button>
              </Link>
              
              <Link to="/community">
                <Button variant="outline">
                  Join Our Community
                </Button>
              </Link>
            </div>

            {/* Contact Info */}
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p>
                Questions about your donation? Contact us at{" "}
                <a href="mailto:support@gkpradio.com" className="text-blue-600 hover:underline">
                  support@gkpradio.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonateSuccess;