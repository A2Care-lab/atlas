import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePasswordRecovery } from '../hooks/usePasswordRecovery';
import AtlasLogo from '../components/AtlasLogo';
import { Eye, EyeOff, Lock, CheckCircle, Loader2 } from 'lucide-react';

export default function PasswordRecoveryReset() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetState, resetPassword, validateToken } = usePasswordRecovery();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenMessage, setTokenMessage] = useState('');

  // Validate token on mount
  useEffect(() => {
    const validateRecoveryToken = async () => {
      if (!token) {
        setTokenValid(false);
        setTokenMessage('Token inválido');
        return;
      }

      const result = await validateToken(token);
      setTokenValid(result.valid);
      setTokenMessage(result.message || '');
    };

    validateRecoveryToken();
  }, [token, validateToken]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[a-z]/.test(newPassword)) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/\d/.test(newPassword)) strength += 25;
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const result = await resetPassword(token, newPassword, confirmPassword);
    if (result.success) {
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-yellow-500';
    if (passwordStrength <= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'Muito fraca';
    if (passwordStrength <= 50) return 'Fraca';
    if (passwordStrength <= 75) return 'Média';
    return 'Forte';
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Link Inválido ou Expirado
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {tokenMessage || 'Este link de recuperação não é mais válido.'}
            </p>
            <Link
              to="/recover"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (resetState.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Senha Redefinida com Sucesso!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Sua senha foi atualizada. Você será redirecionado para a página de login em instantes.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
            >
              Ir para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <AtlasLogo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar Nova Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nova Senha */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Força da senha</span>
                    <span className={passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-blue-600' : passwordStrength >= 25 ? 'text-yellow-600' : 'text-red-600'}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-petroleo-500 focus:border-petroleo-500 sm:text-sm"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Requisitos da senha:</p>
              <ul className="space-y-1">
                <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-3 w-3 mr-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-300'}`} />
                  Mínimo 8 caracteres
                </li>
                <li className={`flex items-center ${/[a-zA-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-3 w-3 mr-2 ${/[a-zA-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-300'}`} />
                  Letras
                </li>
                <li className={`flex items-center ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-3 w-3 mr-2 ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-300'}`} />
                  Números
                </li>
                <li className={`flex items-center ${newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-3 w-3 mr-2 ${newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-300'}`} />
                  Senhas coincidem
                </li>
              </ul>
            </div>

            {resetState.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{resetState.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={resetState.loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || passwordStrength < 50}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetState.loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Este link expira em 24 horas
          </p>
        </div>
      </div>
    </div>
  );
}
