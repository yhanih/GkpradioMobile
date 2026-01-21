import { useState, useEffect } from "react";
import { Heart, CreditCard, DollarSign, X, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Payment Form Component (new modal design)
const PaymentForm = ({ amount, donorInfo, onBack, onSuccess }: {
  amount: number;
  donorInfo: any;
  onBack: () => void;
  onSuccess: () => void;
}) => {
  const [activePayment, setActivePayment] = useState<'paypal' | 'apple' | 'google' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Create payment intent
      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          donorInfo,
          paymentData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Thank you for your donation!",
        description: `Your generous gift of $${amount} helps spread the Gospel through GKP Radio.`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-5" style={{
      boxShadow: '0px 187px 75px rgba(0, 0, 0, 0.01), 0px 105px 63px rgba(0, 0, 0, 0.05), 0px 47px 47px rgba(0, 0, 0, 0.09), 0px 12px 26px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="space-y-5">
        {/* Payment Options */}
        <div className="grid grid-cols-3 gap-4">
          {/* PayPal */}
          <button
            onClick={() => setActivePayment('paypal')}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg width="40" height="48" viewBox="0 0 124 33" className="h-5">
              <path d="M46.211,6.749h-6.839c-0.468,0-0.866,0.34-0.939,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.564,0.658h3.265c0.468,0,0.866-0.34,0.939-0.803l0.746-4.73c0.072-0.463,0.471-0.803,0.938-0.803h2.165c4.505,0,7.105-2.18,7.784-6.5c0.306-1.89,0.013-3.375-0.872-4.415C50.224,7.353,48.5,6.749,46.211,6.749z M47,13.154c-0.374,2.454-2.249,2.454-4.062,2.454h-1.032l0.724-4.583c0.043-0.277,0.283-0.481,0.563-0.481h0.473c1.235,0,2.4,0,3.002,0.704C47.027,11.668,47.137,12.292,47,13.154z" fill="#253B80"/>
              <path d="M66.654,13.075h-3.275c-0.279,0-0.52,0.204-0.563,0.481l-0.145,0.916l-0.229-0.332c-0.709-1.029-2.29-1.373-3.868-1.373c-3.619,0-6.71,2.741-7.312,6.586c-0.313,1.918,0.132,3.752,1.22,5.031c0.998,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.562,0.66h2.95c0.469,0,0.865-0.34,0.939-0.803l1.77-11.209C67.271,13.388,67.004,13.075,66.654,13.075z M62.089,19.449c-0.316,1.871-1.801,3.127-3.695,3.127c-0.951,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.668-1.391-0.514-2.301c0.301-1.855,1.818-3.148,3.652-3.148c0.926,0,1.684,0.312,2.16,0.896C61.98,17.721,62.174,18.543,62.089,19.449z" fill="#253B80"/>
              <path d="M84.096,13.075h-3.291c-0.314,0-0.609,0.156-0.787,0.417l-4.539,6.686l-1.924-6.425c-0.121-0.402-0.492-0.678-0.912-0.678h-3.234c-0.393,0-0.666,0.384-0.541,0.754l3.625,10.638l-3.408,4.811c-0.268,0.379,0.002,0.9,0.465,0.9h3.287c0.312,0,0.604-0.152,0.781-0.408L84.564,13.97C84.826,13.592,84.557,13.075,84.096,13.075z" fill="#253B80"/>
              <path d="M94.992,6.749h-6.84c-0.467,0-0.865,0.34-0.938,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.562,0.658h3.51c0.326,0,0.605-0.238,0.656-0.562l0.785-4.971c0.072-0.463,0.471-0.803,0.938-0.803h2.164c4.506,0,7.105-2.18,7.785-6.5c0.307-1.89,0.012-3.375-0.873-4.415C99.004,7.353,97.281,6.749,94.992,6.749z M95.781,13.154c-0.373,2.454-2.248,2.454-4.062,2.454h-1.031l0.725-4.583c0.043-0.277,0.281-0.481,0.562-0.481h0.473c1.234,0,2.4,0,3.002,0.704C95.809,11.668,95.918,12.292,95.781,13.154z" fill="#179BD7"/>
              <path d="M115.434,13.075h-3.273c-0.281,0-0.52,0.204-0.562,0.481l-0.145,0.916l-0.23-0.332c-0.709-1.029-2.289-1.373-3.867-1.373c-3.619,0-6.709,2.741-7.311,6.586c-0.312,1.918,0.131,3.752,1.219,5.031c1,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.564,0.66h2.949c0.467,0,0.865-0.34,0.938-0.803l1.771-11.209C116.053,13.388,115.785,13.075,115.434,13.075z M110.869,19.449c-0.314,1.871-1.801,3.127-3.695,3.127c-0.949,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.668-1.391-0.514-2.301c0.301-1.855,1.818-3.148,3.652-3.148c0.926,0,1.684,0.312,2.160,0.896C110.761,17.721,110.955,18.543,110.869,19.449z" fill="#179BD7"/>
              <path d="M119.295,7.23l-2.807,17.858c-0.055,0.346,0.213,0.658,0.562,0.658h2.822c0.469,0,0.867-0.34,0.939-0.803l2.768-17.536c0.055-0.346-0.213-0.659-0.562-0.659h-3.16C119.578,6.749,119.338,6.953,119.295,7.23z" fill="#179BD7"/>
            </svg>
          </button>

          {/* Apple Pay */}
          <button
            onClick={() => setActivePayment('apple')}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg width="40" height="48" viewBox="0 0 512 210.2" className="h-6">
              <path d="M93.6,27.1C87.6,34.2,78,39.8,68.4,39c-1.2-9.6,3.5-19.8,9-26.1c6-7.3,16.5-12.5,25-12.9C103.4,10,99.5,19.8,93.6,27.1 M102.3,40.9c-13.9-0.8-25.8,7.9-32.4,7.9c-6.7,0-16.8-7.5-27.8-7.3c-14.3,0.2-27.6,8.3-34.9,21.2c-15,25.8-3.9,64,10.6,85c7.1,10.4,15.6,21.8,26.8,21.4c10.6-0.4,14.8-6.9,27.6-6.9c12.9,0,16.6,6.9,27.8,6.7c11.6-0.2,18.9-10.4,26-20.8c8.1-11.8,11.4-23.3,11.6-23.9c-0.2-0.2-22.4-8.7-22.6-34.3c-0.2-21.4,17.5-31.6,18.3-32.2C123.3,42.9,107.7,41.3,102.3,40.9" fill="#000"/>
              <path d="M182.6,135.4h5.1l12.2-39.2h8l12.2,39.2h5.3l-15.2-47.3h-6.4L182.6,135.4z M228.2,137c4.1,0,7.4-1.7,9.5-4.5v4.1h4.7V111.3h-4.7v4.1c-2.1-2.8-5.4-4.5-9.5-4.5c-7.8,0-14.1,6.4-14.1,14.1S220.4,137,228.2,137z M228.9,132.4c-5.3,0-9.5-4.3-9.5-9.5s4.2-9.5,9.5-9.5s9.5,4.3,9.5,9.5S234.2,132.4,228.9,132.4z M280.2,111.3v25.7h4.7v-14c0-5.8,3.5-9.7,8.7-9.7c4.8,0,7.8,3.2,7.8,8.3v15.4h4.7v-16.3c0-7-4.3-11.9-11.2-11.9c-4.1,0-7.4,1.7-9.5,4.5v-1.9H280.2z M344.5,96.2v40.8h4.7v-15.8c2.1,2.8,5.4,4.5,9.5,4.5c7.8,0,14.1-6.4,14.1-14.1s-6.3-14.1-14.1-14.1c-4.1,0-7.4,1.7-9.5,4.5V96.2H344.5z M358.1,132.4c-5.3,0-9.5-4.3-9.5-9.5s4.2-9.5,9.5-9.5s9.5,4.3,9.5,9.5S363.4,132.4,358.1,132.4z M389.6,96.2v40.8h4.7v-15.8c2.1,2.8,5.4,4.5,9.5,4.5c7.8,0,14.1-6.4,14.1-14.1s-6.3-14.1-14.1-14.1c-4.1,0-7.4,1.7-9.5,4.5V96.2H389.6z M403.2,132.4c-5.3,0-9.5-4.3-9.5-9.5s4.2-9.5,9.5-9.5s9.5,4.3,9.5,9.5S408.5,132.4,403.2,132.4z M434.7,96.2v40.8h4.7V96.2H434.7z M477.4,111.3h-16.9v4.5h6v21.2h4.7v-21.2h6.1V111.3z M200.8,169.3c0,5.8-4.2,9.7-10,9.7h-6.4v-19.5h6.4C196.6,159.5,200.8,163.4,200.8,169.3z M195.6,155.1h-15v4.4h4.8v23.9h-4.8v4.4h15c8.6,0,15.2-5.9,15.2-16.4S204.2,155.1,195.6,155.1z M243.8,169.3c0,9.1-6.9,16.4-16.4,16.4s-16.4-7.3-16.4-16.4s6.9-16.4,16.4-16.4S243.8,160.2,243.8,169.3z M215.4,169.3c0,6.9,5.4,12,12,12s12-5.1,12-12s-5.4-12-12-12S215.4,162.4,215.4,169.3z M295.6,179.8c0,4.1-3.2,5.9-8.6,5.9c-4.9,0-8.2-1.7-9.9-4.5l3.8-2.8c1.2,2,3.2,3,6.1,3c3.4,0,4.2-1.2,4.2-2.1c0-3.2-13.4-1.2-13.4-10.6c0-4.1,3.5-6.1,8.1-6.1c4.5,0,7.5,1.4,9.1,4.2l-3.8,2.8c-1.2-1.9-2.9-2.7-5.3-2.7c-2.7,0-3.7,1-3.7,2.1C277.2,172.2,295.6,170.4,295.6,179.8z M334.5,183.4h-4.7v-4.1c-2.1,2.8-5.4,4.5-9.5,4.5c-7.8,0-14.1-6.4-14.1-14.1s6.3-14.1,14.1-14.1c4.1,0,7.4,1.7,9.5,4.5v-4.1h4.7V183.4z M320.9,178.8c5.3,0,9.5-4.3,9.5-9.5s-4.2-9.5-9.5-9.5s-9.5,4.3-9.5,9.5S315.6,178.8,320.9,178.8z M370.6,164.7c-3.2,0-5.6,1.2-7.4,3.5v-12.5h-4.7v27.7h4.7v-4.1c1.8,2.3,4.2,3.5,7.4,3.5c7.8,0,13.6-6.4,13.6-14.1S378.4,164.7,370.6,164.7z M370,178.8c-5.1,0-9.1-4.3-9.1-9.5s4-9.5,9.1-9.5s9.1,4.3,9.1,9.5S375.1,178.8,370,178.8z M421.6,164.7c-3.2,0-5.6,1.2-7.4,3.5v-12.5h-4.7v27.7h4.7v-4.1c1.8,2.3,4.2,3.5,7.4,3.5c7.8,0,13.6-6.4,13.6-14.1S429.4,164.7,421.6,164.7z M421,178.8c-5.1,0-9.1-4.3-9.1-9.5s4-9.5,9.1-9.5s9.1,4.3,9.1,9.5S426.1,178.8,421,178.8z M465.2,183.4h-4.7v-4.1c-2.1,2.8-5.4,4.5-9.5,4.5c-7.8,0-14.1-6.4-14.1-14.1s6.3-14.1,14.1-14.1c4.1,0,7.4,1.7,9.5,4.5v-4.1h4.7V183.4z M451.6,178.8c5.3,0,9.5-4.3,9.5-9.5s-4.2-9.5-9.5-9.5s-9.5,4.3-9.5,9.5S446.3,178.8,451.6,178.8z M497.3,155.7h-4.7v4.1c-2.1-2.8-5.4-4.5-9.5-4.5c-7.8,0-14.1,6.4-14.1,14.1s6.3,14.1,14.1,14.1c4.1,0,7.4-1.7,9.5-4.5v4.1h4.7V155.7z M483.7,178.8c-5.3,0-9.5-4.3-9.5-9.5s4.2-9.5,9.5-9.5s9.5,4.3,9.5,9.5S489,178.8,483.7,178.8z"/>
            </svg>
          </button>

          {/* Google Pay */}
          <button
            onClick={() => setActivePayment('google')}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg width="40" height="16" viewBox="0 0 80 39" className="h-6">
              <g clipPath="url(#clip0_134_34)">
                <path fill="#5F6368" d="M37.8 19.7V29H34.8V6H42.6C44.5 6 46.3001 6.7 47.7001 8C49.1001 9.2 49.8 11 49.8 12.9C49.8 14.8 49.1001 16.5 47.7001 17.8C46.3001 19.1 44.6 19.8 42.6 19.8L37.8 19.7ZM37.8 8.8V16.8H42.8C43.9 16.8 45.0001 16.4 45.7001 15.6C47.3001 14.1 47.3 11.6 45.8 10.1L45.7001 10C44.9001 9.2 43.9 8.7 42.8 8.8H37.8Z"/>
                <path fill="#5F6368" d="M56.7001 12.8C58.9001 12.8 60.6001 13.4 61.9001 14.6C63.2001 15.8 63.8 17.4 63.8 19.4V29H61V26.8H60.9001C59.7001 28.6 58 29.5 56 29.5C54.3 29.5 52.8 29 51.6 28C50.5 27 49.8 25.6 49.8 24.1C49.8 22.5 50.4 21.2 51.6 20.2C52.8 19.2 54.5 18.8 56.5 18.8C58.3 18.8 59.7 19.1 60.8 19.8V19.1C60.8 18.1 60.4 17.1 59.6 16.5C58.8 15.8 57.8001 15.4 56.7001 15.4C55.0001 15.4 53.7 16.1 52.8 17.5L50.2001 15.9C51.8001 13.8 53.9001 12.8 56.7001 12.8ZM52.9001 24.2C52.9001 25 53.2001 25.7 53.7001 26.2C54.2001 26.7 54.9001 27 55.7001 27C56.7001 27 57.6001 26.6 58.3001 25.9C59.0001 25.2 59.4001 24.2 59.4001 23.1C58.5001 22.5 57.4001 22.2 56.1001 22.2C55.1001 22.2 54.2001 22.4 53.5001 22.9C52.9001 23.3 52.9001 23.7 52.9001 24.2Z"/>
                <path fill="#5F6368" d="M80 13.3L70.1 36H67.1L70.8 28.1L64.3 13.4H67.5L72.2 24.7H72.3L76.9 13.4H80V13.3Z"/>
                <path fill="#4285F4" d="M25.9 17.7C25.9 16.8 25.8 15.9 25.7 15H13.2V20.1H20.3C20 21.7 19.1 23.2 17.7 24.1V27.4H22C24.5 25.1 25.9 21.7 25.9 17.7Z"/>
                <path fill="#34A853" d="M13.1999 30.5999C16.7999 30.5999 19.7999 29.3999 21.9999 27.3999L17.6999 24.0999C16.4999 24.8999 14.9999 25.3999 13.1999 25.3999C9.7999 25.3999 6.7999 23.0999 5.7999 19.8999H1.3999V23.2999C3.6999 27.7999 8.1999 30.5999 13.1999 30.5999Z"/>
                <path fill="#FBBC04" d="M5.8001 19.8999C5.2001 18.2999 5.2001 16.4999 5.8001 14.7999V11.3999H1.4001C-0.499902 15.0999 -0.499902 19.4999 1.4001 23.2999L5.8001 19.8999Z"/>
                <path fill="#EA4335" d="M13.2 9.39996C15.1 9.39996 16.9 10.1 18.3 11.4L22.1 7.59996C19.7 5.39996 16.5 4.09996 13.3 4.19996C8.3 4.19996 3.7 6.99996 1.5 11.5L5.9 14.9C6.8 11.7 9.8 9.39996 13.2 9.39996Z"/>
              </g>
              <defs>
                <clipPath id="clip0_134_34">
                  <rect fill="white" height="38.1" width="80"/>
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <hr className="border-gray-300" />
          <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            or pay using credit card
          </p>
          <hr className="border-gray-300" />
        </div>

        {/* Credit Card Form */}
        <div className="space-y-4">
          {/* Cardholder Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Card holder full name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full h-10 px-4 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              value={paymentData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Card Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              className="w-full h-10 px-4 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            />
          </div>

          {/* Expiry & CVV */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Expiry Date / CVV
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="01/23"
                className="w-full h-10 px-4 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                value={paymentData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="CVV"
                className="w-full h-10 px-4 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full h-14 rounded-xl text-white font-bold text-sm transition-all"
          style={{
            background: isProcessing 
              ? 'linear-gradient(180deg, #666666 0%, #444444 50%, #222222 100%)'
              : 'linear-gradient(180deg, #363636 0%, #1B1B1B 50%, #000000 100%)',
            boxShadow: isProcessing ? 'none' : '0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0000003a'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.boxShadow = '0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0000003a';
            }
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Processing...
            </>
          ) : (
            'Checkout'
          )}
        </button>
      </div>
    </div>
  );
};

