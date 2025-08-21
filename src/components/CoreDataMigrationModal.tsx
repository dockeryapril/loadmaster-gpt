import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCoreDataMigration } from '@/hooks/useCoreDataMigration';
import { Download, Loader2 } from 'lucide-react';

interface CoreDataMigrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoreDataMigrationModal({ open, onOpenChange }: CoreDataMigrationModalProps) {
  const { importCoreHistory, isImporting, coreItemCount } = useCoreDataMigration();

  const handleImport = async () => {
    const result = await importCoreHistory();
    if (result.imported > 0) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import LoadMasterLITE Data
          </DialogTitle>
          <DialogDescription>
            We found {coreItemCount} calculations from LoadMasterLITE. 
            Would you like to import them to your PRO account?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This will import your LITE calculations as load records and negotiations, 
            making them available in your full LoadMasterPRO dashboard.
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {coreItemCount} Records
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}