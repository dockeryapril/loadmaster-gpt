import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calculator } from "lucide-react";
import { UpgradeCard } from "./UpgradeCard";

interface SuccessScreenProps {
  onBackToCalculator: () => void;
  onUpgrade: () => void;
}

export function SuccessScreen({ onBackToCalculator, onUpgrade }: SuccessScreenProps) {
  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900">Data Extracted Successfully!</h2>
              <p className="text-sm text-green-700">
                Your load information has been detected from the image.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Card */}
      <UpgradeCard onUpgrade={onUpgrade} />

      {/* Back to Calculator Button */}
      <Button 
        onClick={onBackToCalculator}
        variant="outline"
        className="w-full"
      >
        <Calculator className="h-4 w-4 mr-2" />
        Back to Calculator
      </Button>
    </div>
  );
}