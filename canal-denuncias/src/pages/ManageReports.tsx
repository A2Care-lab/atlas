import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Report, ReportStatus } from '../types/database';
import { FileText, Eye, Filter, Search, AlertTriangle, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { ClearFiltersButton } from '../components/ClearFiltersButton';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import MessageModal from '../components/MessageModal';

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

const STATUS_COLORS: Record<ReportStatus, string> = {
  received: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  under_analysis: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  under_investigation: 'bg-red-500/20 text-red-400 border border-red-500/30',
  waiting_info: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  corporate_approval: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  approved: 'bg-emerald-600/20 text-emerald-500 border border-emerald-600/30',
  rejected: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  critical: 'bg-rose-600/20 text-rose-500 border border-rose-600/30'
}

export function ManageReports() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [pendingDeleteReport, setPendingDeleteReport] = useState<Report | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [slaFilter, setSlaFilter] = useState<'all' | 'in_time' | 'overdue'>('all');
  const isAdmin = profile?.role === 'admin';

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

  const loadReports = async () => {
    if (!profile) return;

    try {
      setPageError('');
      let companyIds: string[] | null = null
      if (profile.role === 'crm_n1') {
        try {
          const { data } = await supabase
            .from('crm_n1_company_access')
            .select('company_id')
            .eq('user_id', profile.id)
          const extras = (data || []).map((r:any)=>r.company_id)
          const base = profile.company_id ? [profile.company_id] : []
          companyIds = Array.from(new Set([...base, ...extras]))
        } catch {}
      }

      let query = supabase
        .from('reports')
        .select(`
          *,
          attachments(*),
          comments(*),
          status_history(*),
          company:companies(id,name,sla_days)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por empresa
      if (profile.role !== 'admin') {
        if (profile.role === 'crm_n1' && companyIds && companyIds.length > 0) {
          query = query.in('company_id', companyIds as any);
        } else {
          query = query.eq('company_id', profile.company_id);
        }
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

  const handleDeleteReport = async (report: Report) => {
    if (!isAdmin) return;

    setPageError('');
    setDeletingReportId(report.id);

    try {
      const attachmentPaths = (report.attachments || [])
        .map((attachment) => attachment.file_path)
        .filter(Boolean);

      if (attachmentPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('reports')
          .remove(attachmentPaths);

        if (storageError) {
          console.warn('Falha ao remover anexos da denúncia no storage', storageError);
        }
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      setReports((current) => current.filter((item) => item.id !== report.id));
      setPendingDeleteReport(null);

      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
        setDetailsOpen(false);
      }
    } catch (deleteError) {
      console.error('Erro ao excluir denúncia', deleteError);
      setPageError('Nao foi possivel excluir a denuncia.');
    } finally {
      setDeletingReportId(null);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Filter by risk level
    if (riskFilter !== 'all') {
      filtered = filtered.filter(report => report.risk_level === riskFilter);
    }

    // Filter by SLA status
    if (slaFilter !== 'all') {
      filtered = filtered.filter((report) => {
        const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0;
        if (!slaDays) return false; // sem SLA: não entra em filtros específicos

        const created = new Date(report.created_at);
        const isFinalized = report.status === 'approved' || report.status === 'rejected';

        if (isFinalized) {
          let finalizedAt: Date | undefined;
          const list = (report.status_history || []).filter((h) => h.new_status === 'approved' || h.new_status === 'rejected');
          if (list.length > 0) {
            const last = list[list.length - 1];
            finalizedAt = new Date(last.created_at);
          } else {
            try { finalizedAt = new Date(report.updated_at); } catch { finalizedAt = undefined; }
          }
          if (!finalizedAt) return false;
          const totalDays = Math.max(0, Math.ceil((finalizedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
          const within = totalDays <= slaDays;
          return slaFilter === 'overdue' ? !within : within;
        }

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

  const getStatusLabel = (status: ReportStatus): string => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getRiskLabel = (risk: string): string => {
    const option = RISK_OPTIONS.find(opt => opt.value === risk);
    return option?.label || risk;
  };

  const getIconForStatus = (status: ReportStatus) => {
    switch (status) {
      case 'received':
      case 'under_analysis':
        return <Clock className="h-3 w-3" />
      case 'under_investigation':
      case 'waiting_info':
        return <AlertCircle className="h-3 w-3" />
      case 'corporate_approval':
        return <FileText className="h-3 w-3" />
      case 'approved':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const renderSlaBadge = (report: Report) => {
    const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0;
    const created = new Date(report.created_at);

    const isFinalized = report.status === 'approved' || report.status === 'rejected';
    if (isFinalized) {
      let finalizedAt: Date | undefined;
      const list = (report.status_history || []).filter((h) => h.new_status === 'approved' || h.new_status === 'rejected');
      if (list.length > 0) {
        const last = list[list.length - 1];
        finalizedAt = new Date(last.created_at);
      } else {
        try { finalizedAt = new Date(report.updated_at); } catch { finalizedAt = undefined; }
      }
      if (!finalizedAt) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600">SLA não definido</span>;
      }
      const totalDays = Math.max(0, Math.ceil((finalizedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      const over = slaDays ? Math.max(0, totalDays - slaDays) : 0;
      const within = slaDays ? totalDays <= slaDays : true;
      const color = within ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30';
      const label = `${totalDays} dia${totalDays === 1 ? '' : 's'}`;
      const extra = slaDays ? (over > 0 ? `- Fora do SLA por ${over} dia${over === 1 ? '' : 's'}` : `- Dentro do SLA`) : '';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}{extra ? ` ${extra}` : ''}</span>
      );
    }

    if (!slaDays) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600">SLA não definido</span>
      );
    }
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + slaDays);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const expired = diffDays < 0;
    const color = expired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    const label = `${expired ? 'Vencido' : 'Vence em'} ${deadline.toLocaleDateString('pt-BR')}`;
    const extra = `${expired ? 'há' : 'faltam'} ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'}`;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label} — {extra}</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Painel de Gestão de Denúncias
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {filteredReports.length} de {reports.length} denúncias
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-400 -mt-4">
        Administre, analise e acompanhe todas as denúncias registradas na organização
      </p>

      {pageError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {pageError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-sky-400 mr-2" />
            <span className="text-sm font-semibold text-gray-200">Filtros</span>
          </div>
          <ClearFiltersButton onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRiskFilter('all'); setSlaFilter('all'); }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por protocolo, título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-3 py-2.5 border border-white/10 bg-white/5 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-white/10 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white [&>option]:bg-slate-800"
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
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-white/10 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white [&>option]:bg-slate-800"
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
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-white/10 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white [&>option]:bg-slate-800"
            >
              <option value="all">Todos os SLA</option>
              <option value="in_time">Dentro do prazo</option>
              <option value="overdue">Fora do prazo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-16 text-center">
              <FileText className="mx-auto h-14 w-14 text-gray-600" />
              <h3 className="mt-2 text-lg font-semibold text-gray-200">
                Nenhuma denúncia encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Tente ajustar os filtros ou buscar por termos diferentes.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
            {filteredReports.slice((page - 1) * perPage, (page - 1) * perPage + perPage).map((report) => (
              <li key={report.id} className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl overflow-hidden hover:bg-white/10 hover:shadow-sky-500/10 hover:border-white/20 transition-all duration-200">
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                        <FileText className="h-6 w-6 text-sky-400" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-bold text-white">Protocolo: {report.protocol}</span>
                          {report.company?.name && (
                            <span className="text-gray-500 hidden sm:inline">—</span>
                          )}
                          {report.company?.name && (
                            <span className="text-gray-400 font-medium">{report.company.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Criado em {new Date(report.created_at).toLocaleDateString('pt-BR')} às {new Date(report.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2">
                        {renderSlaBadge(report)}
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${RISK_COLORS[report.risk_level] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                        Risco {getRiskLabel(report.risk_level)}
                      </span>

                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[report.status]}`}>
                        {getIconForStatus(report.status)}
                        <span className="ml-1.5">{getStatusLabel(report.status)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pl-0 sm:pl-[3.5rem]">
                    <h3 className="text-base font-semibold text-gray-200 mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-0 sm:pl-[3.5rem]">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        {report.attachments?.length || 0} anexos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        {(() => {
                          const all = report.comments || [];
                          const count = profile?.role === 'user' ? all.filter((c) => !c.is_internal).length : all.length;
                          return count || 0;
                        })()} comentários
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        {report.is_anonymous ? 'Anônima' : 'Identificada'}
                      </span>
                    </div>
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setPageError('');
                            setPendingDeleteReport(report);
                          }}
                          disabled={deletingReportId === report.id}
                          className="inline-flex items-center justify-center px-4 py-2 border border-red-500/30 text-sm font-medium rounded-lg text-red-300 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingReportId === report.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedReport(report); setDetailsOpen(true); }}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-white/10 text-sm font-medium rounded-lg text-white bg-white/5 hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Resultados por página</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="border border-white/10 bg-white/5 text-white rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 [&>option]:bg-slate-800"
            >
              {[5,10,20,50].map((n) => (
                <option key={n} value={n} className="bg-slate-800 text-white">{n}</option>
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
              className={`inline-flex items-center px-3 py-2 rounded-md border text-sm transition-colors ${page <= 1 ? 'text-gray-600 border-white/5 cursor-not-allowed' : 'text-gray-300 border-white/10 hover:bg-white/5 hover:text-white'}`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </button>
            <span className="text-sm text-gray-400">Página {page} de {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className={`inline-flex items-center px-3 py-2 rounded-md border text-sm transition-colors ${page >= pageCount ? 'text-gray-600 border-white/5 cursor-not-allowed' : 'text-gray-300 border-white/10 hover:bg-white/5 hover:text-white'}`}
            >
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      <ReportDetailsModal
        report={selectedReport}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        hideFinalStatusOptions
        hideStatusControls={profile?.role === 'crm_n1'}
      />
      <MessageModal
        open={!!pendingDeleteReport}
        title="Confirmar exclusão"
        variant="error"
        message={
          pendingDeleteReport ? (
            <>
              <p>
                Tem certeza que deseja excluir a denúncia <strong>{pendingDeleteReport.protocol}</strong>?
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Essa ação remove a denúncia e seus registros relacionados. Somente administradores podem realizar essa operação.
              </p>
            </>
          ) : null
        }
        onClose={() => {
          if (!deletingReportId) {
            setPendingDeleteReport(null);
          }
        }}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setPendingDeleteReport(null)}
              disabled={!!deletingReportId}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (pendingDeleteReport) {
                  void handleDeleteReport(pendingDeleteReport);
                }
              }}
              disabled={!pendingDeleteReport || !!deletingReportId}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deletingReportId ? 'Excluindo...' : 'Excluir denúncia'}
            </button>
          </div>
        }
      />
    </div>
  );
}
