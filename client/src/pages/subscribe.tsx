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
  const [processingStage, setProcessingStage] = useState<'idle' | 'payment' | 'activating'>('idle');

  // Poll subscription status until webhook upgrades account
  const pollSubscriptionStatus = async (): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/subscription-status", {
          method: "GET",
          cache: "no-store" // Prevent 304 responses that cause JSON parsing issues
        });
        
        if (response.status === 200) {
          const data = await response.json();
          if (data.isProUser) {
            return true; // Webhook processed successfully
          }
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error checking subscription status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    return false; // Timeout - webhook didn't arrive in time
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setProcessingStage('payment');

    try {
      // Submit payment element validation first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast({
          title: "Payment Failed",
          description: submitError.message,
          variant: "destructive",
        });
        setProcessingStage('idle');
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required' // Stay in SPA, don't redirect
      });

      if (error) {
        // Only show immediate failure for definitive client-side errors
        const isDefinitiveFailure = error.type === 'card_error' || 
                                   error.type === 'validation_error' ||
                                   error.type === 'invalid_request_error';
        
        if (isDefinitiveFailure) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
          setProcessingStage('idle');
        } else {
          // For ambiguous errors, wait for webhook confirmation
          setProcessingStage('activating');
          toast({
            title: "Finalizing Payment",
            description: "Please wait while we confirm your payment...",
          });

          const webhookSuccess = await pollSubscriptionStatus();
          
          if (webhookSuccess) {
            await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
            toast({
              title: "Welcome to Pro Learner!",
              description: "Your subscription is now active. You have access to all premium videos.",
            });
            onSuccess();
          } else {
            toast({
              title: "Payment Status Unclear",
              description: "We're unable to confirm your payment status right now. Please check your account or contact support if needed.",
              variant: "destructive",
            });
            setProcessingStage('idle');
          }
        }
      } else {
        // Payment confirmed by Stripe - now wait for webhook
        setProcessingStage('activating');
        
        toast({
          title: "Payment Successful",
          description: "Activating your Pro subscription...",
        });

        // Poll subscription status until webhook upgrades account
        const webhookSuccess = await pollSubscriptionStatus();
        
        if (webhookSuccess) {
          // Invalidate subscription status to refresh user data
          await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
          
          toast({
            title: "Welcome to Pro Learner!",
            description: "Your subscription is now active. You have access to all premium videos.",
          });
          
          onSuccess();
        } else {
          // Webhook didn't arrive in time
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. If you don't see Pro features immediately, please refresh the page in a few minutes.",
            variant: "default",
          });
          
          // Still invalidate queries and redirect - user might already be upgraded
          await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
          onSuccess();
        }
      }
    } catch (err) {
      // Don't treat exceptions as hard failures - start processing flow instead
      console.error('Payment confirmation threw exception:', err);
      
      setProcessingStage('activating');
      toast({
        title: "Processing Payment",
        description: "Confirming your payment, please wait...",
        className: "border-orange-200 bg-orange-50 text-orange-800"
      });

      // Poll for webhook confirmation even after exception
      const webhookSuccess = await pollSubscriptionStatus();
      
      if (webhookSuccess) {
        await queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
        toast({
          title: "Welcome to Pro Learner!",
          description: "Your subscription is now active. You have access to all premium videos.",
        });
        onSuccess();
      } else {
        toast({
          title: "Payment Status Unclear",
          description: "We're unable to confirm your payment status right now. Please check your account or contact support if needed.",
          variant: "destructive",
        });
        setProcessingStage('idle');
      }
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
            {processingStage === 'payment' ? 'Processing Payment...' : 'Activating Subscription...'}
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
  const { data: subscriptionStatus } = useQuery<{isProUser: boolean; status: string}>({
    queryKey: ['/api/subscription-status'],
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    // If user is already pro, redirect to dashboard
    if (subscriptionStatus && subscriptionStatus.isProUser) {
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
  }, [subscriptionStatus, setLocation, toast]);

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