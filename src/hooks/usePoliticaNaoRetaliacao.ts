import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PoliticaNaoRetaliacaoVersion {
  id: string;
  version_number: number;
  version_code: string;
  content: string;
  justification: string;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

export function usePoliticaNaoRetaliacao() {
  const [politica, setPolitica] = useState<PoliticaNaoRetaliacaoVersion | null>(null);
  const [versions, setVersions] = useState<PoliticaNaoRetaliacaoVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolitica = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('politica_nao_retaliacao_versions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) setPolitica(data as PoliticaNaoRetaliacaoVersion);
    } catch (err) {
      console.error('Erro ao buscar política:', err);
      setError('Erro ao carregar política de não retaliação');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('politica_nao_retaliacao_versions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const list = (data || []) as PoliticaNaoRetaliacaoVersion[];
      const ids = Array.from(new Set(list.map(v => v.updated_by).filter(Boolean))) as string[];
      let map: Record<string, { full_name: string | null; email: string | null }> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', ids);
        (profiles || []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email }; });
      }
      const enriched = list.map(v => ({
        ...v,
        author_name: v.updated_by ? map[v.updated_by]?.full_name ?? undefined : undefined,
        author_email: v.updated_by ? map[v.updated_by]?.email ?? undefined : undefined
      }));
      setVersions(enriched);
    } catch (err) {
      console.error('Erro ao listar versões:', err);
    }
  };

  const savePolitica = async (content: string, justification: string, bump: 'major' | 'minor' | 'patch' = 'patch') => {
    try {
      setError(null);
      const { data: last } = await supabase
        .from('politica_nao_retaliacao_versions')
        .select('version_code')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const parseCode = (code: string | undefined) => {
        if (!code) return { major: 0, minor: 0, patch: 0 };
        const [ma, mi, pa] = code.split('.').map((n) => parseInt(n, 10));
        return { major: ma || 0, minor: mi || 0, patch: pa || 0 };
      };
      const cur = parseCode(last?.version_code);
      let next = { ...cur };
      if (bump === 'major') { next.major += 1; next.minor = 0; next.patch = 0; }
      else if (bump === 'minor') { next.minor += 1; next.patch = 0; }
      else { next.patch += 1; }
      const nextCode = `${next.major}.${next.minor}.${next.patch}`;

      const { error } = await supabase
        .from('politica_nao_retaliacao_versions')
        .insert([{ content, justification, version_number: cur.major + cur.minor + cur.patch + 1, version_code: nextCode }]);

      if (error) throw error;

      await fetchPolitica();
      await fetchVersions();
      return true;
    } catch (err) {
      console.error('Erro ao salvar política:', err);
      setError('Erro ao salvar política de não retaliação');
      return false;
    }
  };

  useEffect(() => {
    fetchPolitica();
    fetchVersions();
  }, []);

  return {
    politica,
    loading,
    error,
    savePolitica,
    refetch: async () => { await fetchPolitica(); await fetchVersions(); },
    versions,
    async restoreVersion(versionId: string, justification: string, bump: 'major' | 'minor' | 'patch' = 'patch') {
      try {
        const { data } = await supabase
          .from('politica_nao_retaliacao_versions')
          .select('content, version_code')
          .eq('id', versionId)
          .maybeSingle();
        const { data: last } = await supabase
          .from('politica_nao_retaliacao_versions')
          .select('version_code')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const parseCode = (code: string | undefined) => {
          if (!code) return { major: 0, minor: 0, patch: 0 };
          const [ma, mi, pa] = code.split('.').map((n) => parseInt(n, 10));
          return { major: ma || 0, minor: mi || 0, patch: pa || 0 };
        };
        const cur = parseCode(last?.version_code);
        let next = { ...cur };
        if (bump === 'major') { next.major += 1; next.minor = 0; next.patch = 0; }
        else if (bump === 'minor') { next.minor += 1; next.patch = 0; }
        else { next.patch += 1; }
        const nextCode = `${next.major}.${next.minor}.${next.patch}`;
        if (!data?.content) throw new Error('Versão não encontrada');
        const { error } = await supabase
          .from('politica_nao_retaliacao_versions')
          .insert([{ content: data.content, justification, version_code: nextCode, version_number: cur.major + cur.minor + cur.patch + 1 }]);
        if (error) throw error;
        await fetchPolitica();
        await fetchVersions();
        return true;
      } catch (err) {
        console.error('Erro ao restaurar versão:', err);
        setError('Erro ao restaurar versão');
        return false;
      }
    }
  };
}
