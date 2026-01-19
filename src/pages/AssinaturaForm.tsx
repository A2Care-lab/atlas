import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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
            status: formData.status
          }]);

        if (error) throw error;
      }

      navigate('/admin/configuracoes/assinaturas');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/configuracoes/assinaturas')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-medium text-gray-900">
                {id ? 'Editar Assinatura' : 'Nova Assinatura'}
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div>
            <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
              Empresa
            </label>
            <select
              id="company_id"
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
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
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700">
                Valor (R$)
              </label>
              <input
                type="number"
                id="valor"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="usuarios" className="block text-sm font-medium text-gray-700">
                Limite de Usuários
              </label>
              <input
                type="number"
                id="usuarios"
                min="0"
                value={formData.usuarios}
                onChange={(e) => setFormData({ ...formData, usuarios: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="denuncias" className="block text-sm font-medium text-gray-700">
                Limite de Denúncias
              </label>
              <input
                type="number"
                id="denuncias"
                min="0"
                value={formData.denuncias}
                onChange={(e) => setFormData({ ...formData, denuncias: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="Ativa">Ativa</option>
              <option value="Suspensão Temporária">Suspensão Temporária</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/configuracoes/assinaturas')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              <Save className="-ml-1 mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : (id ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}