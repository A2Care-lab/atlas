import { Users, Building, Building2, ScrollText, FileText, CreditCard, MessageCircle, Code2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminRole, isCorporateManagerRole } from '../utils/roles';

export default function SettingsTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const getActiveTab = (): 'users' | 'companies' | 'corporate' | 'policy' | 'terms' | 'assinaturas' | 'whatsapp' | 'templates' => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/configuracoes/areas') || path.includes('/configurações/areas')) {
      return 'corporate';
    }
    if (path.includes('/configuracoes/politica-nao-retaliacao') || path.includes('/configurações/politica-nao-retaliacao')) {
      return 'policy';
    }
    if (path.includes('/admin/configuracoes/assinaturas')) {
      return 'assinaturas';
    }
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') as 'users' | 'companies' | 'corporate' | 'policy' | 'terms' | 'assinaturas' | 'whatsapp' | 'templates' | null) ?? 'users';
    return tab === 'companies' ? 'companies' : 
           tab === 'corporate' ? 'corporate' : 
           tab === 'policy' ? 'policy' : 
           tab === 'terms' ? 'terms' : 
           tab === 'assinaturas' ? 'assinaturas' : 
           tab === 'whatsapp' ? 'whatsapp' :
           tab === 'templates' ? 'templates' : 'users';
  };

  const activeTab = getActiveTab();

  const isCorp = isCorporateManagerRole(profile?.role);
  const isAdmin = isAdminRole(profile?.role);
  const tabs = isCorp
    ? [
        { id: 'assinaturas' as const, name: 'Minha Assinatura', icon: CreditCard, onClick: () => navigate('/settings?tab=assinaturas') },
      ]
    : [
        { id: 'users' as const, name: 'Usuários', icon: Users, onClick: () => navigate('/settings?tab=users') },
        { id: 'companies' as const, name: 'Empresas & SLA', icon: Building2, onClick: () => navigate('/settings?tab=companies') },
        { id: 'corporate' as const, name: 'Áreas Corporativas', icon: Building, onClick: () => navigate('/configuracoes/areas') },
        { id: 'policy' as const, name: 'Política Não Retaliação', icon: ScrollText, onClick: () => navigate('/configuracoes/politica-nao-retaliacao') },
        ...(isAdmin ? [{ id: 'terms' as const, name: 'Termos', icon: FileText, onClick: () => navigate('/settings?tab=terms') }] : []),
        ...(isAdmin ? [{ id: 'whatsapp' as const, name: 'WhatsApp', icon: MessageCircle, onClick: () => navigate('/settings?tab=whatsapp') }] : []),
        ...(isAdmin ? [{ id: 'templates' as const, name: 'Templates', icon: Code2, onClick: () => navigate('/settings?tab=templates') }] : []),
        ...(isAdmin ? [{ id: 'assinaturas' as const, name: 'Assinaturas', icon: CreditCard, onClick: () => navigate('/settings?tab=assinaturas') }] : []),
      ];

  return (
    <div className="border-b border-white/10">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={
                `group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ` +
                (isActive
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600')
              }
            >
              <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${isActive ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
