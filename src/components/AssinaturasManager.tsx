import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Building, DollarSign, Users, AlertCircle, Filter } from 'lucide-react';
import { ClearFiltersButton } from './ClearFiltersButton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Assinatura {
  id: string;
  company_id: string;
  valor: number;
  usuarios: number;
  denuncias: number;
  status: 'Ativa' | 'Suspensão Temporária' | 'Cancelada';
  created_at: string;
  companies: {
    name: string;
    cnpj: string | null;
  } | null;
}

interface AssinaturaConsumo {
  company_id: string;
  empresa: string;
  valor: number;
  status: string;
  usuarios_limite: number;
  denuncias_limite: number;
  usuarios_consumidos: number;
  denuncias_consumidas: number;
}

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
}

export default function AssinaturasManager() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsumo, setSelectedConsumo] = useState<AssinaturaConsumo | null>(null);
  const [showConsumoModal, setShowConsumoModal] = useState(false);
  const [empresaBusca, setEmpresaBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'Ativa' | 'Suspensão Temporária' | 'Cancelada'>('all');
  const [inicioPeriodo, setInicioPeriodo] = useState('');
  const [fimPeriodo, setFimPeriodo] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    id: '' as string,
    company_id: '' as string,
    valor: 0,
    usuarios: 0,
    denuncias: 0,
    status: 'Ativa' as 'Ativa' | 'Suspensão Temporária' | 'Cancelada',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assinatura | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    carregarAssinaturas();
  }, []);

  const carregarAssinaturas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assinaturas')
        .select(`
          *,
          companies (
            name,
            cnpj
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssinaturas(data || []);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, cnpj')
      .order('name');
    if (error) throw error;
    setCompanies(data || []);
  };

  const abrirNovaAssinatura = async () => {
    try {
      await carregarCompanies();
      setIsEditing(false);
      setFormData({ id: '', company_id: '', valor: 0, usuarios: 0, denuncias: 0, status: 'Ativa' });
      setShowFormModal(true);
    } catch (error) {
      console.error('Erro ao preparar nova assinatura:', error);
      alert('Erro ao carregar dados');
    }
  };

  const abrirEditarAssinatura = async (id: string) => {
    try {
      await carregarCompanies();
      const { data, error } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setIsEditing(true);
      setFormData({
        id,
        company_id: data.company_id,
        valor: data.valor,
        usuarios: data.usuarios,
        denuncias: data.denuncias,
        status: data.status,
      });
      setShowFormModal(true);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      alert('Erro ao carregar assinatura');
    }
  };

  const salvarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert('Por favor, selecione uma empresa');
      return;
    }
    try {
      setSaving(true);
      if (isEditing) {
        const { error } = await supabase
          .from('assinaturas')
          .update({
            company_id: formData.company_id,
            valor: formData.valor,
            usuarios: formData.usuarios,
            denuncias: formData.denuncias,
            status: formData.status,
          })
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assinaturas')
          .insert([{
            company_id: formData.company_id,
            valor: formData.valor,
            usuarios: formData.usuarios,
            denuncias: formData.denuncias,
            status: formData.status,
          }]);
        if (error) throw error;
      }
      setShowFormModal(false);
      await carregarAssinaturas();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      alert('Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  const visualizarConsumo = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('assinaturas_consumo')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      setSelectedConsumo(data);
      setShowConsumoModal(true);
    } catch (error) {
      console.error('Erro ao carregar consumo:', error);
    }
  };

  const abrirConfirmacaoExclusao = (assinatura: Assinatura) => {
    setDeleteTarget(assinatura);
    setShowDeleteModal(true);
  };

  const excluirAssinatura = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('assinaturas')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await carregarAssinaturas();
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      alert('Erro ao excluir assinatura');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa': return 'bg-green-100 text-green-800';
      case 'Suspensão Temporária': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPercentualUso = (consumido: number, limite: number) => {
    if (limite === 0) return 0;
    return Math.round((consumido / limite) * 100);
  };

  const normalizarCNPJ = (valor?: string | null) => (valor || '').replace(/\D/g, '');
  const filteredAssinaturas = assinaturas.filter((a) => {
    const termo = empresaBusca.trim().toLowerCase();
    const nome = (a.companies?.name || '').toLowerCase();
    const cnpj = normalizarCNPJ(a.companies?.cnpj);
    const termoNumerico = termo.replace(/\D/g, '');

    const matchEmpresa = termo === ''
      ? true
      : termoNumerico
        ? cnpj.includes(termoNumerico)
        : nome.includes(termo);

    const matchStatus = statusFiltro === 'all' ? true : a.status === statusFiltro;

    const created = new Date(a.created_at).getTime();
    const inicio = inicioPeriodo ? new Date(inicioPeriodo + 'T00:00:00').getTime() : undefined;
    const fim = fimPeriodo ? new Date(fimPeriodo + 'T23:59:59').getTime() : undefined;
    const matchPeriodo =
      (inicio === undefined || created >= inicio) &&
      (fim === undefined || created <= fim);

    return matchEmpresa && matchStatus && matchPeriodo;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Gestão de Assinaturas</h2>
          <p className="text-gray-600">
            {profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
              ? 'Gerencie a assinatura da sua empresa e acompanhe seu consumo.'
              : 'Gerencie as assinaturas das empresas e visualize o consumo.'}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={abrirNovaAssinatura}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Nova Assinatura
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h3>
          <ClearFiltersButton onClick={() => { setEmpresaBusca(''); setStatusFiltro('all'); setInicioPeriodo(''); setFimPeriodo(''); }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por empresa</label>
            <input
              type="text"
              value={empresaBusca}
              onChange={(e) => setEmpresaBusca(e.target.value)}
              placeholder="Digite nome ou CNPJ da empresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as 'all' | 'Ativa' | 'Suspensão Temporária' | 'Cancelada')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
            >
              <option value="all">Todos</option>
              <option value="Ativa">Ativa</option>
              <option value="Suspensão Temporária">Suspensão Temporária</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período inicial</label>
              <input
                type="date"
                value={inicioPeriodo}
                onChange={(e) => setInicioPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período final</label>
              <input
                type="date"
                value={fimPeriodo}
                onChange={(e) => setFimPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {assinaturas.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma assinatura</h3>
            <p className="mt-1 text-sm text-gray-500">Comece criando uma nova assinatura.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Denúncias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssinaturas.map((assinatura) => (
                <tr key={assinatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {assinatura.companies?.name || 'Empresa não encontrada'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assinatura.companies?.cnpj || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {assinatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assinatura.usuarios}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assinatura.denuncias}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assinatura.status)}`}>
                      {assinatura.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(assinatura.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => visualizarConsumo(assinatura.company_id)}
                      className="text-teal-600 hover:text-teal-900"
                      title="Visualizar consumo"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {profile?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => abrirEditarAssinatura(assinatura.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => abrirConfirmacaoExclusao(assinatura)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Consumo */}
      {showConsumoModal && selectedConsumo && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Consumo da Empresa</h3>
              <button
                onClick={() => setShowConsumoModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fechar</span>
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">{selectedConsumo.empresa}</h4>
                <p className="text-sm text-gray-500">Status: {selectedConsumo.status}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Usuários</span>
                  <span className="font-medium">{selectedConsumo.usuarios_consumidos} / {selectedConsumo.usuarios_limite}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full ${
                      getPercentualUso(selectedConsumo.usuarios_consumidos, selectedConsumo.usuarios_limite) > 80
                        ? 'bg-red-600'
                        : getPercentualUso(selectedConsumo.usuarios_consumidos, selectedConsumo.usuarios_limite) > 60
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(getPercentualUso(selectedConsumo.usuarios_consumidos, selectedConsumo.usuarios_limite), 100)}%`
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Denúncias</span>
                  <span className="font-medium">{selectedConsumo.denuncias_consumidas} / {selectedConsumo.denuncias_limite}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      getPercentualUso(selectedConsumo.denuncias_consumidas, selectedConsumo.denuncias_limite) > 80
                        ? 'bg-red-600'
                        : getPercentualUso(selectedConsumo.denuncias_consumidas, selectedConsumo.denuncias_limite) > 60
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(getPercentualUso(selectedConsumo.denuncias_consumidas, selectedConsumo.denuncias_limite), 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor da Assinatura</span>
                  <span className="font-medium">R$ {selectedConsumo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConsumoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}</h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-500">×</button>
            </div>

            <form onSubmit={salvarAssinatura} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Empresa</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                  required
                  disabled={isEditing}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.cnpj && `- ${c.cnpj}`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de Usuários</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usuarios}
                    onChange={(e) => setFormData({ ...formData, usuarios: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de Denúncias</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.denuncias}
                    onChange={(e) => setFormData({ ...formData, denuncias: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Suspensão Temporária">Suspensão Temporária</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50">{saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirmar exclusão</h3>
            </div>
            <p className="text-sm text-gray-700 mb-6">Tem certeza que deseja excluir a assinatura da empresa {deleteTarget.companies?.name || 'Empresa'}?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">Cancelar</button>
              <button onClick={excluirAssinatura} disabled={deleting} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">{deleting ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
