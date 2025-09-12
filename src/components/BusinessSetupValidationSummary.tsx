import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { BusinessSetup, businessSetupSections, shouldShowQuestion } from '@/types/businessSetup';

interface BusinessSetupValidationSummaryProps {
  setup: Partial<BusinessSetup>;
  onFieldClick?: (fieldId: keyof BusinessSetup) => void;
}

export const BusinessSetupValidationSummary = ({ 
  setup, 
  onFieldClick 
}: BusinessSetupValidationSummaryProps) => {
  const allQuestions = businessSetupSections.flatMap(section => section.questions);
  const requiredQuestions = allQuestions.filter(q => q.required && shouldShowQuestion(q, setup));
  
  const missingFields = requiredQuestions.filter(q => {
    const value = setup[q.id];
    return value === undefined || value === null || value === '';
  });

  const completedFields = requiredQuestions.filter(q => {
    const value = setup[q.id];
    return value !== undefined && value !== null && value !== '';
  });

  if (missingFields.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          All required fields are complete! You can now finish your business setup.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-700 font-medium">
              {missingFields.length} required field{missingFields.length > 1 ? 's' : ''} remaining:
            </span>
            <Badge variant="outline" className="bg-white">
              {completedFields.length}/{requiredQuestions.length} complete
            </Badge>
          </div>
          
          <div className="space-y-2">
            {missingFields.map(field => (
              <div 
                key={field.id}
                className={`text-sm p-2 rounded border border-orange-200 bg-white ${
                  onFieldClick ? 'cursor-pointer hover:bg-orange-50' : ''
                }`}
                onClick={() => onFieldClick?.(field.id)}
              >
                <div className="font-medium text-orange-900">{field.label}</div>
                {field.description && (
                  <div className="text-orange-700 text-xs mt-1">{field.description}</div>
                )}
                {field.dependsOn && (
                  <div className="text-orange-600 text-xs mt-1">
                    • Depends on: {field.dependsOn.field} = {field.dependsOn.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};