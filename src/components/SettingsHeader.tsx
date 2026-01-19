import { useAuth } from '../hooks/useAuth';

export default function SettingsHeader() {
  const { profile } = useAuth();
  const isCorp = profile?.role === 'corporate_manager' || profile?.role === 'approver_manager';
  const subtitle = isCorp
    ? 'Gerencie funcionalidades, planos e assinaturas disponíveis para sua organização.'
    : 'Gerencie usuários, empresas, áreas e os parâmetros gerais de funcionamento da plataforma.';
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold text-gray-900">Centro de Configurações do Sistema</h1>
      <p className="mt-1 text-sm text-gray-600">
        {subtitle}
      </p>
    </div>
  );
}
