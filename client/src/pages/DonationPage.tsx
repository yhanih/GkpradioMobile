import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, CreditCard, ArrowLeft, DollarSign } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import StripeCheckout from "@/components/StripeCheckout";

const DonationPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get donation data from URL params or localStorage
  const [donationData] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    const stored = localStorage.getItem('donationData');
    
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.removeItem('donationData'); // Clean up
      return parsed;
    }
    
    return {
      amount: amount ? parseFloat(amount) : 25,
      donorInfo: { name: '', email: '', message: '' }
    };
  });

  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(donationData.amount);
  const [customAmount, setCustomAmount] = useState("");
  const [donorInfo, setDonorInfo] = useState({
    name: donationData.donorInfo.name || "",
    email: donationData.donorInfo.email || "",
    message: donationData.donorInfo.message || ""
  });

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];
  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount > 0) {
      setStep('payment');
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please select or enter a donation amount.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setLocation('/donate/success');
  };

  const handlePaymentBack = () => {
    setStep('form');
  };

  const goBack = () => {
    setLocation('/');
  };

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <StripeCheckout
            amount={finalAmount}
            donorInfo={donorInfo}
            onSuccess={handlePaymentSuccess}
            onBack={handlePaymentBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={goBack}
          className="mb-8 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to GKP Radio
        </Button>

        {/* Main Donation Form */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl text-green-700 dark:text-green-400 flex items-center justify-center">
              <Heart className="w-8 h-8 mr-3 text-red-500" />
              Support GKP Radio
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Your donation helps us continue spreading the Gospel through quality Christian programming
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Impact Message */}
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your donation helps us reach more souls with the message of faith, hope, and love. 
                Every contribution makes a difference in someone's spiritual journey.
              </p>
            </div>

            <form onSubmit={handleContinueToPayment} className="space-y-6">
              {/* Amount Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Choose Your Donation Amount</Label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={selectedAmount === amount ? "default" : "outline"}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className="h-12 text-lg font-bold"
                      data-testid={`button-amount-${amount}`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <Label htmlFor="custom-amount" className="text-sm">Or enter a custom amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="custom-amount"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      className="pl-10 h-12 text-lg"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      data-testid="input-custom-amount"
                    />
                  </div>
                </div>
              </div>

              {/* Donor Information */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Your Information (Optional)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="donor-name" className="text-sm">Full Name</Label>
                    <Input
                      id="donor-name"
                      placeholder="Your name"
                      className="h-10"
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                      data-testid="input-donor-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="donor-email" className="text-sm">Email Address</Label>
                    <Input
                      id="donor-email"
                      type="email"
                      placeholder="your@email.com"
                      className="h-10"
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                      data-testid="input-donor-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="donor-message" className="text-sm">Prayer Request or Message (Optional)</Label>
                  <textarea
                    id="donor-message"
                    placeholder="Share your prayer request or message..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={donorInfo.message}
                    onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
                    data-testid="textarea-donor-message"
                  />
                </div>
              </div>

              {/* Summary */}
              {finalAmount > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-lg">Donation Amount:</span>
                      <Badge className="bg-green-600 text-white px-3 py-1 text-lg" data-testid="badge-amount">
                        ${finalAmount.toFixed(2)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Continue Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-medium"
                disabled={finalAmount <= 0}
                data-testid="button-continue-payment"
              >
                <Heart className="w-5 h-5 mr-2" />
                Continue to Secure Payment
              </Button>

              {/* Security Note */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  <CreditCard className="w-3 h-3 inline mr-1" />
                  Secure donation processing powered by Stripe
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonationPage;