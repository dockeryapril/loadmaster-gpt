import { useState } from 'react';
import { Trash2, Download, Archive, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Load } from '@/types/load';

interface ClearAllLoadsDialogProps {
  loads: Load[];
  onClearAll: (exportToCsv: boolean) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ClearAllLoadsDialog({ loads, onClearAll, trigger }: ClearAllLoadsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportToCsv, setExportToCsv] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClearAll(exportToCsv);
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing loads:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Clear All
    </Button>
  );

  if (loads.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Clear All Loads?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to clear all <strong>{loads.length}</strong> loads from your history?
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="export-csv" 
                  checked={exportToCsv}
                  onCheckedChange={(checked) => setExportToCsv(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="export-csv"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to CSV before clearing
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Download a backup of all your loads data
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 pt-2 border-t">
                <Archive className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="grid gap-1.5 leading-none">
                  <p className="text-sm font-medium">Loads will be archived</p>
                  <p className="text-xs text-muted-foreground">
                    Your loads will be safely archived, not permanently deleted
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={isClearing}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {exportToCsv ? 'Exporting & Clearing...' : 'Clearing...'}
              </>
            ) : (
              'Clear All Loads'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}