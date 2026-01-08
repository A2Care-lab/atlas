import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Report, ReportStatus } from '../types/database';
import { FileText, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import MessageModal from '../components/MessageModal';

export function CorporateApproval() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadReports();
  }, [profile]);

  const loadReports = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          user:user_profiles(*),
          attachments(*),
          comments(*)
        `)
        .eq('status', 'corporate_approval')
        .order('created_at', { ascending: false });

      // Filtrar por empresa
      if (profile.role !== 'admin') {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string, approve: boolean) => {
    try {
      const newStatus = approve ? 'approved' : 'rejected';
      
      // Atualizar status da denúncia
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // Registrar no histórico
      await supabase.from('status_history').insert({
        report_id: reportId,
        previous_status: 'corporate_approval',
        new_status: newStatus,
        changed_by: profile?.id,
        comment: approve ? 'Denúncia aprovada e encerrada' : 'Denúncia rejeitada',
      });

      // Enviar email de notificação (implementar com Resend)
      if (approve) {
        // await sendEmailNotification(reportId);
      }

      // Recarregar lista
      await loadReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      setErrorMsg('Erro ao atualizar status da denúncia.');
      setErrorOpen(true);
    }
  };

  const getStatusLabel = (status: ReportStatus): string => {
    const labels = {
      received: 'Recebida',
      under_analysis: 'Em Análise',
      under_investigation: 'Em Apuração',
      waiting_info: 'Aguardando Informação',
      corporate_approval: 'Aprovação Corporativa',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
    };
    return labels[status] || status;
  };

  const getRiskLabel = (risk: string): string => {
    const labels = {
      low: 'Baixo',
      moderate: 'Moderado',
      high: 'Alto',
      critical: 'Crítico',
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const getStatusColor = (status: ReportStatus): string => {
    const colors = {
      received: 'bg-petroleo-100 text-petroleo-800',
      under_analysis: 'bg-yellow-100 text-yellow-800',
      under_investigation: 'bg-red-100 text-red-800',
      waiting_info: 'bg-purple-100 text-purple-800',
      corporate_approval: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (risk: string): string => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Aprovação Corporativa
        </h1>
        <div className="text-sm text-gray-500">
          {reports.length} denúncias aguardando aprovação
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma denúncia aguardando aprovação
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Todas as denúncias foram revisadas e aprovadas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Protocolo: {report.protocol}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Criado em: {new Date(report.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.risk_level === 'high' || report.risk_level === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : null}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(report.risk_level)}`}>
                      Risco: {getRiskLabel(report.risk_level)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Descrição da Denúncia</h4>
                  <p className="text-sm text-gray-600">
                    {report.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Tipo de Situação</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {report.situation_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Departamento</h4>
                    <p className="text-sm text-gray-600">
                      {report.department || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Envolve Liderança</h4>
                    <p className="text-sm text-gray-600">
                      {report.involves_leadership ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Risco Imediato</h4>
                    <p className="text-sm text-gray-600">
                      {report.has_immediate_risk ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Classificação de Risco</h4>
                  <p className="text-sm text-gray-600">
                    Score: {report.risk_score} - {report.risk_justification}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/report/${report.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes Completos
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApprove(report.id, false)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleApprove(report.id, true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <MessageModal open={errorOpen} title="Falha na atualização" message={errorMsg} variant="error" onClose={()=>setErrorOpen(false)} />
    </>
  );
}
