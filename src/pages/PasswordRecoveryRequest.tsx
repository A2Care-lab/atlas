import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePasswordRecovery } from '../hooks/usePasswordRecovery';
import AtlasLogo from '../components/AtlasLogo';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function PasswordRecoveryRequest() {
  const [email, setEmail] = useState('');
  const { recoveryState, requestPasswordRecovery } = usePasswordRecovery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    await requestPasswordRecovery(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <AtlasLogo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {recoveryState.success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email enviado com sucesso!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {recoveryState.error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Erro
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{recoveryState.error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={recoveryState.loading || !email.trim()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recoveryState.loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar instruções'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-petroleo-600 hover:text-petroleo-500"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Precisa de ajuda? Entre em contato com nosso suporte
          </p>
        </div>
      </div>
    </div>
  );
}
