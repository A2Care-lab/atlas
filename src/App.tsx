import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import Onboarding from './pages/Onboarding';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
        const type = qs.get('type') || ''
        // Decode once or twice to handle double-encoded values (e.g., %252Fonboarding)
        try { go = decodeURIComponent(go) } catch {}
        try { go = decodeURIComponent(go) } catch {}
        if (go) {
          const path = go.startsWith('/') ? go : `/${go}`
          window.location.hash = `${path}${type ? `?type=${type}` : ''}`
        } else if (!/^#\/onboarding/.test(window.location.hash)) {
          window.location.hash = `#/onboarding?type=${type || 'invite'}`
        }
      }).catch(() => {
        window.location.hash = '#/login'
      })
    }
    const token = (new URLSearchParams(window.location.search || '')).get('token') || (new URLSearchParams(frag)).get('token') || ''
    if (!access_token && token) {
      supabase.auth.verifyOtp({ type: 'recovery', token_hash: token } as any).then(() => {
        const qs = new URLSearchParams(window.location.search || '')
        let go = qs.get('go') || ''
        const type = qs.get('type') || ''
        try { go = decodeURIComponent(go) } catch {}
        try { go = decodeURIComponent(go) } catch {}
        const path = (go && go.startsWith('/')) ? go : '/onboarding'
        window.location.hash = `${path}${type ? `?type=${type}` : ''}`
      }).catch(() => {
        window.location.hash = '#/login'
      })
    }
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/report/:token" element={<ReportForm />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/success" element={<ReportSuccess />} />
        <Route path="/preview/email/denuncia-confirmacao" element={<PreviewEmailDenunciaConfirmacao />} />
        <Route path="/preview/email/alteracao-senha" element={<PreviewEmailAlteracaoSenha />} />
        <Route path="/preview/email/convite-usuario" element={<PreviewEmailConviteUsuario />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/my-reports" element={
          <ProtectedRoute>
            <Layout>
              <MyReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/new-report" element={
          <ProtectedRoute>
            <Layout>
              <NewReport />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/politica-nao-retaliacao" element={
          <ProtectedRoute>
            <Layout>
              <PoliticaNaoRetaliacaoPublicPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/manage-reports" element={
          <ProtectedRoute>
            <Layout>
              <ManageReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/corporate-approval" element={
          <ProtectedRoute>
            <Layout>
              <CorporateApproval />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/privacy" element={
          <ProtectedRoute>
            <Layout>
              <PrivacyPolicy />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/terms" element={
          <ProtectedRoute>
            <Layout>
              <TermsOfUse />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/configuracoes/areas" element={
          <ProtectedRoute>
            <Layout>
              <CorporateAreasPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Alias com acentuação para evitar redirecionamento pelo wildcard */}
        <Route path="/configurações/areas" element={
          <ProtectedRoute>
            <Layout>
              <CorporateAreasPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/configuracoes/politica-nao-retaliacao" element={
          <ProtectedRoute>
            <Layout>
              <PoliticaNaoRetaliacaoPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Alias com acentuação para política */}
        <Route path="/configurações/politica-nao-retaliacao" element={
          <ProtectedRoute>
            <Layout>
              <PoliticaNaoRetaliacaoPage />
            </Layout>
          </ProtectedRoute>
        } />

        
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return <AppRoutes />;
}
