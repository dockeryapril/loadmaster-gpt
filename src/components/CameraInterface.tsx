import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface CameraInterfaceProps {
  stream: MediaStream;
  onCapture: (file: File) => void;
  onClose: () => void;
  /** The element that triggered the camera interface */
  triggerElement?: HTMLElement | null;
}

export function CameraInterface({ stream, onCapture, onClose, triggerElement }: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvasRef.current = null;
      }
      setCapturedImage(null);
    };
  }, [stream]);

  // Focus the capture button when the interface opens or when retaking a photo
  useEffect(() => {
    if (!capturedImage) {
      captureButtonRef.current?.focus();
    }
  }, [capturedImage]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Convert to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            // Store captured image preview
            setCapturedImage(canvas.toDataURL());
            setStatusMessage('Photo captured.');
          } else {
            setStatusMessage('Capture failed.');
          }
        }, 'image/jpeg', 0.9);
      } else {
        setStatusMessage('Capture failed.');
      }
    } else {
      setStatusMessage('Capture failed.');
    }
  };

  const confirmCapture = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          onCapture(file);
          setStatusMessage('Photo saved.');
          handleClose();
        } else {
          setStatusMessage('Failed to save photo.');
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const handleClose = useCallback(() => {
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
      canvasRef.current = null;
    }
    setCapturedImage(null);
    onClose();
    triggerElement?.focus();
  }, [stream, onClose, triggerElement]);

  useFocusTrap(dialogRef, handleClose);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black z-50 flex flex-col outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-dialog-title"
      tabIndex={-1}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 text-white">
        <h2 id="camera-dialog-title" className="text-lg font-semibold">Take Photo</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </Button>
      </header>

      {/* Camera/Preview Area */}
      <main className="flex-1 relative">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Overlay guide */}
        {!capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/50 rounded-lg w-[90%] max-w-xs sm:max-w-md md:max-w-lg aspect-[4/3] flex items-center justify-center">
              <p className="text-white/70 text-xs sm:text-sm text-center px-2 sm:px-4">
                Align your load document in the frame and ensure good lighting
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Controls */}
      <footer className="p-4 sm:p-6 bg-black">
        {!capturedImage ? (
          <div className="flex justify-center">
            <Button
              ref={captureButtonRef}
              onClick={capturePhoto}
              size="lg"
              className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-white hover:bg-white/90 text-black"
              aria-label="Capture photo"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-3 sm:gap-4">
            <Button
              onClick={retakePhoto}
              variant="outline"
              className="flex-1 max-w-[9rem] sm:max-w-32 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button
              onClick={confirmCapture}
              className="flex-1 max-w-[9rem] sm:max-w-32 bg-primary hover:bg-primary/90"
            >
              <Check className="mr-2 h-4 w-4" />
              Use Photo
            </Button>
          </div>
        )}
      </footer>
      <div aria-live="polite" className="sr-only">{statusMessage}</div>
    </div>
  );
}
