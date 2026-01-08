import { Users, Building, Building2, ScrollText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SettingsTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = (): 'users' | 'companies' | 'corporate' | 'policy' => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/configuracoes/areas') || path.includes('/configurações/areas')) {
      return 'corporate';
    }
    if (path.includes('/configuracoes/politica-nao-retaliacao') || path.includes('/configurações/politica-nao-retaliacao')) {
      return 'policy';
    }
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') as 'users' | 'companies' | 'corporate' | 'policy' | null) ?? 'users';
    return tab === 'companies' ? 'companies' : tab === 'corporate' ? 'corporate' : tab === 'policy' ? 'policy' : 'users';
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: 'users' as const, name: 'Usuários', icon: Users, onClick: () => navigate('/settings?tab=users') },
    { id: 'companies' as const, name: 'Empresas & SLA', icon: Building2, onClick: () => navigate('/settings?tab=companies') },
    { id: 'corporate' as const, name: 'Áreas Corporativas', icon: Building, onClick: () => navigate('/configuracoes/areas') },
    { id: 'policy' as const, name: 'Política Não Retaliação', icon: ScrollText, onClick: () => navigate('/configuracoes/politica-nao-retaliacao') },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={
                `group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ` +
                (isActive
                  ? 'border-petroleo-500 text-petroleo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
              }
            >
              <Icon className="-ml-0.5 mr-2 h-5 w-5" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
