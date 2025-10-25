import { useState, useEffect } from "react";
import type { StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Heart } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";

// Lazily initialize Stripe to keep it out of the initial bundle
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? import('@stripe/stripe-js').then(m => m.loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!))
  : null;

interface CheckoutFormProps {
  amount: number;
  donorInfo: any;
  onSuccess: () => void;
  onBack: () => void;
}

const CheckoutForm = ({ amount, donorInfo, onSuccess, onBack }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Stripe has not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate/success`,
        receipt_email: donorInfo.email || undefined,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank you for your donation!",
        description: `Your generous gift of $${amount} helps spread the Gospel through GKP Radio.`,
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Complete Your Donation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Donation Summary */}
          <div className="bg-accent/10 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Donation Amount:</span>
              <span className="text-lg font-bold text-green-600">${amount.toFixed(2)}</span>
            </div>
            {donorInfo.name && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Donor:</span>
                <span className="text-sm">{donorInfo.name}</span>
              </div>
            )}
            {donorInfo.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm">{donorInfo.email}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Stripe Payment Element */}
            <div className="border rounded-lg p-4">
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
                }}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !elements || isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Donation...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Secure 256-bit SSL encryption • Powered by Stripe
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your payment information is never stored on our servers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StripeCheckoutProps {
  amount: number;
  donorInfo: any;
  onSuccess: () => void;
  onBack: () => void;
}

const StripeCheckout = ({ amount, donorInfo, onSuccess, onBack }: StripeCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            donorInfo,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
        toast({
          title: "Payment Setup Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, donorInfo, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">
          <p className="font-medium">Payment Setup Failed</p>
          <p className="text-sm text-muted-foreground">{error || 'Stripe is not configured properly'}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#16a34a',
        colorText: '#1f2937',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        amount={amount}
        donorInfo={donorInfo}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
};

export default StripeCheckout;