// Donation Form Component (compact layout with sticky actions)
const DonationForm = ({ onProceedToPayment }: { onProceedToPayment: (amount: number, donorInfo: any) => void }) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    message: ""
  });

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];
  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount > 0) {
      onProceedToPayment(finalAmount, donorInfo);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Impact Message */}
      <div className="text-center p-4 bg-accent/10 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">
          Your donation helps us reach more souls with the message of faith, hope, and love. 
          Every contribution makes a difference in someone's spiritual journey.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* Amount Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Choose Your Donation Amount</Label>
          
          <div className="grid grid-cols-3 gap-2">
            {predefinedAmounts.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount ? "default" : "outline"}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className="h-10 text-sm font-medium"
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
                className="pl-10 h-10"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
              />
            </div>
          </div>
        </div>

        {/* Donor Information - Compact Layout */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Your Information (Optional)</Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="donor-name" className="text-sm">Full Name</Label>
              <Input
                id="donor-name"
                placeholder="Your name"
                className="h-9"
                value={donorInfo.name}
                onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="donor-email" className="text-sm">Email Address</Label>
              <Input
                id="donor-email"
                type="email"
                placeholder="your@email.com"
                className="h-9"
                value={donorInfo.email}
                onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="donor-message" className="text-sm">Prayer Request or Message (Optional)</Label>
            <textarea
              id="donor-message"
              placeholder="Share your prayer request or message..."
              className="w-full min-h-[60px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={donorInfo.message}
              onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
            />
          </div>
        </div>

        {/* Summary */}
        {finalAmount > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Donation Amount:</span>
                <Badge className="bg-faith-gold text-faith-gold-foreground px-2 py-1">
                  ${finalAmount.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="mt-4 pt-4 border-t sticky bottom-0 bg-background">
        <div className="flex space-x-3">
          <Button
            id="continue-payments"
            onClick={handleSubmit}
            className="btn-faith-gold flex-1 h-11"
            disabled={finalAmount <= 0}
          >
            <Heart className="w-4 h-4 mr-2" />
            Continue to Payment
          </Button>
        </div>

        {/* Security Note */}
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            <CreditCard className="w-3 h-3 inline mr-1" />
            Secure donation processing powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [donationData, setDonationData] = useState<{ amount: number; donorInfo: any } | null>(null);

  const handleProceedToPayment = (amount: number, donorInfo: any) => {
    // Store donation data and navigate to dedicated page
    localStorage.setItem('donationData', JSON.stringify({ amount, donorInfo }));
    window.location.href = `/donate?amount=${amount}`;
  };

  const handlePaymentBack = () => {
    setStep('form');
  };

  const handlePaymentSuccess = () => {
    setStep('form');
    setDonationData(null);
    onClose();
  };

  const handleClose = () => {
    setStep('form');
    setDonationData(null);
    onClose();
  };

  return (
    <>
      {/* Step 1: Donation Form */}
      <Dialog open={isOpen && step === 'form'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="font-serif text-2xl text-center flex items-center justify-center">
              <Heart className="w-6 h-6 mr-2 text-faith-gold" />
              Support GKP Radio
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Your donation helps us continue providing quality Christian programming
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <DonationForm onProceedToPayment={handleProceedToPayment} />
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default DonationModal;