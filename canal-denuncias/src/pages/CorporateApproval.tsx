import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Report, ReportStatus } from '../types/database';
import { FileText, Eye, CheckCircle, XCircle, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import MessageModal from '../components/MessageModal';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import ApproveReportModal from '../components/ApproveReportModal';
import { ClearFiltersButton } from '../components/ClearFiltersButton';
import { getSituationTypeLabel } from '../utils/labels';
import { deleteReportsWithAttachments } from '../utils/reportDeletion';

export function CorporateApproval() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveAction, setApproveAction] = useState<'approve'|'reject'>('approve');
  const [pendingDeleteReports, setPendingDeleteReports] = useState<Report[]>([]);
  const [deletingReportIds, setDeletingReportIds] = useState<string[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<'all' | 'in_time' | 'overdue'>('all');
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const isAdmin = profile?.role === 'admin';

  const STATUS_OPTIONS: { value: ReportStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'received', label: 'Recebida' },
    { value: 'under_analysis', label: 'Em Análise' },
    { value: 'under_investigation', label: 'Em Apuração' },
    { value: 'waiting_info', label: 'Aguardando Informação' },
    { value: 'corporate_approval', label: 'Aprovação Corporativa' },
    { value: 'approved', label: 'Concluída' },
    { value: 'rejected', label: 'Rejeitada' },
  ];

  const RISK_OPTIONS = [
    { value: 'all', label: 'Todos os Riscos' },
    { value: 'low', label: 'Baixo' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'high', label: 'Alto' },
    { value: 'critical', label: 'Crítico' },
  ];

  useEffect(() => {
    loadReports();
  }, [profile]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, riskFilter, slaFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, riskFilter, slaFilter, perPage]);

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / perPage));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
    if (page < 1) setPage(1);
  }, [filteredReports, perPage, pageCount, page]);

  useEffect(() => {
    const visibleIds = new Set(filteredReports.map((report) => report.id));
    setSelectedReportIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [filteredReports]);

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
        .eq('status', 'corporate_approval')
        .order('created_at', { ascending: false });

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

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(report => report.risk_level === riskFilter);
    }

    if (slaFilter !== 'all') {
      filtered = filtered.filter((report) => {
        const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0;
        if (!slaDays) return false;
        const created = new Date(report.created_at);
        const deadline = new Date(created);
        deadline.setDate(deadline.getDate() + slaDays);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const overdue = diffDays < 0;
        return slaFilter === 'overdue' ? overdue : !overdue;
      });
    }

    setFilteredReports(filtered);
  };

  const openApproveModal = (report: Report, approve: boolean) => {
    setSelectedReport(report);
    setApproveAction(approve ? 'approve' : 'reject');
    setApproveOpen(true);
  };

  const handleDeleteReports = async (reportsToDelete: Report[]) => {
    if (!isAdmin || reportsToDelete.length === 0) return;

    const ids = reportsToDelete.map((report) => report.id);
    const idSet = new Set(ids);
    setDeletingReportIds(ids);

    try {
      await deleteReportsWithAttachments(reportsToDelete);
      setReports((current) => current.filter((report) => !idSet.has(report.id)));
      setSelectedReportIds((current) => current.filter((id) => !idSet.has(id)));
      setPendingDeleteReports([]);

      if (selectedReport?.id && idSet.has(selectedReport.id)) {
        setSelectedReport(null);
        setDetailsOpen(false);
        setApproveOpen(false);
      }
    } catch (error) {
      console.error('Erro ao excluir denúncias na aprovação corporativa', error);
      setErrorMsg(reportsToDelete.length > 1 ? 'Nao foi possivel excluir as denuncias selecionadas.' : 'Nao foi possivel excluir a denuncia selecionada.');
      setErrorOpen(true);
    } finally {
      setDeletingReportIds([]);
    }
  };

  const getStatusLabel = (status: ReportStatus): string => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
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
      corporate_approval: 'bg-blue-100 text-blue-800',
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

  const currentPageReports = filteredReports.slice((page - 1) * perPage, (page - 1) * perPage + perPage);
  const currentPageReportIds = currentPageReports.map((report) => report.id);
  const allCurrentPageSelected = currentPageReports.length > 0 && currentPageReportIds.every((id) => selectedReportIds.includes(id));
  const selectedReports = reports.filter((report) => selectedReportIds.includes(report.id));

  const toggleReportSelection = (reportId: string) => {
    setSelectedReportIds((current) =>
      current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId]
    );
  };

  const toggleCurrentPageSelection = () => {
    setSelectedReportIds((current) =>
      allCurrentPageSelected
        ? current.filter((id) => !currentPageReportIds.includes(id))
        : Array.from(new Set([...current, ...currentPageReportIds]))
    );
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Painel de Aprovação Corporativa
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredReports.length} de {reports.length} denúncias
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700">
        Avalie, valide e aprove as denúncias conforme critérios internos e níveis de governança.
      </p>

      <div className="bg-white border border-petroleo-100 shadow-lg rounded-xl mb-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-petroleo-600 mr-2" />
            <span className="text-sm font-semibold text-gray-800">Filtros</span>
          </div>
          <ClearFiltersButton onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRiskFilter('all'); setSlaFilter('all'); }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por protocolo, título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-3 py-3 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              className="block w-full pl-3 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as 'all' | 'in_time' | 'overdue')}
              className="block w-full pl-3 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:border-petroleo-500"
            >
              <option value="all">Todos os SLA</option>
              <option value="in_time">Dentro do prazo</option>
              <option value="overdue">Fora do prazo</option>
            </select>
          </div>
        </div>
      </div>

      {isAdmin && filteredReports.length > 0 && (
        <div className="bg-white border border-petroleo-100 shadow-lg rounded-xl p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleCurrentPageSelection}
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-petroleo-200 text-sm font-medium rounded-lg text-petroleo-700 bg-petroleo-50 hover:bg-petroleo-100 transition-colors shadow-sm"
              >
                {allCurrentPageSelected ? 'Desmarcar página' : 'Selecionar página'}
              </button>
              <span className="text-sm text-gray-700">
                {selectedReportIds.length} denúncia{selectedReportIds.length === 1 ? '' : 's'} selecionada{selectedReportIds.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedReportIds([])}
                type="button"
                disabled={selectedReportIds.length === 0 || deletingReportIds.length > 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Limpar seleção
              </button>
              <button
                onClick={() => setPendingDeleteReports(selectedReports)}
                type="button"
                disabled={selectedReportIds.length === 0 || deletingReportIds.length > 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir selecionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredReports.length === 0 ? (
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
          {currentPageReports.map((report) => (
            <div key={report.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isAdmin && (
                      <label className="mr-3 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedReportIds.includes(report.id)}
                          onChange={() => toggleReportSelection(report.id)}
                          disabled={deletingReportIds.length > 0}
                          className="h-4 w-4 rounded border-gray-300 text-petroleo-600 focus:ring-petroleo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </label>
                    )}
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
                    <span className="text-xs text-gray-500">SLA</span>
                    {renderSlaBadge(report)}
                    {report.risk_level === 'high' || report.risk_level === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : null}
                    <span className="text-xs text-gray-500">Grau de Risco</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(report.risk_level)}`}>
                      {getRiskLabel(report.risk_level)}
                    </span>
                    <span className="text-xs text-gray-500">Status</span>
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
                    <p className="text-sm text-gray-600">
                      {getSituationTypeLabel(report.situation_type)}
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
                    onClick={() => { setSelectedReport(report); setDetailsOpen(true); }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petroleo-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes Completos
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openApproveModal(report, false)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </button>
                    <button
                      onClick={() => openApproveModal(report, true)}
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
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Resultados por página</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1"
          >
            {[5,10,20,50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>
            Mostrando {filteredReports.length === 0 ? 0 : ((page - 1) * perPage + 1)}–{Math.min(page * perPage, filteredReports.length)} de {filteredReports.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`inline-flex items-center px-3 py-2 rounded-md border text-sm ${page <= 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </button>
          <span className="text-sm text-gray-700">Página {page} de {pageCount}</span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className={`inline-flex items-center px-3 py-2 rounded-md border text-sm ${page >= pageCount ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
    <ReportDetailsModal
      report={selectedReport}
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      hideStatusControls
      hideCommentInput
      disableAttachmentUpload
      hideInternalCommentToggle
    />
    <ApproveReportModal
      open={approveOpen}
      report={selectedReport}
      action={approveAction}
      onClose={() => setApproveOpen(false)}
      onCompleted={async () => { setApproveOpen(false); await loadReports(); }}
    />
    <MessageModal
      open={pendingDeleteReports.length > 0}
      title="Confirmar exclusão"
      variant="error"
      message={
        pendingDeleteReports.length > 0 ? (
          <>
            <p>
              {pendingDeleteReports.length === 1 ? (
                <>
                  Tem certeza que deseja excluir a denúncia <strong>{pendingDeleteReports[0].protocol}</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir <strong>{pendingDeleteReports.length} denúncias selecionadas</strong>?
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Essa ação remove as denúncias e seus registros relacionados. Somente administradores podem realizar essa operação.
            </p>
          </>
        ) : null
      }
      onClose={() => {
        if (deletingReportIds.length === 0) {
          setPendingDeleteReports([]);
        }
      }}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setPendingDeleteReports([])}
            disabled={deletingReportIds.length > 0}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (pendingDeleteReports.length > 0) {
                void handleDeleteReports(pendingDeleteReports);
              }
            }}
            disabled={pendingDeleteReports.length === 0 || deletingReportIds.length > 0}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deletingReportIds.length > 0 ? 'Excluindo...' : pendingDeleteReports.length > 1 ? 'Excluir denúncias' : 'Excluir denúncia'}
          </button>
        </div>
      }
    />
    <MessageModal open={errorOpen} title="Falha na atualização" message={errorMsg} variant="error" onClose={()=>setErrorOpen(false)} />
    </>
  );
}
