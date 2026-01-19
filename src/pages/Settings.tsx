import { useEffect, useState } from 'react';
import { Users, Building, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import UsersTable from '../components/UsersTable';
import CompaniesManager from '../components/CompaniesManager';
import TermsAcceptances from '../components/TermsAcceptances';
import AssinaturasManager from '../components/AssinaturasManager';
import { useAuth } from '../hooks/useAuth';
import SettingsTabs from '../components/SettingsTabs';
import SettingsHeader from '../components/SettingsHeader';

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const getInitialTab = (): 'users' | 'corporate' | 'companies' | 'terms' | 'assinaturas' => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const isCorp = profile?.role === 'corporate_manager' || profile?.role === 'approver_manager';
    if (isCorp) return 'assinaturas';
    if (tab === 'companies') return 'companies';
    if (tab === 'corporate') return 'corporate';
    if (tab === 'terms') return 'terms';
    if (tab === 'assinaturas') return 'assinaturas';
    return 'users';
  };
  const [activeTab, setActiveTab] = useState<'users' | 'corporate' | 'companies' | 'terms' | 'assinaturas'>(getInitialTab());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const isCorp = profile?.role === 'corporate_manager' || profile?.role === 'approver_manager';
    if (isCorp) {
      setActiveTab('assinaturas');
      return;
    }
    if (tab === 'companies') setActiveTab('companies');
    else if (tab === 'corporate') setActiveTab('corporate');
    else if (tab === 'terms') setActiveTab(profile?.role === 'admin' ? 'terms' : 'users');
    else if (tab === 'assinaturas') setActiveTab(profile?.role === 'admin' ? 'assinaturas' : 'users');
    else setActiveTab('users');
  }, [location.search, profile?.role]);

  return (
    <div className="space-y-6">
      <SettingsHeader />

      <SettingsTabs />

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Gestão de Usuários</h2>
            <p className="text-gray-600 mb-6">Cadastre, edite e administre os usuários que acessam a plataforma e suas permissões.</p>
            <UsersTable />
          </div>
        )}

        {activeTab === 'corporate' && (
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Áreas Corporativas</h2>
              <p className="text-gray-600 mb-4">
                Configure as áreas corporativas e departamentos da organização.
              </p>
              <button
                onClick={() => navigate('/configuracoes/areas')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Gerenciar Áreas
              </button>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Registro de Empresas e Parametrização de SLA</h2>
            <p className="text-gray-600 mb-6">
              Realize o cadastro de empresas e configure os prazos para análise e resolução das denúncias.
            </p>
            <CompaniesManager />
          </div>
        )}

        {activeTab === 'terms' && profile?.role === 'admin' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Aceites de Termos</h2>
            <p className="text-gray-600 mb-6">Consulte os registros de aceite com versões dos documentos.</p>
            <TermsAcceptances />
          </div>
        )}

        {activeTab === 'assinaturas' && (profile?.role === 'admin' || profile?.role === 'corporate_manager' || profile?.role === 'approver_manager') && (
          <div className="p-6">
            <AssinaturasManager />
          </div>
        )}

      </div>
    </div>
  );
}
