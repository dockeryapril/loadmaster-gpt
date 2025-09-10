import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Upload } from "lucide-react";
import { useWeeklyUploads } from "@/hooks/useWeeklyUploads";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WeeklyLimitReached() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { weeklyCount, weeklyLimit, resetDate } = useWeeklyUploads();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Format reset date
  const formatResetDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Main Card */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Upload className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              You've reached your weekly limit.
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Usage Stats */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Weekly Usage
              </div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {weeklyCount} / {weeklyLimit}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                uploads used this week
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center space-y-2">
              <p className="text-lg text-foreground">
                You've hit your <strong>{weeklyLimit} uploads</strong> for this week. 
              </p>
              <p className="text-muted-foreground">
                Upgrade to <strong>PRO</strong> for up to <strong>100 uploads per week</strong> and full access to LoadMaster.
              </p>
            </div>

            {/* Reset Info */}
            <div className="flex items-center justify-center gap-2 p-3 bg-background/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Your uploads reset on {formatResetDate(resetDate)}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleUpgradeToPro}
                disabled={isUpgrading}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg text-lg py-6"
              >
                {isUpgrading ? "Opening Checkout..." : "Upgrade to PRO"}
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Your uploads reset every Sunday if you'd rather wait.
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Continue with Manual Entry
              </Button>
            </div>

            {/* Pro Features Preview */}
            <div className="mt-8 p-4 bg-background/30 rounded-lg">
              <h3 className="font-semibold text-center mb-3">LoadMaster PRO includes:</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Up to 100 uploads per week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Full feature access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Built for serious owner-operators</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Priority updates + support</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}