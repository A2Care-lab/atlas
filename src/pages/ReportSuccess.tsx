import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Brand } from '../components/Brand'

export default function ReportSuccess() {
  const location = useLocation() as { state?: { protocol?: string } }
  const navigate = useNavigate()
  const protocol = location.state?.protocol

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Brand variant="teal" withText className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Denúncia enviada com sucesso
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Obrigado por contribuir com a integridade corporativa.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {protocol && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700">Número do protocolo</p>
              <p className="mt-1 text-2xl font-semibold tracking-wide text-petroleo-700">{protocol}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">
              Você pode acompanhar o andamento e o status da sua denúncia no sistema ATLAS, na aba Minhas Denúncias.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate('/my-reports')}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
            >
              Ir para Minhas Denúncias
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
