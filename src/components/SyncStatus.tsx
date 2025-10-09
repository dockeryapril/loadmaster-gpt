import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SyncStatusProps {
  isSynced: boolean;
  isSyncing: boolean;
  isAuthenticated: boolean;
}

export function SyncStatus({ isSynced, isSyncing, isAuthenticated }: SyncStatusProps) {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/auth')}
        className="gap-2"
      >
        <CloudOff className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in to sync</span>
      </Button>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  if (isSynced) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cloud className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  }

  return null;
}
