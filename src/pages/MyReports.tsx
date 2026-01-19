import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Report, ReportStatus } from '../types/database';
import { FileText, Eye, Plus, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { ClearFiltersButton } from '../components/ClearFiltersButton';
import { ReportDetailsModal } from '../components/ReportDetailsModal';

const STATUS_COLORS = {
  received: 'bg-petroleo-100 text-petroleo-800',
  under_analysis: 'bg-yellow-100 text-yellow-800',
  under_investigation: 'bg-red-100 text-red-800',
  waiting_info: 'bg-purple-100 text-purple-800',
  corporate_approval: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800',
};

export function MyReports() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [protocolFilter, setProtocolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, [profile, protocolFilter, statusFilter, startDate, endDate]);

  const loadReports = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          attachments(*),
          comments(*),
          company:companies(id,name,sla_days)
        `)
        .order('created_at', { ascending: false });

      // Sempre filtrar pelas denúncias abertas pelo usuário logado
      query = query.eq('user_id', profile.id);

      // Filtros de busca
      if (protocolFilter) {
        query = query.ilike('protocol', `%${protocolFilter}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter as ReportStatus);
      }
      if (startDate) {
        const startIso = new Date(`${startDate}T00:00:00.000Z`).toISOString();
        query = query.gte('created_at', startIso);
      }
      if (endDate) {
        const endIso = new Date(`${endDate}T23:59:59.999Z`).toISOString();
        query = query.lte('created_at', endIso);
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

  const getStatusLabel = (status: ReportStatus): string => {
    const labels = {
      received: 'Recebida',
      under_analysis: 'Em Análise',
      under_investigation: 'Em Apuração',
      waiting_info: 'Aguardando Informação',
      corporate_approval: 'Aprovação Corporativa',
      approved: 'Concluída',
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

  const getIconForStatus = (status: ReportStatus) => {
    switch (status) {
      case 'received':
      case 'under_analysis':
        return <Clock className="h-4 w-4" />;
      case 'under_investigation':
      case 'waiting_info':
        return <AlertCircle className="h-4 w-4" />;
      case 'corporate_approval':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderSlaBadge = (report: Report) => {
    const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0;
    if (!slaDays) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">SLA não definido</span>
      );
    }
    const created = new Date(report.created_at);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + slaDays);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const expired = diffDays < 0;
    const color = expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    const label = `${expired ? 'Vencido' : 'Vence em'} ${deadline.toLocaleDateString('pt-BR')}`;
    const extra = `${expired ? 'há' : 'faltam'} ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'}`;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label} — {extra}</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Ocorrências Registradas</h1>
        {profile?.role === 'user' && (
          <button
            onClick={() => navigate('/new-report')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Denúncia
          </button>
        )}
      </div>
      <p className="text-sm text-gray-700">
        Acompanhe aqui todas as denúncias que você abriu, com status e atualizações em tempo real
      </p>
      <div className="bg-white border border-petroleo-100 shadow-lg rounded-xl mb-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-petroleo-600 mr-2" />
            <span className="text-sm font-semibold text-gray-800">Filtros</span>
          </div>
          <ClearFiltersButton onClick={() => { setProtocolFilter(''); setStatusFilter(''); setStartDate(''); setEndDate(''); }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              placeholder="Busque pelo número do protocólo. Ex: DEN09432791"
              className="pl-3 pr-3 py-3 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value || '') as ReportStatus | '')}
              className="block w-full pl-3 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            >
              <option value="">Todos os Status</option>
              <option value="received">Recebida</option>
              <option value="under_analysis">Em Análise</option>
              <option value="under_investigation">Em Apuração</option>
              <option value="waiting_info">Aguardando Informação</option>
              <option value="corporate_approval">Aprovação Corporativa</option>
              <option value="approved">Concluída</option>
              <option value="rejected">Rejeitada</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full pl-3 pr-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full pl-3 pr-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>
        </div>
        
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-petroleo-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma denúncia encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Você ainda não fez nenhuma denúncia.</p>
          {profile?.role === 'user' && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/new-report')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-petroleo-600 hover:bg-petroleo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Denúncia
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-300">
            {reports.map((report) => (
              <li key={report.id}>
                <div className="px-6 py-4 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-petroleo-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Protocolo: {report.protocol}
                          </p>
                          <p className="text-sm text-gray-500">
                            Criado em: {new Date(report.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center md:space-x-4 space-x-2 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                            {getIconForStatus(report.status)}
                            <span className="ml-1">{getStatusLabel(report.status)}</span>
                          </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-2">
                          <span className="text-xs text-gray-500">SLA</span>
                          {renderSlaBadge(report)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {report.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {report.description.substring(0, 150)}...
                      </p>
                      <div className="mt-2 md:hidden flex items-center space-x-2">
                        <span className="text-xs text-gray-500">SLA</span>
                        {renderSlaBadge(report)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-4">
                        {report.attachments?.length || 0} anexos
                      </span>
                      <span>
                        {(() => {
                          const all = report.comments || [];
                          const count = profile?.role === 'user' ? all.filter((c) => !c.is_internal).length : all.length;
                          return count || 0;
                        })()} comentários
                      </span>
                      {report.is_anonymous ? (
                        <span className="ml-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Anônima
                        </span>
                      ) : (
                        <span className="ml-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Identificada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 md:ml-4 flex-shrink-0 pr-2">
                    <button
                      onClick={() => { setSelectedReport(report); setDetailsOpen(true); }}
                    className="inline-flex items-center px-2.5 md:px-3 py-2 border border-petroleo-300 shadow-sm text-xs md:text-sm leading-4 font-medium rounded-md text-petroleo-700 bg-white hover:bg-petroleo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ReportDetailsModal report={selectedReport} open={detailsOpen} onClose={() => setDetailsOpen(false)} hideRiskInfo hideStatusControls hideInternalCommentToggle />
    </div>
  );
}
