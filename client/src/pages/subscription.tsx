import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Crown, Check, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  priceTier?: string;
}

interface SubscriptionStatus {
  isProUser: boolean;
  status: string;
  currentPeriodEnd?: number;
  subscriptionId?: string;
}

function getLearningTier(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier.startsWith('pro-')) {
    return 'Pro';
  }
  if (priceTier.startsWith('plus-')) {
    return 'Plus';
  }
  return 'Free';
}

function getPlanType(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier === 'pro-monthly') {
    return 'Pro (Monthly)';
  }
  if (priceTier === 'pro-yearly') {
    return 'Pro (Yearly)';
  }
  if (priceTier === 'plus-monthly') {
    return 'Plus (Monthly)';
  }
  if (priceTier === 'plus-yearly') {
    return 'Plus (Yearly)';
  }
  return 'Free';
}

function getPriceDisplay(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier === 'pro-monthly') {
    return '£2.49/month';
  }
  if (priceTier === 'pro-yearly') {
    return '£14.99/year';
  }
  if (priceTier === 'plus-monthly') {
    return '£16.99/month';
  }
  if (priceTier === 'plus-yearly') {
    return '£149.99/year';
  }
  return 'Free';
}

const planFeatures = {
  free: [
    "Access to basic courses",
    "Limited lessons per day"
  ],
  pro: [
    "Unlimited access to all courses",
    "Priority support and new features"
  ],
  plus: [
    "Everything in Pro",
    "Advanced analytics and personalized learning paths"
  ]
};

export default function Subscription() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    enabled: !!user,
  });

  const handleRestorePurchases = () => {
    toast({
      title: "Restore Purchases",
      description: "Checking for existing subscriptions...",
    });
  };

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your subscription.</p>
        </div>
      </div>
    );
  }

  const currentPlan = getPlanType(user.priceTier);
  const currentTier = getLearningTier(user.priceTier);
  const priceDisplay = getPriceDisplay(user.priceTier);
  const renewalDate = subscriptionStatus?.currentPeriodEnd 
    ? format(new Date(subscriptionStatus.currentPeriodEnd * 1000), 'MMMM d, yyyy')
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/account">
                <Button variant="ghost" size="sm" data-testid="back-to-account" className="flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Back to Account</span>
                </Button>
              </Link>
            </div>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Subscription</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Current Plan Card */}
          <Card data-testid="current-plan-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2 text-amber-600" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Plan Type</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={currentTier === 'Free' ? 'secondary' : 'default'}
                      className={`${currentTier === 'Pro' ? 'bg-blue-600 text-white' : 
                        currentTier === 'Plus' ? 'bg-purple-600 text-white' : ''}`}
                      data-testid="plan-type"
                    >
                      {currentPlan}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="plan-price">{priceDisplay}</p>
                </div>
              </div>

              {renewalDate && (
                <div>
                  <p className="text-sm text-gray-600">Renewal Date</p>
                  <p className="text-lg font-medium text-gray-900" data-testid="renewal-date">{renewalDate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card data-testid="plan-features-card">
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Plan */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Free</Badge>
                </div>
                <ul className="space-y-1">
                  {planFeatures.free.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-600 text-white">Pro</Badge>
                </div>
                <ul className="space-y-1">
                  {planFeatures.pro.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plus Plan */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white">Plus</Badge>
                </div>
                <ul className="space-y-1">
                  {planFeatures.plus.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/subscribe">
              <Button className="w-full" size="lg" data-testid="change-plan-button">
                <Crown className="w-4 h-4 mr-2" />
                Change Plan
              </Button>
            </Link>

            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={handleRestorePurchases}
              data-testid="restore-purchases-button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restore Purchases
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
