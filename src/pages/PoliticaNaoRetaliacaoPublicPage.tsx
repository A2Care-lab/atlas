import { ScrollText } from 'lucide-react';
import { usePoliticaNaoRetaliacao } from '../hooks/usePoliticaNaoRetaliacao';

export default function PoliticaNaoRetaliacaoPublicPage() {
  const { politica, loading, error } = usePoliticaNaoRetaliacao();

  const formattedDate = politica?.updated_at
    ? new Date(politica.updated_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <ScrollText className="mr-2 h-5 w-5 text-petroleo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Proteção ao Denunciante</h1>
      </div>
      <p className="text-sm text-gray-700">
        Aqui reforçamos nosso compromisso com um ambiente seguro, ético e livre de retaliações.
      </p>

      <div className="bg-white shadow rounded-lg p-6">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-petroleo-600"></div>
          </div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 text-red-700 p-4">
            {error}
          </div>
        )}
        {!loading && !error && politica && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Versão atual:</span> {politica.version_code}
              {formattedDate && (
                <span className="ml-3"><span className="font-medium">Última atualização:</span> {formattedDate}</span>
              )}
            </div>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: politica.content }} />
            </div>
          </div>
        )}
        {!loading && !error && !politica && (
          <div className="rounded border border-gray-200 bg-gray-50 text-gray-700 p-4">
            Nenhuma Política de Não Retaliação está cadastrada no sistema.
          </div>
        )}
      </div>
    </div>
  );
}
