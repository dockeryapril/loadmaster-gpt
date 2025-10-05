import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';

interface CoreHistoryItem {
  id: string;
  miles: number;
  offerAllIn: number;
  weightLbs?: number;
  pickupInHours?: number;
  weekend?: boolean;
  targetAllIn: number;
  anchorAllIn: number;
  floorAllIn: number;
  premiums: string[];
  strategy: string;
  timestamp: number;
  outcome?: 'pending' | 'accepted' | 'countered' | 'declined';
  finalAllIn?: number;
}

export function useCoreDataMigration() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const checkForCoreData = (): CoreHistoryItem[] => {
    try {
      const raw = localStorage.getItem('lm_core_history_v1');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      logError('Error reading Core data:', error);
      return [];
    }
  };

  const importCoreHistory = async (): Promise<{ imported: number }> => {
    if (isImporting) return { imported: 0 };

    setIsImporting(true);

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Import will retry when online",
        variant: "destructive",
      });
      setIsImporting(false);
      return { imported: 0 };
    }

    try {
      const coreItems = checkForCoreData();
      if (coreItems.length === 0) {
        return { imported: 0 };
      }

      let count = 0;

      for (const item of coreItems.slice(0, 200)) {
        // Create load record  
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        const { data: loadRow, error: loadError } = await supabase
          .from('loads')
          .insert({
            user_id: user.id,
            origin: 'Unknown Origin',
            destination: 'Unknown Destination', 
            miles: item.miles,
            rate: item.offerAllIn,
            weight: item.weightLbs || null,
            rpm: item.offerAllIn / item.miles,
            profit: item.offerAllIn,
            quality: 'good',
            tags: item.premiums || [],
            notes: `Imported from LoadMasterLITE. ${item.weekend ? 'Weekend pickup. ' : ''}Original calculation: Ask $${item.anchorAllIn}, Target $${item.targetAllIn}, Floor $${item.floorAllIn}`,
          })
          .select('id')
          .single();

        if (loadError) {
          logError('Error creating load:', loadError);
          continue;
        }

        // Create negotiation record if outcome exists
        if (item.outcome && ['accepted', 'countered', 'declined'].includes(item.outcome)) {
          await supabase.from('negotiations').insert({
            user_id: user.id,
            load_id: loadRow.id,
            original_offer: item.offerAllIn,
            target_rate: item.targetAllIn,
            anchor_rate: item.anchorAllIn,
            floor_rate: item.floorAllIn,
            final_rate: item.finalAllIn || null,
            outcome: item.outcome,
            strategy_used: item.strategy,
            iterations: 1,
          });
        }

        count++;
      }

      // Mark as migrated
      localStorage.setItem('lm_core_migrated', '1');
      
      toast({
        title: "Import Successful",
        description: `Imported ${count} records from LoadMasterLITE`,
      });

      return { imported: count };
    } catch (error: any) {
      logError('Error importing Core data:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Import failed due to network issues.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import Core data. Please try again.",
          variant: "destructive",
        });
      }
      return { imported: 0 };
    } finally {
      setIsImporting(false);
    }
  };

  const hasCoreData = (): boolean => {
    const items = checkForCoreData();
    const migrated = localStorage.getItem('lm_core_migrated');
    return items.length > 0 && !migrated;
  };

  return {
    importCoreHistory,
    hasCoreData,
    isImporting,
    coreItemCount: checkForCoreData().length,
  };
}