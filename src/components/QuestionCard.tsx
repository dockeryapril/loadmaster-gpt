import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { BusinessQuestion } from '@/types/businessSetup';

interface QuestionCardProps {
  question: BusinessQuestion;
  value: any;
  onChange: (value: any) => void;
  suggestion?: any;
  onApplySuggestion?: (value: any) => void;
}

export const QuestionCard = ({
  question,
  value,
  onChange,
  suggestion,
  onApplySuggestion
}: QuestionCardProps) => {
  const renderInput = () => {
    switch (question.type) {
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={question.placeholder}
            min={question.validation?.min}
            max={question.validation?.max}
            step={question.validation?.step}
            className="w-full"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={question.id}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={question.id} className="text-sm">
              {value ? 'Yes' : 'No'}
            </Label>
          </div>
        );

      case 'text':
        return question.id === 'special_arrangements' || question.id === 'notes' ? (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full min-h-[100px]"
          />
        ) : (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Question header */}
          <div>
            <Label className="text-base font-medium">
              {question.label}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {question.description}
              </p>
            )}
          </div>

          {/* AI suggestion */}
          {suggestion !== undefined && suggestion !== value && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-900">AI Suggestion:</p>
                <p className="text-amber-700">
                  {typeof suggestion === 'boolean' 
                    ? (suggestion ? 'Yes' : 'No')
                    : typeof suggestion === 'string' && question.options
                    ? question.options.find(opt => opt.value === suggestion)?.label || suggestion
                    : suggestion
                  }
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApplySuggestion?.(suggestion)}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Apply
              </Button>
            </div>
          )}

          {/* Input field */}
          <div className="space-y-2">
            {renderInput()}
          </div>

          {/* Validation hint */}
          {question.validation && question.type === 'number' && (
            <p className="text-xs text-muted-foreground">
              {question.validation.min !== undefined && question.validation.max !== undefined
                ? `Range: ${question.validation.min} - ${question.validation.max}`
                : question.validation.min !== undefined
                ? `Minimum: ${question.validation.min}`
                : question.validation.max !== undefined
                ? `Maximum: ${question.validation.max}`
                : ''
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};