import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, Archive, Trash2 } from 'lucide-react';
import { Load } from '@/types/load';
import { useAuth } from '@/contexts/AuthContext';
import { getFeatureFlags } from '@/utils/featureFlags';

interface ClearAllLoadsDialogProps {
  loads: Load[];
  onClearAll: (exportToCsv: boolean) => Promise<void>;
}

export function ClearAllLoadsDialog({
  loads,
  onClearAll,
}: ClearAllLoadsDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { historyExport } = getFeatureFlags(user);
  const [exportToCsv, setExportToCsv] = useState(historyExport);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onClearAll(historyExport && exportToCsv);
      setOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loads.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-destructive" />
            Clear All Loads
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all {loads.length} loads? This action will archive your loads instead of permanently deleting them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {historyExport && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-csv"
                checked={exportToCsv}
                onCheckedChange={(checked) => setExportToCsv(!!checked)}
                disabled={isProcessing}
              />
              <label
                htmlFor="export-csv"
                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Download className="h-4 w-4" />
                Export to CSV before clearing
              </label>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <Archive className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Safe archiving</p>
                <p>Your loads will be moved to an archive table, not permanently deleted. This ensures your data remains recoverable if needed.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {exportToCsv ? 'Exporting & Archiving...' : 'Archiving...'}
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Clear All Loads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}