import { useState } from 'react'
import { Users, Building2, Timer, UserPlus } from 'lucide-react'

export function Settings() {
  const tabs = [
    { key: 'users', label: "Usuários", icon: Users },
    { key: 'areas', label: "Áreas Corporativas", icon: Building2 },
    { key: 'companies', label: "Empresas", icon: Building2 },
    { key: 'invites', label: "Invites", icon: UserPlus },
    { key: 'slas', label: "SLA's", icon: Timer },
  ] as const

  const [active, setActive] = useState<typeof tabs[number]['key']>('users')

  const renderContent = () => {
    switch (active) {
      case 'users':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Usuários</h2>
            <p className="text-sm text-gray-600">Aqui você poderá cadastrar, editar e remover usuários do sistema.</p>
          </div>
        )
      case 'areas':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Áreas Corporativas</h2>
            <p className="text-sm text-gray-600">Configure as áreas e departamentos corporativos utilizados nas denúncias.</p>
          </div>
        )
      case 'companies':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Empresas</h2>
            <p className="text-sm text-gray-600">Cadastre e gerencie as empresas vinculadas ao sistema.</p>
          </div>
        )
      case 'invites':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invites</h2>
            <p className="text-sm text-gray-600">Envie convites para novos usuários e acompanhe o status.</p>
          </div>
        )
      case 'slas':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA's</h2>
            <p className="text-sm text-gray-600">Defina prazos e níveis de serviço para cada etapa das denúncias.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = active === key
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`
                    whitespace-nowrap py-4 border-b-2 text-sm font-medium flex items-center
                    ${isActive ? 'border-petroleo-600 text-petroleo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
