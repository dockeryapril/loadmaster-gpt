import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, AlertTriangle } from 'lucide-react';
import { DetectedField } from '@/utils/SmartFieldDetector';

interface OCRCorrectionInterfaceProps {
  detectedFields: DetectedField[];
  rawText: string;
  onFieldCorrection: (field: string, value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  overallConfidence: 'high' | 'medium' | 'low';
  warnings?: string[];
}

export function OCRCorrectionInterface({
  detectedFields,
  rawText,
  onFieldCorrection,
  onConfirm,
  onCancel,
  overallConfidence,
  warnings
}: OCRCorrectionInterfaceProps) {
  console.log('OCRCorrectionInterface render:', { 
    detectedFields, 
    rawText: rawText?.length, 
    overallConfidence, 
    warnings 
  });

  // Add error boundary for missing data
  if (!detectedFields) {
    console.error('OCRCorrectionInterface: detectedFields is null/undefined');
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Error: No field data provided</p>
        <Button onClick={onCancel} className="mt-2">Cancel</Button>
      </div>
    );
  }
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'bg-success/10 text-success border-success/20',
      medium: 'bg-warning text-warning-foreground border-warning',
      low: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    
    const icons = {
      high: <Check className="w-3 h-3" />,
      medium: <AlertTriangle className="w-3 h-3" />,
      low: <X className="w-3 h-3" />
    };

    return (
      <Badge variant="outline" className={variants[confidence]}>
        {icons[confidence]}
        <span className="ml-1 capitalize">{confidence}</span>
      </Badge>
    );
  };

  const getFieldDisplayName = (field: string) => {
    const names = {
      miles: 'Miles',
      rate: 'Rate ($)',
      origin: 'Origin',
      destination: 'Destination',
      deadhead: 'Deadhead Miles',
      weight: 'Weight (lbs)',
      fsc: 'Fuel Surcharge ($)',
      tolls: 'Tolls ($)'
    };
    return names[field as keyof typeof names] || field;
  };

  const needsReview = detectedFields.filter(f => f.confidence === 'low' || f.confidence === 'medium');
  const highConfidence = detectedFields.filter(f => f.confidence === 'high');

  return (
    <div className="space-y-6">
      {/* Header with overall confidence */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Review Detected Fields</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Confidence:</span>
          {getConfidenceBadge(overallConfidence)}
        </div>
      </div>

      {warnings && warnings.length > 0 && (
        <Card className="p-4 bg-warning/10 border-warning/20">
          <h4 className="text-sm font-medium text-warning-foreground mb-2">Warnings</h4>
          <ul className="list-disc list-inside text-sm text-warning-foreground/80">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left side: Original text */}
        <Card className="p-6">
          <Label className="text-sm font-medium mb-3">Original Image Text</Label>
          <Textarea
            value={rawText}
            readOnly
            className="w-full h-96 resize-none bg-muted text-sm"
          />
        </Card>

        {/* Right side: Detected fields */}
        <Card className="p-6">
          <Label className="text-sm font-medium mb-4">Detected Fields</Label>
          
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* High confidence fields */}
            {highConfidence.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Auto-filled (High Confidence)
                </h4>
                <div className="space-y-3">
                  {highConfidence.map((field, index) => (
                    <div key={`high-${index}`} className="space-y-2">
                      <Label className="text-sm text-success font-medium">
                        {getFieldDisplayName(field.field)}:
                      </Label>
                      <div className="flex items-center gap-3 p-4 border border-success/20 bg-success/5 rounded-lg">
                        <Input
                          value={field.value || ''}
                          onChange={(e) => onFieldCorrection(field.field, e.target.value)}
                          className="flex-1 bg-background h-10"
                        />
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fields needing review */}
            {needsReview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Please Review (Uncertain)
                </h4>
                <div className="space-y-3">
                  {needsReview.map((field, index) => (
                    <div key={`review-${index}`} className="space-y-2">
                      <Label className="text-sm text-destructive font-medium">
                        {getFieldDisplayName(field.field)}:
                      </Label>
                      <div className="flex items-center gap-3 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                        <Input
                          value={field.value || ''}
                          onChange={(e) => onFieldCorrection(field.field, e.target.value)}
                          className="flex-1 bg-background focus-visible:border-destructive h-10"
                          placeholder={`Enter ${getFieldDisplayName(field.field).toLowerCase()}`}
                        />
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detectedFields.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                <p className="text-base font-medium">No fields could be automatically detected.</p>
                <p className="text-sm mt-1">Please enter the load details manually.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          className="bg-primary hover:bg-primary/90"
        >
          Apply to Load Calculator
        </Button>
      </div>
    </div>
  );
}