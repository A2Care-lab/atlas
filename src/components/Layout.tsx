import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSidebarStore } from '../stores/sidebarStore';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);
  const { profile } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const runCheck = async () => {
      try {
        const isCorp = profile?.role === 'corporate_manager' || profile?.role === 'approver_manager';
        const companyId = (profile as any)?.company_id || null;
        if (!isCorp || !companyId) {
          setShowLimitModal(false);
          return;
        }
        const { data, error } = await supabase
          .from('assinaturas_consumo')
          .select('usuarios_consumidos, usuarios_limite, denuncias_consumidas, denuncias_limite')
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) return;
        const uLim = (data?.usuarios_limite ?? 0) as number;
        const uUse = (data?.usuarios_consumidos ?? 0) as number;
        const dLim = (data?.denuncias_limite ?? 0) as number;
        const dUse = (data?.denuncias_consumidas ?? 0) as number;
        const hasLimit = (uLim > 0 && uUse >= uLim) || (dLim > 0 && dUse >= dLim);
        setShowLimitModal(!!hasLimit);
      } catch {}
    };
    runCheck();
  }, [profile?.role, (profile as any)?.company_id]);

  return (
    <div className="min-h-screen bg-papel">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 bg-papel transition-all duration-300 ${
          isMobile ? 'pl-0' : isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-6 flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>
      {showLimitModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Limite de Uso Atingido</h3>
            <p className="text-sm text-gray-700">
              Você etingiu o limite uso da assinatura contratada. Para não gerar excedentes de uso, procurso o gestor do sistema
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
