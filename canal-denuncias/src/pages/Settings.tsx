import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UsersTable from '../components/UsersTable';
import CompaniesManager from '../components/CompaniesManager';
import TermsAcceptances from '../components/TermsAcceptances';
import AssinaturasManager from '../components/AssinaturasManager';
import WhatsAppManager from '../components/WhatsAppManager';
import TemplatesManager from '../components/TemplatesManager';
import { useAuth } from '../hooks/useAuth';
import SettingsTabs from '../components/SettingsTabs';
import SettingsHeader from '../components/SettingsHeader';
import { isAdminRole, isCorporateManagerRole } from '../utils/roles';

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isAdmin = isAdminRole(profile?.role);
  const isCorp = isCorporateManagerRole(profile?.role);
  const getInitialTab = (): 'users' | 'corporate' | 'companies' | 'terms' | 'assinaturas' | 'whatsapp' | 'templates' => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (isCorp) return 'assinaturas';
    if (tab === 'companies') return 'companies';
    if (tab === 'corporate') return 'corporate';
    if (tab === 'terms') return 'terms';
    if (tab === 'assinaturas') return 'assinaturas';
    if (tab === 'whatsapp') return 'whatsapp';
    if (tab === 'templates') return 'templates';
    return 'users';
  };
  const [activeTab, setActiveTab] = useState<'users' | 'corporate' | 'companies' | 'terms' | 'assinaturas' | 'whatsapp' | 'templates'>(getInitialTab());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (isCorp) {
      setActiveTab('assinaturas');
      return;
    }
    if (tab === 'companies') setActiveTab('companies');
    else if (tab === 'corporate') setActiveTab('corporate');
    else if (tab === 'terms') setActiveTab(isAdmin ? 'terms' : 'users');
    else if (tab === 'assinaturas') setActiveTab(isAdmin ? 'assinaturas' : 'users');
    else if (tab === 'whatsapp') setActiveTab(isAdmin ? 'whatsapp' : 'users');
    else if (tab === 'templates') setActiveTab(isAdmin ? 'templates' : 'users');
    else setActiveTab('users');
  }, [isAdmin, isCorp, location.search]);

  return (
    <div className="space-y-6">
      <SettingsHeader />

      <SettingsTabs />

      {/* Tab Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl">
        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-2">Gestão de Usuários</h2>
            <p className="text-gray-400 mb-6">Cadastre, edite e administre os usuários que acessam a plataforma e suas permissões.</p>
            <UsersTable />
          </div>
        )}

        {activeTab === 'corporate' && (
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-white mb-4">Áreas Corporativas</h2>
              <p className="text-gray-400 mb-4">
                Configure as áreas corporativas e departamentos da organização.
              </p>
              <button
                onClick={() => navigate('/configuracoes/areas')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                Gerenciar Áreas
              </button>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Registro de Empresas e Parametrização de SLA</h2>
            <p className="text-gray-400 mb-6">
              Realize o cadastro de empresas e configure os prazos para análise e resolução das denúncias.
            </p>
            <CompaniesManager />
          </div>
        )}

        {activeTab === 'terms' && isAdmin && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-2">Aceites de Termos</h2>
            <p className="text-gray-400 mb-6">Consulte os registros de aceite com versões dos documentos.</p>
            <TermsAcceptances />
          </div>
        )}

        {activeTab === 'assinaturas' && (isAdmin || isCorp) && (
          <div className="p-6">
            <AssinaturasManager />
          </div>
        )}

        {activeTab === 'whatsapp' && isAdmin && (
          <div className="p-6">
            <WhatsAppManager />
          </div>
        )}

        {activeTab === 'templates' && isAdmin && (
          <div className="p-6">
            <TemplatesManager />
          </div>
        )}

      </div>
    </div>
  );
}
