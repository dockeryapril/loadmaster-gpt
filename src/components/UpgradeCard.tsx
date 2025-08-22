import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeCardProps {
  className?: string;
}

export function UpgradeCard({ className }: UpgradeCardProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          Win the rate with ready-made scripts
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          AI extracted your numbers. PRO adds copy-ready negotiation scripts and higher limits.
        </p>

        <div className="grid gap-3">
          <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium">Smart negotiation scripts</p>
              <p className="text-muted-foreground">AI-powered rate optimization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
            <Zap className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium">100 imaging runs per day</p>
              <p className="text-muted-foreground">vs 5 on LITE plan</p>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full"
            size="sm"
          >
            Upgrade to PRO
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You have 5 imaging runs/day on LITE.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}