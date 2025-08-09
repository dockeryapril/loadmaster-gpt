import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Calculator, ArrowRight } from 'lucide-react';
import { OCRUpload } from './OCRUpload';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';

interface LoadEntryMethodProps {
  onFieldsDetected: (result: FieldDetectionResult) => void;
  onManualEntry: () => void;
  onClose?: () => void;
}

export function LoadEntryMethod({ onFieldsDetected, onManualEntry, onClose }: LoadEntryMethodProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const { settings } = useSupabaseSettings();

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    onFieldsDetected(result);
  };

  const handleTextExtracted = (text: string) => {
    console.log('Text extracted:', text);
  };

  if (showOCR) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Extract Text from Image</h2>
          <p className="text-sm text-muted-foreground">
            Take a photo or upload an image of your load document
          </p>
        </div>
        
        <OCRUpload
          onTextExtracted={handleTextExtracted}
          onFieldsDetected={handleFieldsDetected}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          enableFuelCostTracking={settings.enableFuelCostTracking}
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowOCR(false)}
            disabled={isProcessing}
            className="w-full max-w-xs"
          >
            Back to Options
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Add New Load</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to enter your load information
        </p>
      </div>

      {/* OCR Options */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-3">Scan Load Document</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Recommended: Automatically extract information from images
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={() => setShowOCR(true)}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Upload Image</div>
                    <div className="text-sm text-muted-foreground">
                      Select photos from your device
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={() => setShowOCR(true)}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Take Photo</div>
                    <div className="text-sm text-muted-foreground">
                      Use your camera to capture load documents
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Entry Option */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <Button
            variant="outline"
            className="w-full h-auto p-0 border-2 hover:border-primary/50"
            onClick={onManualEntry}
          >
            <div className="flex items-center justify-center gap-4 p-4">
              <div className="p-3 rounded-full bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium">Manual Entry</div>
                <div className="text-sm text-muted-foreground">
                  Enter load details manually
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}