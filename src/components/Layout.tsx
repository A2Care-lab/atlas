import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSidebarStore } from '../stores/sidebarStore';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    </div>
  );
}
