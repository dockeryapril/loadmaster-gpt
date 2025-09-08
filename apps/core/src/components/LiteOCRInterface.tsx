import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2, X } from 'lucide-react';

interface LiteOCRInterfaceProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function LiteOCRInterface({ onSuccess, onClose }: LiteOCRInterfaceProps) {
  const [processing, setProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            handleFileUpload(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }
    stopCamera();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File | Blob) => {
    setProcessing(true);
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessing(false);
    onSuccess();
  };

  if (showCamera) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                onClick={stopCamera}
                className="bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processing) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Processing Image</h3>
              <p className="text-sm text-muted-foreground">
                Extracting load information from your image...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add Load Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="h-20 flex-col gap-2"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Upload Image</span>
        </Button>
        
        <Button
          onClick={startCamera}
          variant="outline"
          className="h-20 flex-col gap-2"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Take Photo</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}