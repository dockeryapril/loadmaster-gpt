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
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      high: <Check className="w-3 h-3" />,
      medium: <AlertTriangle className="w-3 h-3" />,
      low: <X className="w-3 h-3" />
    };

    return (
      <Badge variant="outline" className={variants[confidence]}>
        {icons[confidence]}
        {confidence}
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
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side: Original text */}
        <Card className="p-4">
          <Label className="text-sm font-medium">Original Image Text</Label>
          <Textarea
            value={rawText}
            readOnly
            className="mt-2 h-64 resize-none bg-muted"
          />
        </Card>

        {/* Right side: Detected fields */}
        <Card className="p-4">
          <Label className="text-sm font-medium">Detected Fields</Label>
          
          <div className="mt-4 space-y-4">
            {/* High confidence fields */}
            {highConfidence.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">
                  Auto-filled (High Confidence)
                </h4>
                <div className="space-y-2">
                  {highConfidence.map((field, index) => (
                    <div key={`high-${index}`} className="flex items-center gap-2 p-2 border border-green-500 bg-gray-800/50 text-white rounded-md transition-colors">
                      <Label className="text-sm min-w-[100px] text-green-400 font-medium">
                        {getFieldDisplayName(field.field)}:
                      </Label>
                      <Input
                        value={field.value}
                        onChange={(e) => onFieldCorrection(field.field, e.target.value)}
                        className="flex-1 border-green-200 text-white"
                      />
                      {getConfidenceBadge(field.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fields needing review */}
            {needsReview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">
                  Please Review (Uncertain)
                </h4>
                <div className="space-y-2">
                  {needsReview.map((field, index) => (
                    <div key={`review-${index}`} className="flex items-center gap-2 p-2 border border-red-500 bg-gray-800/50 text-white rounded-md transition-colors">
                      <Label className="text-sm min-w-[100px] text-red-600 font-medium">
                        {getFieldDisplayName(field.field)}:
                      </Label>
                      <Input
                        value={field.value}
                        onChange={(e) => onFieldCorrection(field.field, e.target.value)}
                        className="flex-1 border-red-200 focus:border-red-300 text-white"
                        placeholder={`Enter ${getFieldDisplayName(field.field).toLowerCase()}`}
                      />
                      {getConfidenceBadge(field.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detectedFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No fields could be automatically detected.</p>
                <p className="text-sm">Please enter the load details manually.</p>
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