import { useAuth } from '../hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import { useSidebarStore } from '../stores/sidebarStore';
import { useState, useEffect, useRef } from 'react';
import { Brand } from './Brand';
import { getUserRoleLabel } from '../utils/labels';
import { UserProfileModal } from './UserProfileModal';

export function Header() {
  const { profile, signOut, updateProfile } = useAuth();
  const { isCollapsed } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [greeting, setGreeting] = useState<string>('');
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    const salutation = hour >= 5 && hour < 12
      ? 'Bom dia'
      : hour >= 12 && hour < 18
      ? 'Boa tarde'
      : 'Boa noite';

    const displayName = profile?.full_name || profile?.email || 'Usuário';
    setGreeting(`${salutation}, ${displayName}!`);
  }, [profile?.full_name, profile?.email]);

  return (
    <header className={`
      fixed top-0 right-0 left-0 bg-petroleo-600 shadow-sm border-b border-petroleo-700 z-40
      ${isMobile ? 'h-20' : isCollapsed ? 'lg:left-20 lg:h-20' : 'lg:left-64 lg:h-20'}
      transition-all duration-300
    `}>
      <div className="flex items-center justify-between h-full px-6 text-white">
        {/* Espaço para o botão mobile (será preenchido pela sidebar) */}
        <div className="lg:hidden w-10" />
        
        {/* Logo e título - visível apenas em mobile */}
        {isMobile && (
          <div className="flex items-center">
            <Brand variant="white" withText className="h-8 w-auto" />
          </div>
        )}

        {/* Saudação alinhada à esquerda (desktop) */}
        {!isMobile && (
          <div className="flex-1 flex items-center justify-start">
            <span className="text-white text-lg md:text-xl font-semibold truncate max-w-[70%]">
              {greeting}
            </span>
          </div>
        )}

        {/* Área do usuário */}
        <div className="flex items-center space-x-4 mt-1 md:mt-2">

        <div className="hidden sm:flex items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenProfile(true)}
              ref={avatarBtnRef}
              className="w-8 h-8 rounded-full overflow-hidden bg-petroleo-100 flex items-center justify-center hover:ring-2 hover:ring-white/40"
              aria-label="Abrir perfil"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-petroleo-700" />
              )}
            </button>
            <div className="text-sm text-white/80">
              {getUserRoleLabel(profile?.role || '')}
            </div>
          </div>
        </div>

          {/* Botão de logout */}
          <button
            onClick={signOut}
            className="flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors border border-white/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
      <UserProfileModal
        profile={profile}
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        onSave={async (changes) => {
          await updateProfile(changes)
          setOpenProfile(false)
        }}
        anchorRef={avatarBtnRef}
      />
    </header>
  );
}
