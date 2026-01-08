import { useState, useEffect } from 'react';
import { Save, FileText, AlertCircle } from 'lucide-react';
import { usePoliticaNaoRetaliacao } from '../hooks/usePoliticaNaoRetaliacao';
import SettingsHeader from '../components/SettingsHeader';
import SettingsTabs from '../components/SettingsTabs';

export default function PoliticaNaoRetaliacaoPage() {
  const { politica, loading, error, savePolitica } = usePoliticaNaoRetaliacao();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (politica) {
      setContent(politica.content);
    }
  }, [politica]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await savePolitica(content);
    setIsSaving(false);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(prev => prev + text);
    } catch (err) {
      console.error('Erro ao colar:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SettingsHeader />
        <SettingsTabs />
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
            <div className="h-32 bg-gray-200 rounded mb-4" />
            <div className="h-10 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsTabs />
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Gestão da Política de Não Retaliação
            </h2>
            <p className="text-gray-600">
              Crie, edite e mantenha a política de não retaliação aplicada às empresas vinculadas ao sistema.
            </p>
          </div>
          
          {error && (
            <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {saveSuccess && (
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-md">
              <Save className="h-4 w-4 mr-2" />
              <span className="text-sm">Salvo com sucesso!</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="policy-content" className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo da Política
            </label>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={handlePaste}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Colar
              </button>
            </div>
            <textarea
              id="policy-content"
              rows={20}
              className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Digite ou cole o conteúdo da política de não retaliação aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {politica?.updated_at && (
                <span>
                  Última atualização: {new Date(politica.updated_at).toLocaleDateString('pt-BR')} às {new Date(politica.updated_at).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSaving || !content.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
              }`}
            >
              {isSaving ? (
                <span className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Política
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
