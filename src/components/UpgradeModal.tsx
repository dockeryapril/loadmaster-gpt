import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const upgradeMessages = [
  "You've hit today's 10 free load checks. Upgrade to Pro and keep rolling with unlimited AI insights.",
  "That's 10 free inquiries for today. Pro drivers unlock 100/day plus smarter negotiation tools. Ready to upgrade?",
  "Daily limit reached. Don't miss your next high-paying load — go Pro for more checks and advanced tools."
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  const message = upgradeMessages[0]; // Use first message as default

  const handleUpgrade = () => {
    onClose();
    navigate('/upgrade');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            Upgrade to PRO
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">100 AI-powered load checks per day</p>
                <p className="text-xs text-muted-foreground">vs 10 on free plan</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">Advanced negotiation tools</p>
                <p className="text-xs text-muted-foreground">Smarter rate optimization</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              OK
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="flex-1"
            >
              Upgrade to PRO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}