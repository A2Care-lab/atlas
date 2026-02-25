import { Navigate, createHashRouter, RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import Onboarding from './pages/Onboarding';
import PasswordRecoveryRequest from './pages/PasswordRecoveryRequest';
import PasswordRecoveryReset from './pages/PasswordRecoveryReset';
import { Dashboard } from './pages/DashboardFixed';
import { MyReports } from './pages/MyReports';
import { NewReport } from './pages/NewReport';
import { ReportForm } from './pages/ReportForm';
import { ManageReports } from './pages/ManageReports';
import { CorporateApproval } from './pages/CorporateApproval';
import { Logout } from './pages/Logout';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { Settings } from './pages/Settings';
import { CorporateAreasPage } from './pages/CorporateAreasPage';
import PoliticaNaoRetaliacaoPage from './pages/PoliticaNaoRetaliacaoPage2';
import PoliticaNaoRetaliacaoPublicPage from './pages/PoliticaNaoRetaliacaoPublicPage';
import ReportSuccess from './pages/ReportSuccess';
import PreviewEmailDenunciaConfirmacao from './pages/PreviewEmailDenunciaConfirmacao';
import PreviewEmailAlteracaoSenha from './pages/PreviewEmailAlteracaoSenha';
import PreviewEmailConviteUsuario from './pages/PreviewEmailConviteUsuario';
import AssinaturasManager from './components/AssinaturasManager';
import AssinaturaForm from './pages/AssinaturaForm';
import Landing from './pages/Landing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  useEffect(() => {
    try {
      const pathname = (typeof window !== 'undefined' ? window.location.pathname : '') || ''
      const hasHash = /^#\//.test(window.location.hash || '')
      const hasTokenFragment = /^#access_token=/.test(window.location.hash) || /(^#token=|[?&]token=)/.test(window.location.hash)
      if (!hasHash && !hasTokenFragment) {
        if (pathname === '/signup' || pathname === '/onboarding') {
          window.location.hash = '#/login'
        }
      }
    } catch {}

    const searchParams = new URLSearchParams(window.location.search || '')
    const access_token_q = searchParams.get('access_token') || undefined
    const refresh_token_q = searchParams.get('refresh_token') || undefined
    const h = window.location.hash || ''
    const idx = h.indexOf('#access_token=')
    const frag = idx !== -1 ? h.substring(idx + 1) : ''
    const hashParams = new URLSearchParams(frag)
    const access_token_h = hashParams.get('access_token') || undefined
    const refresh_token_h = hashParams.get('refresh_token') || undefined

    // Não sobrescrever fragmento quando ele contém tokens (#access_token, etc.)
    // Apenas ajustar rota se NÃO houver tokens no fragmento atual
      try {
        const preQs = new URLSearchParams(window.location.search || '')
        let preGo = preQs.get('go') || ''
        const preType = preQs.get('type') || ''
        try { preGo = decodeURIComponent(preGo) } catch {}
        try { preGo = decodeURIComponent(preGo) } catch {}
        const hasTokenFragment = /^#access_token=/.test(window.location.hash) || /(^#token=|[?&]token=)/.test(window.location.hash)
        if (preType && preGo && !/^#\/onboarding/.test(window.location.hash) && !hasTokenFragment) {
          const prePath = preGo.startsWith('/') ? preGo : `/${preGo}`
          window.location.hash = `${prePath}?type=${preType}`
        }
      } catch {}

    const access_token = access_token_q || access_token_h
    const refresh_token = refresh_token_q || refresh_token_h

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        const qs = new URLSearchParams(window.location.search || '')
        let go = qs.get('go') || ''
        let type = qs.get('type') || ''
        try { go = decodeURIComponent(go) } catch {}
        try { go = decodeURIComponent(go) } catch {}
        if (!type) {
          const h = window.location.hash || ''
          let qStr = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
          if (qStr.includes('#')) qStr = qStr.split('#')[0]
          const hp = new URLSearchParams(qStr)
          type = hp.get('type') || ''
        }
        const path = go ? (go.startsWith('/') ? go : `/${go}`) : '/onboarding'
        window.location.hash = `${path}${type ? `?type=${type}` : ''}`
      }).catch(() => {
        window.location.hash = '#/login'
      })
    }
    const token = (new URLSearchParams(window.location.search || '')).get('token') || (new URLSearchParams(frag)).get('token') || ''
    const code = (new URLSearchParams(window.location.search || '')).get('code') || (new URLSearchParams(frag)).get('code') || ''
    const typeParam = (new URLSearchParams(window.location.search || '')).get('type') || (new URLSearchParams(frag)).get('type') || ''
    if (!access_token && token) {
      (async () => {
        try {
          const t = (typeParam || '').toLowerCase()
          const verifyType = t === 'magiclink' ? 'magiclink' : (t === 'recovery' ? 'recovery' : 'signup')
          const { data } = await supabase.auth.verifyOtp({ type: verifyType as any, token_hash: token } as any)
          const s = data?.session
          if (s?.access_token && s?.refresh_token) {
            await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token })
          }
          const qs = new URLSearchParams(window.location.search || '')
          let go = qs.get('go') || ''
          const type = qs.get('type') || ''
          try { go = decodeURIComponent(go) } catch {}
          try { go = decodeURIComponent(go) } catch {}
          const path = (go && go.startsWith('/')) ? go : '/onboarding'
          window.location.hash = `${path}${type ? `?type=${type}` : ''}`
        } catch {
          window.location.hash = '#/login'
        }
      })()
    } else if (!access_token && code) {
      (async () => {
        try {
          const { data } = await supabase.auth.exchangeCodeForSession(code)
          const s = data?.session
          if (s?.access_token && s?.refresh_token) {
            await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token })
          }
          const qs = new URLSearchParams(window.location.search || '')
          let go = qs.get('go') || ''
          const type = qs.get('type') || ''
          try { go = decodeURIComponent(go) } catch {}
          try { go = decodeURIComponent(go) } catch {}
          const path = (go && go.startsWith('/')) ? go : '/onboarding'
          window.location.hash = `${path}${type ? `?type=${type}` : ''}`
        } catch {
          window.location.hash = '#/login'
        }
      })()
    }
  }, [])

  const router = createHashRouter([
    { path: '/login', element: user ? <Navigate to="/dashboard" replace /> : <Login /> },
    { path: '/landing', element: <Landing /> },
    { path: '/recover', element: <PasswordRecoveryRequest /> },
    { path: '/recover/:token', element: <PasswordRecoveryReset /> },
    { path: '/onboarding', element: <Onboarding /> },
    { path: '/invite', element: <Onboarding /> },
    { path: '/report/:token', element: <ReportForm /> },
    { path: '/logout', element: <Logout /> },
    { path: '/success', element: <ReportSuccess /> },
    { path: '/preview/email/denuncia-confirmacao', element: <PreviewEmailDenunciaConfirmacao /> },
    { path: '/preview/email/alteracao-senha', element: <PreviewEmailAlteracaoSenha /> },
    { path: '/preview/email/convite-usuario', element: <PreviewEmailConviteUsuario /> },
    { path: '/', element: <Landing /> },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/my-reports',
      element: (
        <ProtectedRoute>
          <Layout>
            <MyReports />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/new-report',
      element: (
        <ProtectedRoute>
          <Layout>
            <NewReport />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/politica-nao-retaliacao',
      element: (
        <ProtectedRoute>
          <Layout>
            <PoliticaNaoRetaliacaoPublicPage />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/manage-reports',
      element: (
        <ProtectedRoute>
          <Layout>
            <ManageReports />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/corporate-approval',
      element: (
        <ProtectedRoute>
          <Layout>
            <CorporateApproval />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/privacy',
      element: (
        <ProtectedRoute>
          <Layout>
            <PrivacyPolicy />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/terms',
      element: (
        <ProtectedRoute>
          <Layout>
            <TermsOfUse />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/configuracoes/areas',
      element: (
        <ProtectedRoute>
          <Layout>
            <CorporateAreasPage />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/configurações/areas',
      element: (
        <ProtectedRoute>
          <Layout>
            <CorporateAreasPage />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/configuracoes/politica-nao-retaliacao',
      element: (
        <ProtectedRoute>
          <Layout>
            <PoliticaNaoRetaliacaoPage />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/configurações/politica-nao-retaliacao',
      element: (
        <ProtectedRoute>
          <Layout>
            <PoliticaNaoRetaliacaoPage />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/configuracoes/assinaturas',
      element: (
        <ProtectedRoute>
          <Layout>
            <AssinaturasManager />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/configuracoes/assinaturas/nova',
      element: (
        <ProtectedRoute>
          <Layout>
            <AssinaturaForm />
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/configuracoes/assinaturas/:id/editar',
      element: (
        <ProtectedRoute>
          <Layout>
            <AssinaturaForm />
          </Layout>
        </ProtectedRoute>
      ),
    },
    { path: '*', element: <Navigate to="/landing" replace /> },
  ], {
    future: { v7_relativeSplatPath: true }
  });

  return <RouterProvider router={router} />;
}

export default function App() {
  return <AppRoutes />;
}
