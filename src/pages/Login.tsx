import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Brand } from '../components/Brand';
import { HtmlModal } from '../components/HtmlModal';
import InputModal from '../components/InputModal';
import MessageModal from '../components/MessageModal';
import { formatDate } from '../utils/format';
import { supabase } from '../lib/supabase';

export function Login() {
  const { user, signIn, loading, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openHtml, setOpenHtml] = useState(false);
  const [htmlTitle, setHtmlTitle] = useState<string>('');
  const [html, setHtml] = useState('');
  const [version, setVersion] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [docError, setDocError] = useState<string>('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMsg, setResetMsg] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const handlePrivacyClick = async () => {
    setDocError('');
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_privacy_policy', {
        body: { type: 'Política de Privacidade', system_name: 'A2Care' }
      });
      if (!fnError && fnData) {
        const doc = Array.isArray(fnData) ? fnData[0] : fnData;
        setHtml(doc?.content || '');
        setVersion(doc?.version || '');
        setLastUpdated(doc?.last_updated || '');
        setHtmlTitle('Política de Privacidade');
        setOpenHtml(true);
        return;
      }

      const { data: altData, error: altErr } = await supabase.functions.invoke('legalsdesk_privacy_policy', {
        body: { type: 'Política de Privacidade', system_name: 'A2Care' }
      });
      if (!altErr && altData) {
        const doc = Array.isArray(altData) ? altData[0] : altData;
        setHtml(doc?.content || '');
        setVersion(doc?.version || '');
        setLastUpdated(doc?.last_updated || '');
        setHtmlTitle('Política de Privacidade');
        setOpenHtml(true);
        return;
      }

      const url = 'https://peuvnxfkzbewhuajdqhd.supabase.co/rest/v1/latest_documents?type=eq.Pol%C3%ADtica%20de%20Privacidade&system_name=eq.A2Care&select=*';
      const apiKey = import.meta.env.VITE_A2CARE_API_KEY as string;
      const bearer = import.meta.env.VITE_A2CARE_BEARER as string;
      if (apiKey && bearer) {
        const headers: Record<string, string> = {
          apikey: apiKey,
          Authorization: `Bearer ${bearer}`,
        };
        const res = await fetch(url, { headers });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Erro ${res.status}`);
        }
        const data = await res.json();
        const doc = Array.isArray(data) ? data[0] : data;
        setHtml(doc?.content || '');
        setVersion(doc?.version || '');
        setLastUpdated(doc?.last_updated || '');
        setHtmlTitle('Política de Privacidade');
        setOpenHtml(true);
        return;
      }

      throw new Error('Chaves de API locais ausentes para fallback');
    } catch (e: any) {
      setDocError(`Não foi possível carregar a Política de Privacidade. ${e?.message || ''}`.trim());
    }
  };

  const handleTermsClick = async () => {
    setDocError('');
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_terms_of_use', {
        body: { type: 'Termos de Uso', system_name: 'ATLAS' }
      });
      if (!fnError && fnData) {
        const doc = Array.isArray(fnData) ? fnData[0] : fnData;
        setHtml(doc?.content || '');
        setVersion(doc?.version || '');
        setLastUpdated(doc?.last_updated || '');
        setHtmlTitle('Termos de Uso');
        setOpenHtml(true);
        return;
      }

      const url = 'https://peuvnxfkzbewhuajdqhd.supabase.co/rest/v1/latest_documents?type=eq.Termos%20de%20Uso&system_name=eq.ATLAS&select=*';
      const apiKey = import.meta.env.VITE_A2CARE_API_KEY as string;
      const bearer = import.meta.env.VITE_A2CARE_BEARER as string;
      if (!apiKey || !bearer) throw new Error('Chaves de API não configuradas');
      const headers: Record<string, string> = { apikey: apiKey, Authorization: `Bearer ${bearer}` };
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erro ${res.status}`);
      }
      const data = await res.json();
      const doc = Array.isArray(data) ? data[0] : data;
      setHtml(doc?.content || '');
      setVersion(doc?.version || '');
      setLastUpdated(doc?.last_updated || '');
      setHtmlTitle('Termos de Uso');
      setOpenHtml(true);
    } catch (e: any) {
      setDocError(`Não foi possível carregar os Termos de Uso. ${e?.message || ''}`.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Brand variant="teal" withText className="h-20 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Integridade Corporativa
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse o sistema
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-none relative block w-full pl-10 pr-12 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-petroleo-600 z-20"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="#"
              className="text-sm text-petroleo-600 hover:text-petroleo-500"
              onClick={(e) => {
                e.preventDefault();
                setResetOpen(true);
              }}
            >
              Esqueceu sua senha?
            </a>
          </div>
        </form>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={handlePrivacyClick}
            className="px-3 py-1 rounded-lg border border-petroleo-600 text-petroleo-700 hover:bg-petroleo-50 focus:outline-none focus:ring-2 focus:ring-petroleo-300"
          >
            Política de Privacidade
          </button>
          <button
            onClick={handleTermsClick}
            className="px-3 py-1 rounded-lg border border-petroleo-600 text-petroleo-700 hover:bg-petroleo-50 focus:outline-none focus:ring-2 focus:ring-petroleo-300"
          >
            Termos de Uso
          </button>
        </div>

        <HtmlModal
          open={openHtml}
          title={htmlTitle || 'Documento'}
          html={html}
          footer={lastUpdated || version ? `Atualizado em ${formatDate(lastUpdated)} – Versão ${version || '—'}` : undefined}
          onClose={() => setOpenHtml(false)}
        />
        <MessageModal
          open={!!docError}
          title={"Erro"}
          message={docError}
          variant="error"
          onClose={() => setDocError('')}
        />
        <MessageModal
          open={!!resetMsg}
          title={"Alteração de Senha"}
          message={resetMsg}
          variant="success"
          onClose={() => setResetMsg('')}
        />
        <InputModal
          open={resetOpen}
          title="Redefinir Senha"
          label="Informe seu e-mail"
          placeholder="nome@empresa.com"
          confirmText="Enviar instruções"
          cancelText="Cancelar"
          onConfirm={async (mail) => {
            if (!mail) return;
            const { error } = await resetPassword(mail);
            setResetOpen(false);
            if (error) {
              setResetMsg(`Falha ao enviar instruções: ${error.message}`);
            } else {
              setResetMsg('Enviamos instruções para redefinição de senha ao seu e-mail.');
            }
          }}
          onClose={() => setResetOpen(false)}
        />
      </div>
    </div>
  );
}
