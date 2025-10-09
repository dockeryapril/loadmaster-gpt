import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadEntrySnapshot } from '@/types/mvp';
import { useToast } from './use-toast';

export function useCloudSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Sync local decisions to cloud
  const syncToCloud = async (decisions: LoadEntrySnapshot[]) => {
    if (!user || decisions.length === 0) return;

    setIsSyncing(true);
    try {
      const loads = decisions.map(decision => ({
        id: decision.id,
        user_id: user.id,
        origin: decision.origin,
        destination: decision.destination,
        miles: decision.miles,
        rate: decision.rate,
        fsc: decision.fsc,
        tolls: decision.tolls,
        fuel_cost: decision.fuelCost,
        rpm: decision.rpm,
        profit: decision.profit,
        quality: 'good' as const,
        notes: decision.notes,
        created_at: decision.createdAt,
      }));

      const { error } = await supabase
        .from('loads')
        .upsert(loads, { onConflict: 'id' });

      if (error) throw error;

      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      // Silently fail - sync is optional and data is saved locally
    } finally {
      setIsSyncing(false);
    }
  };


  return {
    isSyncing,
    lastSyncedAt,
    syncToCloud,
  };
}
