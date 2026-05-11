import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { useCorporateAreas } from './useCorporateAreas';

// Mock do Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [
            { id: '1', name: 'Recursos Humanos', status: 'active', created_at: '2024-01-01' },
            { id: '2', name: 'Tecnologia da Informação', status: 'active', created_at: '2024-01-01' }
          ],
          error: null
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user123' } }
      }))
    }
  }
}));

describe('useCorporateAreas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar as áreas corporativas inicialmente', async () => {
    const { result } = renderHook(() => useCorporateAreas());

    // Verificar estado inicial
    expect(result.current.loading).toBe(true);
    expect(result.current.areas).toEqual([]);
    expect(result.current.error).toBe(null);

    // Aguardar carregamento
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificar dados carregados
    expect(result.current.areas).toHaveLength(2);
    expect(result.current.areas[0].name).toBe('Recursos Humanos');
    expect(result.current.areas[1].name).toBe('Tecnologia da Informação');
  });

  it('deve criar uma nova área', async () => {
    const { result } = renderHook(() => useCorporateAreas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLength = result.current.areas.length;

    // Criar nova área
    await act(async () => {
      await result.current.createArea('Financeiro');
    });

    // Verificar se a área foi criada
    expect(supabase.from).toHaveBeenCalledWith('corporate_areas');
    expect(supabase.from('corporate_areas').insert).toHaveBeenCalledWith([
      { name: 'Financeiro', status: 'active', created_by: 'user123' }
    ]);
  });

  it('deve atualizar uma área existente', async () => {
    const { result } = renderHook(() => useCorporateAreas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Atualizar área
    await act(async () => {
      await result.current.updateArea('1', 'Recursos Humanos Atualizado');
    });

    // Verificar se a área foi atualizada
    expect(supabase.from).toHaveBeenCalledWith('corporate_areas');
    expect(supabase.from('corporate_areas').update).toHaveBeenCalledWith({
      name: 'Recursos Humanos Atualizado'
    });
  });

  it('deve alternar o status de uma área', async () => {
    const { result } = renderHook(() => useCorporateAreas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Alternar status
    await act(async () => {
      await result.current.toggleAreaStatus('1', 'active');
    });

    // Verificar se o status foi alterado
    expect(supabase.from).toHaveBeenCalledWith('corporate_areas');
    expect(supabase.from('corporate_areas').update).toHaveBeenCalledWith({
      status: 'paused'
    });
  });

  it('deve excluir uma área', async () => {
    const { result } = renderHook(() => useCorporateAreas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Excluir área
    await act(async () => {
      await result.current.deleteArea('1');
    });

    // Verificar se a área foi excluída
    expect(supabase.from).toHaveBeenCalledWith('corporate_areas');
    expect(supabase.from('corporate_areas').delete).toHaveBeenCalled();
  });
});