import { useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadEntrySnapshot } from "@/types/mvp";

export function useCloudSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Sync local decisions to cloud (with rate limiting)
  const syncToCloud = async (decisions: LoadEntrySnapshot[]) => {
    if (!user || decisions.length === 0) return;

    // Rate limit: Only sync once per minute
    const now = Date.now();
    const lastSync = sessionStorage.getItem("last_sync_time");
    if (lastSync && now - parseInt(lastSync) < 60000) {
      return; // Skip sync if less than 1 minute since last sync
    }

    setIsSyncing(true);
    try {
      // Only sync the last 50 decisions to reduce egress
      const recentDecisions = decisions.slice(-50);

      const loads = recentDecisions.map((decision) => ({
        id: decision.id,
        user_id: user.id,
        origin: decision.origin,
        destination: decision.destination,
        miles: decision.miles,
        deadhead_miles: decision.deadheadMiles ?? 0,
        rate: decision.rate,
        fsc: decision.fsc,
        tolls: decision.tolls,
        fuel_cost: decision.fuelCost,
        rpm: decision.rpm,
        profit: decision.profit,
        quality: "good" as const,
        notes: decision.notes,
        outcome: decision.outcome,
        counter_result: decision.counterResult,
        final_rate: decision.finalRate,
        created_at: decision.createdAt,
      }));

      const { error } = await supabase
        .from("loads")
        .upsert(loads, { onConflict: "id" });

      if (error) throw error;

      sessionStorage.setItem("last_sync_time", now.toString());
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
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
