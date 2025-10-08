import { useDecisionStore } from '@/store/useDecisionStore';
import { exportDecisionsToCSV } from '@/utils/csvExport';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function ExportButton() {
  const history = useDecisionStore(state => state.history);

  const handleExport = () => {
    try {
      if (history.length === 0) {
        toast.error('No history to export', {
          description: 'Log some decisions first before exporting.',
        });
        return;
      }

      exportDecisionsToCSV(history);
      
      toast.success('Export successful', {
        description: `Exported ${history.length} decision${history.length === 1 ? '' : 's'} to CSV.`,
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An error occurred while exporting.',
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={history.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
