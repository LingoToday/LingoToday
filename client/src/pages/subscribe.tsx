import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to Pro Learner! You now have access to all premium videos.",
        });
        // Invalidate subscription status to refresh user data
        await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        data-testid="submit-payment-button"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Subscribe for £2.49/month
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is already a pro member
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription-status'],
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    // If user is already pro, redirect to dashboard
    if (subscriptionStatus?.isProUser) {
      toast({
        title: "Already Subscribed",
        description: "You're already a Pro Learner! Redirecting to dashboard...",
      });
      setLocation('/dashboard');
      return;
    }

    // Create subscription
    setIsLoading(true);
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(data.message || 'Failed to create subscription');
        }
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
        toast({
          title: "Subscription Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [subscriptionStatus?.isProUser, setLocation, toast]);

  const handleSuccess = () => {
    setLocation('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Setting up your subscription...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Setup Failed</CardTitle>
            <CardDescription>
              We couldn't set up your payment. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/dashboard')} 
              variant="outline" 
              className="w-full"
              data-testid="back-to-dashboard-button"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Upgrade to Pro Learner
          </CardTitle>
          <CardDescription className="text-lg">
            Unlock premium video lessons with native speakers
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Access to all premium video lessons
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Early mobile app access
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Native speaker pronunciation guides
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Cancel anytime
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center py-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-800">£2.49</div>
            <div className="text-sm text-gray-600">per month</div>
          </div>

          {/* Payment Form */}
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm onSuccess={handleSuccess} />
          </Elements>

          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => setLocation('/dashboard')} 
            className="w-full"
            data-testid="cancel-subscription-button"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}