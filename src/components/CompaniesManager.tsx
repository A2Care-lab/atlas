import { useState, useEffect } from 'react';
import { Calendar, Filter, Plus, Edit, Trash2, Building2, Ban, Power } from 'lucide-react';
import { ClearFiltersButton } from './ClearFiltersButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { formatCNPJ, onlyDigits } from '../utils/format';

interface Company {
  id: string;
  name: string;
  cnpj: string;
  email_domain?: string;
  is_active?: boolean;
  status: 'active' | 'inactive';
  sla_days?: number;
  created_at: string;
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Corp Brasil Ltda',
    cnpj: '12.345.678/0001-90',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Inovação Digital SA',
    cnpj: '98.765.432/0001-21',
    status: 'active',
    created_at: '2024-02-20T14:15:00Z'
  },
  {
    id: '3',
    name: 'Empresa Exemplo Inativa',
    cnpj: '11.223.344/0001-55',
    status: 'inactive',
    created_at: '2023-12-10T09:45:00Z'
  },
  {
    id: '4',
    name: 'Soluções Corporativas ME',
    cnpj: '55.443.322/0001-88',
    status: 'active',
    created_at: '2024-03-05T16:20:00Z'
  },
  {
    id: '5',
    name: 'Consultoria Tech Ltda',
    cnpj: '77.889.900/0001-33',
    status: 'inactive',
    created_at: '2023-11-25T11:30:00Z'
  }
];

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(mockCompanies);
  const [filters, setFilters] = useState({
    name: '',
    cnpj: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    startDate: '',
    endDate: ''
  });
  
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', cnpj: '', email_domain: '', sla_days: 0 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', cnpj: '', email_domain: '', sla_days: 0 });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id,name,cnpj,email_domain,sla_days,created_at,is_active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Company[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          cnpj: c.cnpj ?? '',
          email_domain: c.email_domain ?? '',
          is_active: c.is_active ?? true,
          status: (c.is_active ?? true) ? 'active' : 'inactive',
          sla_days: typeof c.sla_days === 'number' ? c.sla_days : 0,
          created_at: c.created_at ?? new Date().toISOString()
        }));
        setCompanies(mapped);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    let filtered = companies;

    // Filter by name
    if (filters.name) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by CNPJ
    if (filters.cnpj) {
      const filterDigits = onlyDigits(filters.cnpj);
      filtered = filtered.filter(company => 
        onlyDigits(company.cnpj).includes(filterDigits)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(company => company.status === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(company => 
        new Date(company.created_at) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(company => 
        new Date(company.created_at) <= new Date(filters.endDate)
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [companies, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      cnpj: '',
      status: 'all',
      startDate: '',
      endDate: ''
    });
    
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      cnpj: company.cnpj || '',
      email_domain: company.email_domain || '',
      sla_days: company.sla_days ?? 0
    });
    setIsEditOpen(true);
  };

  const openCreate = () => {
    setCreateForm({ name: '', cnpj: '', email_domain: '', sla_days: 0 });
    setIsCreateOpen(true);
  };

  const saveEdit = async () => {
    if (!editingCompany) return;
    const payload = {
      name: editForm.name,
      cnpj: onlyDigits(editForm.cnpj),
      email_domain: (editForm.email_domain || '').includes('@')
        ? (editForm.email_domain || '').split('@').pop() || ''
        : (editForm.email_domain || ''),
      sla_days: Number(editForm.sla_days) || 0,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('companies')
      .update(payload)
      .eq('id', editingCompany.id)
      .select()
      .single();
    if (!error) {
      const updated = companies.map(c =>
        c.id === editingCompany.id
          ? { ...c, ...payload, created_at: c.created_at }
          : c
      );
      setCompanies(updated);
      setIsEditOpen(false);
      setEditingCompany(null);
    } else {
      alert(`Erro ao salvar empresa: ${error.message}`);
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const blockCompany = async (company: Company) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false, updated_at: new Date().toISOString(), blocked_at: new Date().toISOString() })
      .eq('id', company.id);
    if (!error) {
      const updated = companies.map(c => c.id === company.id ? { ...c, is_active: false, status: 'inactive' as const } : c);
      setCompanies(updated);
    }
  };

  const activateCompany = async (company: Company) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: true, updated_at: new Date().toISOString(), blocked_at: null })
      .eq('id', company.id);
    if (!error) {
      const updated = companies.map(c => c.id === company.id ? { ...c, is_active: true, status: 'active' as const } : c);
      setCompanies(updated);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500">
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h3>
          <ClearFiltersButton onClick={clearFilters} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              placeholder="00.000.000/0001-00"
              value={filters.cnpj}
              onChange={(e) => handleFilterChange('cnpj', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
        </div>
      </div>

      {/* Results count and page size */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredCompanies.length} empresa(s) encontrada(s)
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Itens por página</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {company.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCNPJ(company.cnpj)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.email_domain || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(company.sla_days ?? 0)} dia(s)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                      {getStatusLabel(company.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-petroleo-600 hover:text-petroleo-900" onClick={() => openEdit(company)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {company.status === 'inactive' ? (
                        <button className="text-green-600 hover:text-green-800" aria-label="Ativar empresa" title="Ativar empresa" onClick={() => activateCompany(company)}>
                          <Power className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="text-orange-600 hover:text-orange-800" aria-label="Bloquear empresa" title="Bloquear empresa" onClick={() => blockCompany(company)}>
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar seus filtros de busca.
            </p>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {filteredCompanies.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} de {filteredCompanies.length}</p>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">Página {page} de {totalPages}</span>
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Empresa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                <input
                  type="text"
                  value={editForm.cnpj}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input
                  type="text"
                  value={editForm.email_domain}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email_domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SLA (dias)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.sla_days}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sla_days: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => { setIsEditOpen(false); setEditingCompany(null); }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700"
                onClick={saveEdit}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Empresa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                <input
                  type="text"
                  value={createForm.cnpj}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input
                  type="text"
                  value={createForm.email_domain}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email_domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SLA (dias)</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.sla_days}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, sla_days: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700"
                onClick={async () => {
                  const cnpjDigits = onlyDigits(createForm.cnpj);
                  const emailDomain = (createForm.email_domain || '').includes('@')
                    ? (createForm.email_domain || '').split('@').pop() || ''
                    : (createForm.email_domain || '');
                  const payload = {
                    name: createForm.name,
                    cnpj: cnpjDigits,
                    email_domain: emailDomain,
                    sla_days: Number(createForm.sla_days) || 0,
                    is_active: true
                  };
                  const { data, error } = await supabase
                    .from('companies')
                    .insert(payload)
                    .select()
                    .single();
                  if (error) {
                    alert(`Erro ao criar empresa: ${error.message}`);
                    return;
                  }
                  if (data) {
                    const newCompany: Company = {
                      id: data.id,
                      name: data.name,
                      cnpj: data.cnpj ?? '',
                      email_domain: data.email_domain ?? '',
                      sla_days: data.sla_days ?? 0,
                      is_active: data.is_active ?? true,
                      status: (data.is_active ?? true) ? 'active' : 'inactive',
                      created_at: data.created_at ?? new Date().toISOString()
                    };
                    setCompanies(prev => [newCompany, ...prev]);
                    setIsCreateOpen(false);
                  }
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
