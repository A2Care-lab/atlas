import { useState, useEffect } from 'react';
import { MessageCircle, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WhatsAppManager() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWhatsAppNumber();
  }, []);

  const fetchWhatsAppNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
             console.error('Error fetching WhatsApp number:', error);
             if (error.code === '42P01' || error.message?.includes('does not exist')) {
                 console.warn('Tabela system_settings não encontrada. Por favor, execute o script SQL de migração.');
             }
        }
      }

      if (data) {
        setWhatsappNumber(data.value || '');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
            key: 'whatsapp_number', 
            value: editValue,
            description: 'Número do WhatsApp padrão do sistema',
            updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            alert('Erro: A tabela de configurações não existe no banco de dados. Contate o suporte técnico para executar a migração.');
        } else {
            throw error;
        }
        return;
      }

      setWhatsappNumber(editValue);
      setIsEditOpen(false);
    } catch (err) {
      console.error('Error saving WhatsApp number:', err);
      alert('Erro ao salvar o número do WhatsApp. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setEditValue(whatsappNumber);
    setIsEditOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="bg-emerald-500/20 p-3 rounded-full mr-4 border border-emerald-500/30">
                    <MessageCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-white">WhatsApp do Sistema</h3>
                    <p className="text-sm text-gray-400">
                        Este número será utilizado como contato padrão do sistema.
                    </p>
                </div>
            </div>
            <button
                onClick={openEdit}
                className="inline-flex items-center px-4 py-2 border border-white/10 shadow-sm text-sm font-medium rounded-lg text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
                <Edit className="h-4 w-4 mr-2" />
                Editar
            </button>
        </div>
        
        <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-gray-400 mb-1">Número Atual</p>
            <p className="text-lg text-white font-mono bg-white/5 inline-block px-3 py-1 rounded-lg border border-white/5">
                {whatsappNumber || 'Nenhum número configurado'}
            </p>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 text-white">
            <h3 className="text-lg font-medium text-white mb-4">Editar WhatsApp</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Número de Telefone
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Ex: +55 11 99999-9999"
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Insira o número completo com código do país e DDD.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm"
                onClick={() => setIsEditOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-sm font-medium"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
