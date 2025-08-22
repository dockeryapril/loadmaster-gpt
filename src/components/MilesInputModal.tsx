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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Miles Not Detected</DialogTitle>
          <DialogDescription>
            We couldn't detect the miles from your image. Please enter the distance manually to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="miles-input">Distance (miles)</Label>
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

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!miles.trim()}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}