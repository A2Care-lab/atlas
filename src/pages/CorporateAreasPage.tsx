import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Pause, Play, AlertCircle, Filter } from 'lucide-react';
import { ClearFiltersButton } from '../components/ClearFiltersButton';
import { useCorporateAreas, CorporateArea } from '../hooks/useCorporateAreas';
import { CorporateAreaModal } from '../components/CorporateAreaModal';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import SettingsTabs from '../components/SettingsTabs';
import SettingsHeader from '../components/SettingsHeader';

export function CorporateAreasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const userRole = profile?.role;
  const {
    areas,
    loading: areasLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
    toggleAreaStatus,
    refreshAreas
  } = useCorporateAreas();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<CorporateArea | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Verificar se é admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      console.log('Acesso negado: apenas administradores podem acessar esta página');
    }
  }, [userRole]);

  // Enquanto autenticação/perfil carregam, mantém a página em estado de loading
  if (authLoading || (!profile && user)) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o perfil estiver carregado e não for admin, exibe mensagem de acesso negado
  if (profile && userRole !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Acesso restrito</h3>
              <p className="mt-2 text-sm text-yellow-700">Apenas administradores podem gerenciar Áreas Corporativas.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateArea = async (name: string) => {
    try {
      await createArea(name);
      setIsModalOpen(false);
    } catch (err) {
      // Erro já é tratado no hook
    }
  };

  const handleUpdateArea = async (name: string) => {
    if (!editingArea) return;
    
    try {
      await updateArea(editingArea.id, name);
      setIsModalOpen(false);
      setEditingArea(null);
    } catch (err) {
      // Erro já é tratado no hook
    }
  };

  const handleDeleteArea = async (id: string) => {
    try {
      await deleteArea(id);
      setDeleteConfirm(null);
    } catch (err) {
      // Erro já é tratado no hook
    }
  };

  const handleToggleStatus = async (area: CorporateArea) => {
    try {
      await toggleAreaStatus(area.id, area.status);
    } catch (err) {
      // Erro já é tratado no hook
    }
  };

  const openEditModal = (area: CorporateArea) => {
    setEditingArea(area);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingArea(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
  };

  const getStatusBadge = (status: 'active' | 'paused') => {
    return status === 'active' 
      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativa</span>
      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pausada</span>;
  };

  const filteredAreas = areas.filter((area) => {
    const matchesName = area.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : area.status === statusFilter;
    return matchesName && matchesStatus;
  });

  if (areasLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsTabs />
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Gestão de Áreas Corporativas</h2>
              <p className="text-gray-600 mt-2">Cadastre, edite e administre as áreas e departamentos que compõem a estrutura organizacional das empresas.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Área
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </h3>
              <ClearFiltersButton onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nome</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome da área"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                </select>
              </div>
            </div>
          </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <ul className="p-2">
          {filteredAreas.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <p className="text-gray-500 text-sm">Nenhuma área corporativa cadastrada</p>
              <button
                onClick={openCreateModal}
                className="mt-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Criar primeira área
              </button>
            </li>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAreas.map((area) => (
                <li key={area.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {area.name}
                        </p>
                        <div className="ml-3">
                          {getStatusBadge(area.status)}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Criado em {new Date(area.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(area)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title={area.status === 'active' ? 'Pausar área' : 'Ativar área'}
                      >
                        {area.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(area)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Editar área"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(area.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir área"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </div>
          )}
        </ul>
      </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <CorporateAreaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingArea ? handleUpdateArea : handleCreateArea}
        initialName={editingArea?.name || ''}
        title={editingArea ? 'Editar Área' : 'Nova Área'}
      />

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar exclusão
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir esta área corporativa? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteArea(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
