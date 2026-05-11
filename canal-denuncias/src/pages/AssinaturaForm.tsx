import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import SettingsHeader from '../components/SettingsHeader';

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
}

interface Assinatura {
  id: string;
  company_id: string;
  valor: number;
  usuarios: number;
  denuncias: number;
  whatsapp_monthly_limit?: number;
  ai_monthly_limit?: number;
  status: 'Ativa' | 'Suspensão Temporária' | 'Cancelada';
}

export default function AssinaturaForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    company_id: '',
    valor: 0,
    usuarios: 0,
    denuncias: 0,
    whatsapp_monthly_limit: 0,
    ai_monthly_limit: 0,
    status: 'Ativa' as const
  });

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, cnpj')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Se for edição, carregar assinatura existente
      if (id) {
        const { data: assinaturaData, error: assinaturaError } = await supabase
          .from('assinaturas')
          .select('*')
          .eq('id', id)
          .single();

        if (assinaturaError) throw assinaturaError;
        
        setFormData({
          company_id: assinaturaData.company_id,
          valor: assinaturaData.valor,
          usuarios: assinaturaData.usuarios,
          denuncias: assinaturaData.denuncias,
          whatsapp_monthly_limit: assinaturaData.whatsapp_monthly_limit || 0,
          ai_monthly_limit: assinaturaData.ai_monthly_limit || 0,
          status: assinaturaData.status
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id) {
      alert('Por favor, selecione uma empresa');
      return;
    }

    try {
      setSaving(true);
      
      if (id) {
        // Atualizar assinatura existente
        const { error } = await supabase
          .from('assinaturas')
          .update({
            company_id: formData.company_id,
            valor: formData.valor,
            usuarios: formData.usuarios,
            denuncias: formData.denuncias,
            whatsapp_monthly_limit: formData.whatsapp_monthly_limit,
            ai_monthly_limit: formData.ai_monthly_limit,
            status: formData.status
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Criar nova assinatura
        const { error } = await supabase
          .from('assinaturas')
          .insert([{
            company_id: formData.company_id,
            valor: formData.valor,
            usuarios: formData.usuarios,
            denuncias: formData.denuncias,
            whatsapp_monthly_limit: formData.whatsapp_monthly_limit,
            ai_monthly_limit: formData.ai_monthly_limit,
            status: formData.status
          }]);

        if (error) throw error;
      }

      navigate('/settings?tab=assinaturas');
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      alert('Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SettingsHeader />
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/settings?tab=assinaturas')}
                  className="mr-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-medium text-white">
                  {id ? 'Editar Assinatura' : 'Nova Assinatura'}
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-400 mb-2">
                Empresa
              </label>
              <select
                id="company_id"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [&>option]:bg-slate-800"
                required
                disabled={!!id} // Não permitir mudar empresa em edição
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.cnpj && `- ${company.cnpj}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-gray-400 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  id="valor"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="usuarios" className="block text-sm font-medium text-gray-400 mb-2">
                  Limite de Usuários
                </label>
                <input
                  type="number"
                  id="usuarios"
                  min="0"
                  value={formData.usuarios}
                  onChange={(e) => setFormData({ ...formData, usuarios: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="denuncias" className="block text-sm font-medium text-gray-400 mb-2">
                  Limite de Denúncias
                </label>
                <input
                  type="number"
                  id="denuncias"
                  min="0"
                  value={formData.denuncias}
                  onChange={(e) => setFormData({ ...formData, denuncias: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsapp_monthly_limit" className="block text-sm font-medium text-gray-400 mb-2">
                  Limite Suporte WhatsApp/mês
                </label>
                <input
                  type="number"
                  id="whatsapp_monthly_limit"
                  min="0"
                  value={formData.whatsapp_monthly_limit}
                  onChange={(e) => setFormData({ ...formData, whatsapp_monthly_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="0 para desabilitar"
                />
                <p className="text-xs text-gray-500 mt-1">0 = Desabilitado</p>
              </div>

              <div>
                <label htmlFor="ai_monthly_limit" className="block text-sm font-medium text-gray-400 mb-2">
                  Limite Suporte IA/mês
                </label>
                <input
                  type="number"
                  id="ai_monthly_limit"
                  min="0"
                  value={formData.ai_monthly_limit}
                  onChange={(e) => setFormData({ ...formData, ai_monthly_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="0 para desabilitar"
                />
                <p className="text-xs text-gray-500 mt-1">0 = Desabilitado</p>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [&>option]:bg-slate-800"
              >
                <option value="Ativa">Ativa</option>
                <option value="Suspensão Temporária">Suspensão Temporária</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/settings?tab=assinaturas')}
                className="px-4 py-2 border border-white/10 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
              >
                <Save className="-ml-1 mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : (id ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
