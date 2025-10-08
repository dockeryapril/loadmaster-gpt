import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, X, TrendingUp, Calculator, DollarSign } from 'lucide-react';
import { BusinessSetup, businessSetupSections, calculateCompletionPercentage } from '@/types/businessSetup';

interface SetupPreviewProps {
  formData: Partial<BusinessSetup>;
  onClose: () => void;
  onComplete: () => void;
  onEdit: () => void;
  saving: boolean;
  mode?: 'modal' | 'page';
}

export const SetupPreview = ({
  formData,
  onClose,
  onComplete,
  onEdit,
  saving,
  mode = 'modal'
}: SetupPreviewProps) => {
  const completionPercentage = calculateCompletionPercentage(formData);
  const isComplete = completionPercentage === 100;

  const getDisplayValue = (value: any, questionId: string) => {
    if (value === null || value === undefined) return 'Not set';
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (questionId.includes('percentage')) return `${value}%`;
      if (questionId.includes('rate') || questionId.includes('payment')) return `$${value}`;
      return value.toString();
    }
    
    // Find label for select options
    for (const section of businessSetupSections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question?.options) {
        const option = question.options.find(opt => opt.value === value);
        return option?.label || value;
      }
    }
    
    return value;
  };

  const renderSection = (section: any) => {
    const sectionData = section.questions
      .filter((q: any) => formData[q.id] !== undefined && formData[q.id] !== null && formData[q.id] !== '')
      .map((q: any) => ({
        label: q.label,
        value: getDisplayValue(formData[q.id], q.id),
        required: q.required
      }));

    if (sectionData.length === 0) return null;

    return (
      <div key={section.id} className="space-y-3">
        <h3 className="font-medium text-foreground">{section.title}</h3>
        <div className="space-y-2">
          {sectionData.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-start gap-4">
              <span className="text-sm text-muted-foreground flex-1">
                {item.label}
                {item.required && <span className="text-destructive ml-1">*</span>}
              </span>
              <span className="text-sm font-medium text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const calculateImprovements = () => {
    // This would calculate the actual improvements based on the setup
    // For now, showing estimated improvements
    return {
      accuracyImprovement: 'Up to 25%',
      monthlyEarningsImpact: '$200-500',
      betterDecisions: '3x faster load analysis'
    };
  };

  const improvements = calculateImprovements();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Setup Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isComplete ? 'default' : 'secondary'} className="text-sm">
            {completionPercentage}% Complete
          </Badge>
          {isComplete && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              Ready for Enhanced Calculations
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Impact preview */}
        {isComplete && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-green-900 flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Expected Improvements
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700">{improvements.accuracyImprovement}</div>
                    <div className="text-sm text-green-600">More Accurate RPM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-700">{improvements.monthlyEarningsImpact}</div>
                    <div className="text-sm text-blue-600">Monthly Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-700">{improvements.betterDecisions}</div>
                    <div className="text-sm text-purple-600">Decision Speed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup details */}
        <div className="space-y-6">
          {businessSetupSections.map(section => renderSection(section)).filter(Boolean)}
        </div>

        {!isComplete && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <DollarSign className="h-8 w-8 text-amber-600 mx-auto" />
                <h3 className="font-medium text-amber-900">Setup Incomplete</h3>
                <p className="text-sm text-amber-700">
                  Complete your setup to get the most accurate load calculations and maximize your earnings.
                </p>
                <p className="text-xs text-amber-600">
                  {100 - completionPercentage}% remaining • Only takes 2-3 more minutes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Setup
            </Button>
            
            <Button
              onClick={() => {
                onComplete();
                // Close the modal after completion
                if (isComplete) {
                  setTimeout(() => onClose(), 500);
                }
              }}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : isComplete ? 'Complete Setup' : 'Save Progress'}
            </Button>
          </div>
          
          {isComplete && (
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                All future load calculations will use your personalized business arrangement
              </p>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};