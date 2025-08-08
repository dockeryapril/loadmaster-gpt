import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Load } from '@/types/load';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseLoads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch loads from Supabase
  const fetchLoads = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      }));

      setLoads(transformedLoads);
    } catch (error: any) {
      console.error('Error fetching loads:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load your saved loads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save a new load to Supabase
  const saveLoad = async (loadData: Omit<Load, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loads')
        .insert([{
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
        }])
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
      };

      setLoads(prev => [newLoad, ...prev]);

      toast({
        title: "Load saved",
        description: "Your load has been saved successfully.",
      });

      return newLoad;
    } catch (error: any) {
      console.error('Error saving load:', error);
      toast({
        title: "Error saving load",
        description: error.message || "Failed to save the load.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete a load from Supabase
  const deleteLoad = async (id: string) => {
    if (!user) return;

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
      console.error('Error deleting load:', error);
      toast({
        title: "Error deleting load",
        description: error.message || "Failed to delete the load.",
        variant: "destructive",
      });
    }
  };

  // Update an existing load
  const updateLoad = async (id: string, loadData: Omit<Load, 'id' | 'createdAt'>) => {
    if (!user) return;

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
      };

      setLoads(prev => prev.map(load => load.id === id ? updatedLoad : load));

      toast({
        title: "Load updated",
        description: "Your load has been updated successfully.",
      });

      return updatedLoad;
    } catch (error: any) {
      console.error('Error updating load:', error);
      toast({
        title: "Error updating load",
        description: error.message || "Failed to update the load.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchLoads();
    }
  }, [user]);

  return {
    loads,
    loading,
    saveLoad,
    deleteLoad,
    updateLoad,
    refetch: fetchLoads,
  };
}