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
    <div className="space-y-8 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-petroleo-500/10 rounded-2xl border border-petroleo-500/20 shadow-lg shadow-petroleo-500/5">
            <ScrollText className="h-8 w-8 text-petroleo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Proteção ao Denunciante
            </h1>
            <p className="text-base text-gray-400 mt-1 font-light">
              Compromisso com um ambiente seguro, ético e livre de retaliações
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-3xl shadow-2xl w-full">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-petroleo-500"></div>
          </div>
        )}
        {error && (
          <div className="m-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 p-6 flex items-start gap-3">
             <div className="mt-0.5 font-bold">Erro:</div>
            {error}
          </div>
        )}
        {!loading && !error && politica && (
          <div className="flex flex-col">
            <div className="bg-white/5 border-b border-white/10 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-petroleo-500/10 text-petroleo-300 border border-petroleo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-petroleo-400 animate-pulse"/>
                  Versão {politica.version_code}
                </span>
                {formattedDate && (
                  <span className="text-sm text-gray-400 font-medium">
                    Atualizado em {formattedDate}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-8 sm:p-10">
              <div className="prose prose-lg prose-invert max-w-none 
                prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-gray-300 prose-p:leading-relaxed
                prose-a:text-petroleo-400 prose-a:font-medium hover:prose-a:text-petroleo-300
                prose-strong:text-white prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-6
                prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-gray-300 prose-li:marker:text-petroleo-500">
                <div 
                  dangerouslySetInnerHTML={{ __html: politica.content }} 
                  className="[&_*]:text-gray-300 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_li]:text-gray-300"
                />
              </div>
            </div>
          </div>
        )}
        {!loading && !error && !politica && (
          <div className="text-center py-20 text-gray-500">
            <ScrollText className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma Política de Não Retaliação está cadastrada no sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
