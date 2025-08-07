import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function OCRUpload({ onTextExtracted, isProcessing, setIsProcessing }: OCRUploadProps) {
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      onTextExtracted(text);
      toast({
        title: "Text Extracted",
        description: "Load details extracted from image. Please review and edit as needed.",
      });
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Extraction Failed",
        description: "Could not extract text from image. Please try again or enter manually.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleCameraCapture = () => {
    // For mobile camera access
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processImage(file);
      }
    };
    input.click();
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload Load Screenshot</h3>
            <p className="text-sm text-muted-foreground">
              Take a photo or upload an image of your load offer
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCameraCapture}
              disabled={isProcessing}
              className="h-16 flex-col gap-2"
              variant="outline"
            >
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <span className="text-xs">Take Photo</span>
            </Button>
            
            <label className="cursor-pointer">
              <Button
                asChild
                disabled={isProcessing}
                className="h-16 flex-col gap-2 w-full"
                variant="outline"
              >
                <div>
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                  <span className="text-xs">Upload Image</span>
                </div>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>
          
          {isProcessing && (
            <div className="text-sm text-muted-foreground">
              Processing image... This may take a moment.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}