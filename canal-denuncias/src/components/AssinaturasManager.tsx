import { useState, useEffect } from 'react';
import { CreditCard, Filter, Plus, Edit, Trash2, Building, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ClearFiltersButton } from './ClearFiltersButton';
import { isAdminRole, isCorporateManagerRole } from '../utils/roles';

interface Assinatura {
  id: string;
  company_id: string;
  valor: number;
  usuarios: number;
  denuncias: number;
  whatsapp_monthly_limit?: number;
  ai_monthly_limit?: number;
  status: 'Ativa' | 'Suspensão Temporária' | 'Cancelada';
  created_at: string;
  companies: {
    name: string;
    cnpj: string | null;
  } | null;
}

export default function AssinaturasManager() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminRole(profile?.role);
  const isCorp = isCorporateManagerRole(profile?.role);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [filteredAssinaturas, setFilteredAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiUsage, setAiUsage] = useState<Record<string, { ai_limite: number; ai_consumidas: number }>>({});
  
  // Filtros
  const [empresaBusca, setEmpresaBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('all');
  const [inicioPeriodo, setInicioPeriodo] = useState('');
  const [fimPeriodo, setFimPeriodo] = useState('');
  
  // Paginação
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    carregarAssinaturas();
  }, [profile]);

  useEffect(() => {
    aplicarFiltros();
  }, [assinaturas, empresaBusca, statusFiltro, inicioPeriodo, fimPeriodo]);

  const carregarAssinaturas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('assinaturas')
        .select(`
          *,
          companies (
            name,
            cnpj
          )
        `)
        .order('created_at', { ascending: false });

      // Se não for admin, filtrar apenas a empresa do usuário (se aplicável)
      if (!isAdmin && profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      const list = data || [];
      setAssinaturas(list);

      // Carregar consumo de IA do mês para as empresas da lista
      const ids = Array.from(new Set(list.map((a) => a.company_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: uso, error: erroUso } = await supabase
          .from('assinaturas_ai_consumo')
          .select('*')
          .in('company_id', ids as any);
        if (!erroUso && uso) {
          const map: Record<string, { ai_limite: number; ai_consumidas: number }> = {};
          for (const r of uso as any[]) {
            map[r.company_id] = { ai_limite: Number(r.ai_limite || 0), ai_consumidas: Number(r.ai_consumidas || 0) };
          }
          setAiUsage(map);
        } else {
          setAiUsage({});
        }
      } else {
        setAiUsage({});
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtradas = assinaturas;

    if (empresaBusca) {
      const termo = empresaBusca.toLowerCase();
      filtradas = filtradas.filter(a => 
        (a.companies?.name?.toLowerCase().includes(termo)) || 
        (a.companies?.cnpj?.includes(termo))
      );
    }

    if (statusFiltro !== 'all') {
      filtradas = filtradas.filter(a => a.status === statusFiltro);
    }

    if (inicioPeriodo) {
      filtradas = filtradas.filter(a => new Date(a.created_at) >= new Date(inicioPeriodo));
    }

    if (fimPeriodo) {
      filtradas = filtradas.filter(a => new Date(a.created_at) <= new Date(fimPeriodo));
    }

    setFilteredAssinaturas(filtradas);
    setCurrentPage(1);
  };

  const abrirNovaAssinatura = () => {
    navigate('/admin/configuracoes/assinaturas/nova');
  };

  const editarAssinatura = (id: string) => {
    navigate(`/admin/configuracoes/assinaturas/${id}/editar`);
  };

  const excluirAssinatura = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta assinatura?')) return;

    try {
      const { error } = await supabase
        .from('assinaturas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      carregarAssinaturas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir assinatura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Suspensão Temporária':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Cancelada':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredAssinaturas.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredAssinaturas.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-full border border-emerald-500/30">
              <CreditCard className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Gestão de Assinaturas</h3>
              <p className="text-sm text-gray-400">
                {isCorp
                  ? 'Acompanhe a assinatura e consumo da sua empresa.'
                  : 'Gerencie os contratos e limites de uso das empresas.'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={abrirNovaAssinatura}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Assinatura
            </button>
          )}
        </div>

        {/* Card de Consumo de IA para visão corporativa (uma empresa) */}
        {isCorp && filteredAssinaturas.length > 0 && (
          (() => {
            const a = filteredAssinaturas[0];
            const uso = aiUsage[a.company_id] || { ai_limite: a.ai_monthly_limit || 0, ai_consumidas: 0 };
            const lim = Number(uso.ai_limite || a.ai_monthly_limit || 0);
            const cons = Number(uso.ai_consumidas || 0);
            const pct = lim > 0 ? Math.min(100, Math.round((cons / lim) * 100)) : 0;
            return (
              <div className="mt-2 mb-2 grid grid-cols-1 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-300">Consumo de IA (mês)</div>
                    <div className="text-sm text-gray-200 font-medium">{cons}/{lim || 0}</div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className={`h-2 ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">Atualizado em tempo real</div>
                </div>
              </div>
            );
          })()
        )}

        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Filter className="h-5 w-5 mr-2 text-sky-400" />
              Filtros
            </h3>
            <ClearFiltersButton onClick={() => { setEmpresaBusca(''); setStatusFiltro('all'); setInicioPeriodo(''); setFimPeriodo(''); }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-2">Buscar por empresa</label>
              <input
                type="text"
                value={empresaBusca}
                onChange={(e) => setEmpresaBusca(e.target.value)}
                placeholder="Nome ou CNPJ"
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [&>option]:bg-slate-800"
              >
                <option value="all">Todos</option>
                <option value="Ativa">Ativa</option>
                <option value="Suspensão Temporária">Suspensão Temporária</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Período (Início)</label>
              <input
                type="date"
                value={inicioPeriodo}
                onChange={(e) => setInicioPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{filteredAssinaturas.length} assinatura(s)</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Itens por página</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 border border-white/10 bg-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 [&>option]:bg-slate-800"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuários</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Denúncias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IA (mês)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Carregando...</td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Building className="mx-auto h-12 w-12 text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-300">Nenhuma assinatura encontrada</h3>
                    {isAdmin && (
                      <p className="mt-1 text-sm text-gray-500">Comece criando uma nova assinatura.</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((assinatura) => (
                  <tr key={assinatura.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="flex-shrink-0 h-5 w-5 text-gray-500" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {assinatura.companies?.name || 'Empresa não encontrada'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assinatura.companies?.cnpj || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      R$ {assinatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {assinatura.usuarios}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {assinatura.denuncias}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {(() => {
                        const uso = aiUsage[assinatura.company_id] || { ai_limite: assinatura.ai_monthly_limit || 0, ai_consumidas: 0 };
                        const lim = Number(uso.ai_limite || assinatura.ai_monthly_limit || 0);
                        const cons = Number(uso.ai_consumidas || 0);
                        const pct = lim > 0 ? Math.min(100, Math.round((cons / lim) * 100)) : 0;
                        return (
                          <div className="min-w-[160px]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{cons}/{lim || 0}</span>
                              <span className="text-[10px] text-gray-500">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-800 mt-1 overflow-hidden">
                              <div className={`${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'} h-1.5`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assinatura.status)}`}>
                        {assinatura.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(assinatura.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => editarAssinatura(assinatura.id)}
                              className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-600/30 hover:bg-sky-600/30 transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => excluirAssinatura(assinatura.id)}
                              className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {paginatedItems.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400">Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAssinaturas.length)} de {filteredAssinaturas.length}</p>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded-md border border-white/10 text-sm text-gray-300 disabled:opacity-50 hover:bg-white/5 transition-colors"
              disabled={page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300">Página {page} de {totalPages}</span>
            <button
              className="px-3 py-1 rounded-md border border-white/10 text-sm text-gray-300 disabled:opacity-50 hover:bg-white/5 transition-colors"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
