import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";

export default function Upgrade() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan, isPro, checkSubscription, subscriptionEnd } = usePlan();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pro-subscription');
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Upgrade Error",
          description: "Unable to start upgrade process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        // Check subscription status after a delay to see if they completed checkout
        setTimeout(async () => {
          await checkSubscription();
          toast({
            title: "Checking subscription status...",
            description: "We'll update your plan automatically if you completed the checkout.",
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Error in handleUpgradeToPro:', error);
      toast({
        title: "Upgrade Error", 
        description: "Unable to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: "Portal Error",
          description: "Unable to open subscription management. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open customer portal in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error in handleManageSubscription:', error);
      toast({
        title: "Portal Error",
        description: "Unable to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  // Free plan features
  const freeFeatures = [
    "4 uploads per week",
    "Core calculator + insights"
  ];

  const freeLimitations = [
    "Limited to weekly reset"
  ];

  // Pro plan features
  const proFeatures = [
    "Up to 100 uploads per week",
    "Full feature access", 
    "Built for serious owner-operators",
    "Priority updates + support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
            <div>
              <h1 className="text-xl font-bold">LoadMaster</h1>
              <p className="text-sm text-muted-foreground">Pricing Plans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-lg text-muted-foreground mb-2">
            One plan. All features. Built for serious owner-operators.
          </p>
          <p className="text-muted-foreground">
            Start with LoadMaster Free or upgrade to PRO for unlimited access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* LoadMaster Free */}
          <Card className={`relative ${!isPro ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">LoadMaster Free</CardTitle>
                {!isPro && (
                  <Badge variant="outline" className="text-xs">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                Perfect for getting started with load evaluation
              </CardDescription>
              <div className="pt-2">
                <div className="text-3xl font-bold">$0</div>
                <div className="text-sm text-muted-foreground">Forever free *with daily limits* OR use unlimited manual entries</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Limitations */}
              <div className="space-y-3">
                {freeLimitations.map((limitation, index) => (
                  <div key={index} className="flex items-center gap-3 opacity-60">
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                    <span className="text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={!isPro ? "outline" : "secondary"} 
                className="w-full mt-6" 
                disabled={!isPro}
                onClick={() => !isPro && navigate('/')}
              >
                {!isPro ? "Current Plan" : "Downgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* LoadMaster PRO */}
          <Card className={`relative ${isPro ? 'ring-2 ring-primary' : 'border-primary/20'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">LoadMasterPRO</CardTitle>
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                {isPro && (
                  <Badge variant="outline" className="text-xs">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                Full access for serious owner-operators
              </CardDescription>
              <div className="pt-2">
                <div className="text-3xl font-bold">$10</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {isPro ? (
                <div className="space-y-3 mt-6">
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={isManaging}
                    variant="outline"
                    className="w-full"
                  >
                    {isManaging ? "Opening Portal..." : "Manage Subscription"}
                  </Button>
                  {subscriptionEnd && (
                    <p className="text-xs text-muted-foreground text-center">
                      Renews {new Date(subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
                >
                  {isUpgrading ? "Opening Checkout..." : "Go PRO – Unlock 100 uploads/week"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Feature Comparison</h3>
            <p className="text-muted-foreground">
              See what's included in each plan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Upload Limits */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Upload Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Free</span>
                    <span className="text-sm font-medium">4 per week</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PRO</span>
                    <span className="text-sm font-medium text-primary">100 per week</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Access */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Feature Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Free</span>
                    <span className="text-sm font-medium">Core features</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PRO</span>
                    <span className="text-sm font-medium text-primary">Full access</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Support & Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Free</span>
                    <span className="text-sm font-medium">Standard</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PRO</span>
                    <span className="text-sm font-medium text-primary">Priority</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}