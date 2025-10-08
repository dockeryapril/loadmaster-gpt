import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Load } from '@/types/load';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';
import { Channel, Tone } from '@/features/negotiation/templates';

export function useSupabaseLoads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const pendingMutations = useRef<(() => Promise<any>)[]>([]);

  const handleOffline = (retry?: () => Promise<any>) => {
    toast({
      title: "Connection lost",
      description: "Save will retry when online",
      variant: "destructive",
    });
    if (retry) pendingMutations.current.push(retry);
  };

  const isNetworkError = (error: any) =>
    error instanceof Error &&
    (error.message?.toLowerCase().includes('failed to fetch') ||
     error.message?.toLowerCase().includes('network'));

  const isJWTExpiredError = (error: any) =>
    error.message?.includes('JWT expired') || 
    error.message?.includes('PGRST303');

  useEffect(() => {
    const flushQueue = async () => {
      const queue = [...pendingMutations.current];
      pendingMutations.current = [];
      for (const fn of queue) {
        try {
          await fn();
        } catch (err) {
          logError('Retry failed:', err);
        }
      }
    };
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, []);

  // Fetch loads from Supabase
  const fetchLoads = async (retryCount = 0) => {
    if (!user) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Failed to load your saved loads.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Check for JWT expiration
        if (isJWTExpiredError(error)) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          if (retryCount < 2) {
            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError) {
              // Retry the request with refreshed token
              console.log('✅ Session refreshed, retrying loads fetch...');
              return fetchLoads(retryCount + 1);
            } else {
              console.error('❌ Failed to refresh session:', refreshError);
              logError('Failed to refresh session:', refreshError);
            }
          } else {
            console.error('❌ Max retries exceeded for loads fetch');
            toast({
              title: "Authentication expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
            return;
          }
        }
        
        throw error;
      }

      // Transform database data to match Load interface
      const transformedLoads: Load[] = (data || []).map(load => ({
        id: load.id,
        origin: load.origin,
        destination: load.destination,
        miles: Number(load.miles),
        rate: Number(load.rate),
        fsc: Number(load.fsc || 0),
        tolls: Number(load.tolls || 0),
        weight: load.weight ? Number(load.weight) : undefined,
        deadheadMiles: Number(load.deadhead_miles || 0),
        fuelCost: Number(load.fuel_cost || 0),
        rpm: Number(load.rpm),
        profit: Number(load.profit),
        quality: load.quality as 'excellent' | 'good' | 'fair' | 'poor',
        tags: load.tags || [],
        createdAt: new Date(load.created_at),
        notes: load.notes || undefined,
        negotiationChannel: (load.negotiation_channel as Channel) || undefined,
        negotiationTone: (load.negotiation_tone as Tone) || undefined,
        negotiationScripts: load.negotiation_scripts as { ask: string; settle: string; bottom: string; } || undefined,
      }));

      setLoads(transformedLoads);
      console.log('✅ Loads fetched successfully');
    } catch (error: any) {
      logError('Error fetching loads:', error);
      
      if (isNetworkError(error)) {
        toast({
          title: "Connection lost",
          description: "Failed to load your saved loads.",
          variant: "destructive",
        });
      } else if (isJWTExpiredError(error)) {
        toast({
          title: "Authentication expired",
          description: "Please refresh the page or sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading data",
          description: "Failed to load your saved loads.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Save a new load to Supabase
  const saveLoad = async (loadData: Omit<Load, 'id' | 'createdAt'>) => {
    if (!user) return;

    if (!navigator.onLine) {
      handleOffline(() => saveLoad(loadData));
      return;
    }

    try {
      const creationTimestamp = new Date().toISOString();
      const loadNumber = (loadData as any).loadNumber;

      let duplicateQuery: any = supabase
        .from('loads')
        .select('id')
        .eq('user_id', user.id)
        .eq('origin', loadData.origin)
        .eq('destination', loadData.destination);

      duplicateQuery = loadNumber
        ? duplicateQuery.eq('load_number', loadNumber)
        : duplicateQuery.eq('created_at', creationTimestamp);

      const { data: existingLoad, error: dupError } = await duplicateQuery.limit(1);

      if (dupError) throw dupError;

      if (existingLoad && existingLoad.length > 0) {
        toast({
          title: 'Duplicate load',
          description: 'This load seems already entered.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('loads')
        .insert([
          {
            user_id: user.id,
            origin: loadData.origin,
            destination: loadData.destination,
            miles: loadData.miles,
            rate: loadData.rate,
            fsc: loadData.fsc || 0,
            tolls: loadData.tolls || 0,
            weight: loadData.weight,
            deadhead_miles: loadData.deadheadMiles || 0,
            fuel_cost: loadData.fuelCost || 0,
            rpm: loadData.rpm,
            profit: loadData.profit,
            quality: loadData.quality,
            tags: loadData.tags,
            notes: loadData.notes,
            created_at: creationTimestamp,
            negotiation_channel: loadData.negotiationChannel || null,
            negotiation_tone: loadData.negotiationTone || null, 
            negotiation_scripts: loadData.negotiationScripts || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new load to the local state
      const newLoad: Load = {
        id: data.id,
        origin: data.origin,
        destination: data.destination,
        miles: Number(data.miles),
        rate: Number(data.rate),
        fsc: Number(data.fsc || 0),
        tolls: Number(data.tolls || 0),
        weight: data.weight ? Number(data.weight) : undefined,
        deadheadMiles: Number(data.deadhead_miles || 0),
        fuelCost: Number(data.fuel_cost || 0),
        rpm: Number(data.rpm),
        profit: Number(data.profit),
        quality: data.quality as 'excellent' | 'good' | 'fair' | 'poor',
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        notes: data.notes || undefined,
        negotiationChannel: (data.negotiation_channel as Channel) || undefined,
        negotiationTone: (data.negotiation_tone as Tone) || undefined,
        negotiationScripts: data.negotiation_scripts as { ask: string; settle: string; bottom: string; } || undefined,
      };

      setLoads(prev => [newLoad, ...prev]);

      toast({
        title: "Load saved",
        description: "Your load has been saved successfully.",
      });

      return newLoad;
    } catch (error: any) {
      logError('Error saving load:', error);
      if (isNetworkError(error)) {
        handleOffline(() => saveLoad(loadData));
      } else {
        toast({
          title: "Error saving load",
          description: error.message || "Failed to save the load.",
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  // Delete a load from Supabase
  const deleteLoad = async (id: string) => {
    if (!user) return;

    if (!navigator.onLine) {
      handleOffline(() => deleteLoad(id));
      return;
    }

    try {
      const { error } = await supabase
        .from('loads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLoads(prev => prev.filter(load => load.id !== id));

      toast({
        title: "Load deleted",
        description: "The load has been deleted successfully.",
        variant: "destructive",
      });
    } catch (error: any) {
      logError('Error deleting load:', error);
      if (isNetworkError(error)) {
        handleOffline(() => deleteLoad(id));
      } else {
        toast({
          title: "Error deleting load",
          description: error.message || "Failed to delete the load.",
          variant: "destructive",
        });
      }
    }
  };

  // Update an existing load
  const updateLoad = async (id: string, loadData: Omit<Load, 'id' | 'createdAt'>) => {
    if (!user) return;

    // Validate that id is a valid UUID
    if (!id || typeof id !== 'string' || id === 'undefined' || id.trim() === '') {
      toast({
        title: "Invalid load ID",
        description: "Cannot update load: invalid ID provided.",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.onLine) {
      handleOffline(() => updateLoad(id, loadData));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('loads')
        .update({
          origin: loadData.origin,
          destination: loadData.destination,
          miles: loadData.miles,
          rate: loadData.rate,
          fsc: loadData.fsc || 0,
          tolls: loadData.tolls || 0,
          weight: loadData.weight,
          deadhead_miles: loadData.deadheadMiles || 0,
          fuel_cost: loadData.fuelCost || 0,
          rpm: loadData.rpm,
          profit: loadData.profit,
          quality: loadData.quality,
          tags: loadData.tags,
          notes: loadData.notes,
          negotiation_channel: loadData.negotiationChannel || null,
          negotiation_tone: loadData.negotiationTone || null,
          negotiation_scripts: loadData.negotiationScripts || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update the load in local state
      const updatedLoad: Load = {
        id: data.id,
        origin: data.origin,
        destination: data.destination,
        miles: Number(data.miles),
        rate: Number(data.rate),
        fsc: Number(data.fsc || 0),
        tolls: Number(data.tolls || 0),
        weight: data.weight ? Number(data.weight) : undefined,
        deadheadMiles: Number(data.deadhead_miles || 0),
        fuelCost: Number(data.fuel_cost || 0),
        rpm: Number(data.rpm),
        profit: Number(data.profit),
        quality: data.quality as 'excellent' | 'good' | 'fair' | 'poor',
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        notes: data.notes || undefined,
        negotiationChannel: (data.negotiation_channel as Channel) || undefined,
        negotiationTone: (data.negotiation_tone as Tone) || undefined,
        negotiationScripts: data.negotiation_scripts as { ask: string; settle: string; bottom: string; } || undefined,
      };

      setLoads(prev => prev.map(load => load.id === id ? updatedLoad : load));

      toast({
        title: "Load updated",
        description: "Your load has been updated successfully.",
      });

      return updatedLoad;
    } catch (error: any) {
      logError('Error updating load:', error);
      if (isNetworkError(error)) {
        handleOffline(() => updateLoad(id, loadData));
      } else {
        toast({
          title: "Error updating load",
          description: error.message || "Failed to update the load.",
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchLoads();
    }
  }, [user]);

  // Delete all loads permanently
  const deleteAllLoads = async () => {
    if (!user) return;

    if (!navigator.onLine) {
      handleOffline(() => deleteAllLoads());
      return;
    }

    try {
      // Get count of loads to delete
      const { data: loadsToDelete, error: fetchError } = await supabase
        .from('loads')
        .select('id')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (!loadsToDelete || loadsToDelete.length === 0) {
        return { deletedCount: 0 };
      }

      // Delete from loads table
      const { error: deleteError } = await supabase
        .from('loads')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setLoads([]);

      const deletedCount = loadsToDelete.length;

      toast({
        title: "All loads deleted",
        description: `${deletedCount} loads have been permanently deleted.`,
      });

      return { deletedCount };
    } catch (error: any) {
      logError('Error deleting loads:', error);
      if (isNetworkError(error)) {
        handleOffline(() => deleteAllLoads());
      } else {
        toast({
          title: "Error deleting loads",
          description: error.message || "Failed to delete loads.",
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  return {
    loads,
    loading,
    saveLoad,
    deleteLoad,
    updateLoad,
    deleteAllLoads,
    refetch: fetchLoads,
  };
}