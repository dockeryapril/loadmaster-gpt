import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface MilesInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (miles: string) => void;
}

export function MilesInputModal({ isOpen, onClose, onConfirm }: MilesInputModalProps) {
  const [miles, setMiles] = useState('');

  const handleConfirm = () => {
    if (miles.trim()) {
      onConfirm(miles.trim());
      setMiles('');
    }
  };

  const handleClose = () => {
    setMiles('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border bg-card">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto p-3 bg-muted rounded-full w-fit">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <DialogTitle className="text-lg font-semibold">Miles Not Detected</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We couldn't detect the miles from your image. Please enter the distance manually to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="miles-input" className="text-sm font-medium">Distance (miles)</Label>
          <Input
            id="miles-input"
            type="number"
            placeholder="Enter miles..."
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-center"
            autoFocus
          />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!miles.trim()}
            className="flex-1"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}