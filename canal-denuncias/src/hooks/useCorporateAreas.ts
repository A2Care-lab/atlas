import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CorporateArea {
  id: string;
  name: string;
  status: 'active' | 'paused';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseCorporateAreasReturn {
  areas: CorporateArea[];
  loading: boolean;
  error: string | null;
  createArea: (name: string) => Promise<void>;
  updateArea: (id: string, name: string) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  toggleAreaStatus: (id: string, currentStatus: 'active' | 'paused') => Promise<void>;
  refreshAreas: () => Promise<void>;
}

export function useCorporateAreas(): UseCorporateAreasReturn {
  const [areas, setAreas] = useState<CorporateArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('corporate_areas')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setAreas(data || []);
    } catch (err) {
      console.error('Erro ao buscar áreas corporativas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar áreas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createArea = useCallback(async (name: string) => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error: supabaseError } = await supabase
        .from('corporate_areas')
        .insert([
          { 
            name: name.trim(),
            status: 'active',
            created_by: user.id
          }
        ]);

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchAreas();
    } catch (err) {
      console.error('Erro ao criar área:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar área');
      throw err;
    }
  }, [fetchAreas]);

  const updateArea = useCallback(async (id: string, name: string) => {
    try {
      setError(null);
      
      const { error: supabaseError } = await supabase
        .from('corporate_areas')
        .update({ name: name.trim() })
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchAreas();
    } catch (err) {
      console.error('Erro ao atualizar área:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar área');
      throw err;
    }
  }, [fetchAreas]);

  const deleteArea = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const { error: supabaseError } = await supabase
        .from('corporate_areas')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchAreas();
    } catch (err) {
      console.error('Erro ao excluir área:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir área');
      throw err;
    }
  }, [fetchAreas]);

  const toggleAreaStatus = useCallback(async (id: string, currentStatus: 'active' | 'paused') => {
    try {
      setError(null);
      
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error: supabaseError } = await supabase
        .from('corporate_areas')
        .update({ status: newStatus })
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchAreas();
    } catch (err) {
      console.error('Erro ao alternar status da área:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alternar status');
      throw err;
    }
  }, [fetchAreas]);

  const refreshAreas = useCallback(async () => {
    await fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  return {
    areas,
    loading,
    error,
    createArea,
    updateArea,
    deleteArea,
    toggleAreaStatus,
    refreshAreas
  };
}