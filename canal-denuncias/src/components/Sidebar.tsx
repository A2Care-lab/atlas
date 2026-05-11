import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSidebarStore } from '../stores/sidebarStore';
import { 
  Home, 
  FileText, 
  PlusCircle, 
  Users, 
  Settings, 
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ScrollText,
  Ear
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Brand } from './Brand';
import AtlasLogo from './AtlasLogo';
import packageJson from '../../package.json';

export function Sidebar() {
  const { profile } = useAuth();
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebarStore();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const appVersion = packageJson.version ?? '0.0.0';
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const buildLastUpdate = typeof __LAST_UPDATE__ === 'string' && __LAST_UPDATE__ ? __LAST_UPDATE__ : ''

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const date = buildLastUpdate ? new Date(buildLastUpdate) : new Date()
    const formatted = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    setLastUpdate(formatted)
  }, [buildLastUpdate])

  const navigation = (() => {
    if (profile?.role === 'crm_n1') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Nova Denúncia', href: '/new-report', icon: PlusCircle },
        { name: 'Gestão de Denúncias', href: '/manage-reports', icon: Shield },
        { name: 'Política de Não Retaliação', href: '/politica-nao-retaliacao', icon: ScrollText },
      ];
    }
    return [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Minhas Denúncias', href: '/my-reports', icon: FileText },
      { name: 'Nova Denúncia', href: '/new-report', icon: PlusCircle },
      { name: 'Política de Não Retaliação', href: '/politica-nao-retaliacao', icon: ScrollText },
      ...(profile?.role === 'admin' || profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
        ? [
            { name: 'Gestão de Denúncias', href: '/manage-reports', icon: Shield },
            { name: 'Silêncio Percebido', href: '/silencio-percebido', icon: Ear }
          ]
        : []),
      ...(profile?.role === 'approver_manager' 
        ? [{ name: 'Aprovação Corporativa', href: '/corporate-approval', icon: BarChart3 }]
        : []),
      ...(profile?.role === 'admin'
        ? [
            { name: 'Configurações', href: '/settings', icon: Settings }
          ]
        : profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
          ? [
              { name: 'Configurações', href: '/settings', icon: Settings }
            ]
          : []),
    ];
  })();

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const sidebarMobileWidth = 'w-64';

  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg lg:hidden"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full text-white z-50
        bg-slate-900/50 backdrop-blur-md border-r border-white/10 shadow-2xl
        transition-all duration-300 ease-in-out
        ${isMobile 
          ? `${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarMobileWidth}` 
          : `${sidebarWidth} ${isCollapsed ? 'translate-x-0' : 'translate-x-0'}`
        }
      `}>
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center">
                <AtlasLogo className="h-8 w-8 text-petroleo-500" />
                <span className="ml-2 text-lg font-semibold text-white">ATLAS</span>
              </div>
              <span className="pl-8 text-[11px] leading-tight text-gray-400">
                Integridade Corporativa
              </span>
            </div>
          )}
          
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-md hover:bg-white/10 transition-colors flex items-center gap-2 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">Fechar</span>
            </button>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const path = location.pathname.toLowerCase();
            const isSettingsItem = item.href === '/settings';
            const isActive = isSettingsItem
              ? (path.startsWith('/settings') || path.startsWith('/configuracoes') || path.startsWith('/configurações'))
              : path === item.href.toLowerCase();
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className={`
                  relative flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-white/10 ring-1 ring-white/10 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span>{item.name}</span>}
                
                {/* Indicador visual de página ativa */}
                {isActive && (
                  <div className={`
                    absolute right-0 w-1.5 h-6 bg-petroleo-400 rounded-l-full
                    ${isCollapsed ? 'opacity-0' : 'opacity-100'}
                  `} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="px-2 py-4 border-t border-white/10">
          <div className={`
            flex items-center px-3 py-2 text-sm text-gray-400
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-medium text-white">Versão: {appVersion}</span>
                <span className="text-xs text-gray-500">Última atualização: {lastUpdate}</span>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <AtlasLogo className="h-5 w-5 text-petroleo-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Espaço reservado para a sidebar (desktop) */}
      {!isMobile && (
        <div className={`${sidebarWidth} flex-shrink-0 transition-all duration-300`} />
      )}
    </>
  );
}
