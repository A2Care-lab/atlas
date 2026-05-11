import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Report, ReportStatus, RiskLevel, Company } from '../types/database';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  BarChart3,
  TrendingUp,
  Users,
  AlertOctagon,
  MessageSquare,
  BadgeCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import ChartContainer from '../components/ChartContainer'

const STATUS_COLORS = {
  received: '#0ea5e9', // Sky 500
  under_analysis: '#f59e0b', // Amber 500
  under_investigation: '#ef4444', // Red 500
  waiting_info: '#8b5cf6', // Violet 500
  corporate_approval: '#10b981', // Emerald 500
  approved: '#059669', // Emerald 600
  rejected: '#64748b', // Slate 500
};

const RISK_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const isUser = profile?.role === 'user';
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCompanies, setActiveCompanies] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [myCompanyStatus, setMyCompanyStatus] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'geral' | '1ano' | '6meses' | '3meses' | '1mes'>('geral');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companiesOpen, setCompaniesOpen] = useState(false);

  useEffect(() => {
    loadReports();
    loadActiveCounts();
    loadCompanies();
    loadMyCompanyStatus();
  }, [profile]);

  const loadReports = async () => {
    if (!profile) { 
      setLoading(false);
      return; 
    }

    try {
      let companyIds: string[] | null = null;
      if (profile.role === 'crm_n1') {
        try {
          const { data } = await supabase
            .from('crm_n1_company_access')
            .select('company_id')
            .eq('user_id', profile.id);
          const extras = (data || []).map((r: any) => r.company_id);
          companyIds = Array.from(new Set([...(profile.company_id ? [profile.company_id] : []), ...extras]));
        } catch {}
      }

      let query = supabase
        .from('reports')
        .select(`
          id, title, status, risk_level, created_at, company_id, user_id,
          company:companies(id,sla_days),
          comments(*)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'user') {
        query = query.eq('user_id', profile.id);
      } else if (profile.role !== 'admin') {
        if (profile.role === 'crm_n1' && companyIds && companyIds.length > 0) {
          query = query.in('company_id', companyIds as any);
        } else {
          query = query.eq('company_id', profile.company_id);
        }
      }

      const { data, error } = await query;

      if (error) {
        setReports([]);
      } else {
        setReports((data as any) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActiveCounts = async () => {
    if (!profile) return;
    try {
      let companyIds: string[] | null = null;
      if (profile.role === 'crm_n1') {
        try {
          const { data } = await supabase
            .from('crm_n1_company_access')
            .select('company_id')
            .eq('user_id', profile.id);
          const extras = (data || []).map((r: any) => r.company_id);
          companyIds = Array.from(new Set([...(profile.company_id ? [profile.company_id] : []), ...extras]));
        } catch {}
      }

      let companiesQuery = supabase
        .from('companies')
        .select('id, is_active');
      if (profile.role !== 'admin') {
        if (profile.role === 'crm_n1' && companyIds && companyIds.length > 0) {
          companiesQuery = companiesQuery.in('id', companyIds as any);
        } else {
          companiesQuery = companiesQuery.eq('id', profile.company_id);
        }
      }
      companiesQuery = companiesQuery.eq('is_active', true);
      const { data: companiesData } = await companiesQuery;
      setActiveCompanies((companiesData as any[])?.length || 0);

      let usersQuery = supabase
        .from('user_profiles')
        .select('id, is_active, company_id');
      if (profile.role !== 'admin') {
        if (profile.role === 'crm_n1' && companyIds && companyIds.length > 0) {
          usersQuery = usersQuery.in('company_id', companyIds as any);
        } else {
          usersQuery = usersQuery.eq('company_id', profile.company_id);
        }
      }
      usersQuery = usersQuery.eq('is_active', true);
      const { data: usersData } = await usersQuery;
      setActiveUsers((usersData as any[])?.length || 0);
    } catch {}
  };

  const loadCompanies = async () => {
    if (!profile) return;
    try {
      if (profile.role === 'admin') {
        const { data } = await supabase
          .from('companies')
          .select('id, name, is_active')
          .eq('is_active', true);
        setCompanies((data as any[]) || []);
      } else if (profile.role === 'crm_n1') {
        let companyIds: string[] = [];
        try {
          const { data } = await supabase
            .from('crm_n1_company_access')
            .select('company_id')
            .eq('user_id', profile.id);
          const extras = (data || []).map((r: any) => r.company_id);
          companyIds = Array.from(new Set([...(profile.company_id ? [profile.company_id] : []), ...extras]));
        } catch {}
        if (companyIds.length > 0) {
          const { data } = await supabase
            .from('companies')
            .select('id, name, is_active')
            .in('id', companyIds as any)
            .eq('is_active', true);
          setCompanies((data as any[]) || []);
        } else {
          setCompanies([]);
        }
      }
    } catch {}
  };

  const loadMyCompanyStatus = async () => {
    if (!profile) return;
    const isCorporate = profile.role === 'corporate_manager' || profile.role === 'approver_manager';
    if (!isCorporate || !profile.company_id) {
      setMyCompanyStatus(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('companies')
        .select('id, is_active')
        .eq('id', profile.company_id)
        .limit(1)
        .maybeSingle();
      const active = (data as any)?.is_active as boolean | undefined;
      setMyCompanyStatus(active ? 'Ativo' : 'Inativo');
    } catch {
      setMyCompanyStatus(null);
    }
  };

  const filteredReports = useMemo(() => {
    let base = reports;
    if (profile?.role === 'admin' && selectedCompanies.length > 0) {
      base = base.filter(r => selectedCompanies.includes(r.company_id));
    }
    if (periodo === 'geral') return base;
    const now = new Date();
    const inicio = new Date(now);
    if (periodo === '1ano') inicio.setFullYear(inicio.getFullYear() - 1);
    if (periodo === '6meses') inicio.setMonth(inicio.getMonth() - 6);
    if (periodo === '3meses') inicio.setMonth(inicio.getMonth() - 3);
    if (periodo === '1mes') inicio.setMonth(inicio.getMonth() - 1);
    return base.filter(r => new Date(r.created_at).getTime() >= inicio.getTime());
  }, [reports, periodo, selectedCompanies, profile]);

  const selectedCompaniesLabel = useMemo(() => {
    if (selectedCompanies.length === 0) return 'Todas as Empresas';
    const names = selectedCompanies
      .map(id => companies.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  }, [selectedCompanies, companies]);

  const getStatusCounts = () => {
    const counts = filteredReports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<ReportStatus, number>);

    return Object.entries(counts).map(([status, count]) => ({
      status: getStatusLabel(status as ReportStatus),
      count,
      statusKey: status,
    }));
  };

  const getRiskCounts = () => {
    const counts = filteredReports.reduce((acc, report) => {
      acc[report.risk_level] = (acc[report.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<RiskLevel, number>);

    return Object.entries(counts).map(([risk, count]) => ({
      risk: getRiskLabel(risk as RiskLevel),
      count,
      riskKey: risk,
    }));
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

  const getRiskLabel = (risk: RiskLevel): string => {
    const labels = {
      low: 'Baixo',
      moderate: 'Moderado',
      high: 'Alto',
      critical: 'Crítico',
    };
    return labels[risk] || risk;
  };

  const getMonthlyData = () => {
    const monthly = filteredReports.reduce((acc, report) => {
      const month = new Date(report.created_at).toLocaleDateString('pt-BR', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthly).map(([month, count]) => ({ month, count }));
  };

  const totalReports = filteredReports.length;
  const highRiskReports = filteredReports.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length;
  const criticalRiskReports = filteredReports.filter(r => r.risk_level === 'critical').length;
  const pendingReports = filteredReports.filter(r => r.status === 'received' || r.status === 'under_analysis').length;
  const approvedReports = filteredReports.filter(r => r.status === 'approved').length;
  const rejectedReports = filteredReports.filter(r => r.status === 'rejected').length;
  const commentedOpenReports = filteredReports.filter(r => {
    const isOpen = r.status !== 'approved' && r.status !== 'rejected';
    const all = ((r as any).comments || []) as any[];
    const count = isUser ? all.filter((c: any) => !c.is_internal).length : (all.length || 0);
    return isOpen && count > 0;
  }).length;

  const getLatestComments = () => {
    const openReports = filteredReports.filter(r => r.status !== 'approved' && r.status !== 'rejected');
    const all = openReports.flatMap((r: any) => (r.comments || []).map((c: any) => ({ ...c, report_id: r.id, report_title: r.title })));
    const publicComments = all.filter((c: any) => !c.is_internal);
    const sorted = publicComments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted.slice(0, 2);
  };

  const calcSlaExceededPercent = () => {
    const now = new Date();
    let overdue = 0;
    let considered = 0;
    filteredReports.forEach((r) => {
      const slaDays = (r.company?.sla_days ?? 0) as number;
      if (slaDays > 0) {
        considered++;
        const created = new Date(r.created_at);
        const deadline = new Date(created);
        deadline.setDate(deadline.getDate() + slaDays);
        if (now.getTime() > deadline.getTime() && r.status !== 'approved') {
          overdue++;
        }
      }
    });
    if (considered === 0) return 0;
    return Math.round((overdue / considered) * 100);
  };

  const calcUserSlaWithinPercent = () => {
    const now = new Date();
    let within = 0;
    let considered = 0;
    filteredReports.forEach((r) => {
      const slaDays = (r.company?.sla_days ?? 0) as number;
      if (slaDays > 0 && r.status !== 'approved' && r.status !== 'rejected') {
        considered++;
        const created = new Date(r.created_at);
        const deadline = new Date(created);
        deadline.setDate(deadline.getDate() + slaDays);
        if (now.getTime() <= deadline.getTime()) {
          within++;
        }
      }
    });
    if (considered === 0) return 0;
    return Math.round((within / considered) * 100);
  };

  const rejectedPercent = totalReports ? Math.round((rejectedReports / totalReports) * 100) : 0;
  const efficiencyPercent = (() => {
    const base = totalReports - rejectedReports;
    if (base <= 0) return 0;
    return Math.round((approvedReports / base) * 100);
  })();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate">Painel Geral de Denúncias</h1>
          <p className="mt-2 sm:mt-1 text-sm text-gray-300">
            {profile?.role === 'user'
              ? 'Visualize indicadores, status e tendências das denúncias registradas por você no nosso sistema.'
              : 'Visualize indicadores, status e tendências das denúncias registradas no sistema.'}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:auto-cols-max sm:grid-flow-col gap-x-6 gap-y-3">
          {profile?.role === 'admin' && (
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm text-gray-300">Empresas</span>
              <div
                className="relative"
                tabIndex={0}
                onBlur={(e) => {
                  const rt = e.relatedTarget as Node | null;
                  if (!rt || !e.currentTarget.contains(rt)) {
                    setCompaniesOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  className="text-sm border border-white/20 rounded-md bg-white/10 text-white px-3 py-2 min-w-[220px] max-w-[260px] text-left focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 hover:bg-white/20 transition-colors"
                  onClick={() => setCompaniesOpen((v) => !v)}
                >
                  {selectedCompaniesLabel}
                </button>
                {companiesOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg p-2 max-h-64 overflow-auto">
                    <label className="flex items-center gap-2 px-2 py-1 cursor-pointer text-gray-200 hover:bg-slate-700 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === 0}
                        onChange={() => setSelectedCompanies([])}
                        className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-sm">Todas as Empresas</span>
                    </label>
                    {companies.map((c) => {
                      const checked = selectedCompanies.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer text-gray-200 hover:bg-slate-700 rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const next = Array.from(new Set([...selectedCompanies, c.id]));
                                setSelectedCompanies(next);
                              } else {
                                setSelectedCompanies(selectedCompanies.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                          />
                          <span className="text-sm">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm text-gray-300">Período</span>
            <select
              className="text-sm border border-white/20 rounded-md bg-white/10 text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 [&>option]:bg-slate-800 [&>option]:text-white hover:bg-white/20 transition-colors"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
            >
              <option value="geral">Geral</option>
              <option value="1ano">1 Ano</option>
              <option value="6meses">6 Meses</option>
              <option value="3meses">3 Meses</option>
              <option value="1mes">1 Mês</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-sky-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
                <FileText className="h-6 w-6 text-sky-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Total de Denúncias
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {totalReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-red-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                {profile?.role === 'user' 
                  ? <MessageSquare className="h-6 w-6 text-sky-400" /> 
                  : <AlertTriangle className="h-6 w-6 text-red-400" />}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {profile?.role === 'user' ? 'Denúncias Comentadas' : 'Alto Risco'}
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {profile?.role === 'user' ? commentedOpenReports : highRiskReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-emerald-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                {profile?.role === 'user' 
                  ? <BadgeCheck className="h-6 w-6 text-emerald-400" /> 
                  : <AlertOctagon className="h-6 w-6 text-rose-500" />}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {profile?.role === 'user' ? '% Denúncias Dentro do SLA' : 'Risco Crítico'}
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {profile?.role === 'user' ? `${calcUserSlaWithinPercent()}%` : criticalRiskReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-amber-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Pendentes
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {pendingReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-emerald-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Concluídas
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {approvedReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

      {profile?.role !== 'user' && (
        <>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-red-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">SLA Excedido</dt>
                  <dd className="text-lg font-bold text-white mt-1">{calcSlaExceededPercent()}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-sky-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-sky-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
                      ? 'Status Minha Empresa'
                      : 'Empresas Ativas'}
                  </dt>
                  <dd className="text-lg font-bold text-white mt-1">
                    {profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
                      ? (myCompanyStatus ?? '—')
                      : activeCompanies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-sky-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
                <Users className="h-6 w-6 text-sky-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Usuários Ativos</dt>
                  <dd className="text-lg font-bold text-white mt-1">{activeUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-gray-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-gray-500/10 rounded-xl group-hover:bg-gray-500/20 transition-colors">
                <AlertTriangle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Rejeitadas</dt>
                  <dd className="text-lg font-bold text-white mt-1">{rejectedPercent}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl shadow-lg transition-all hover:bg-white/10 hover:shadow-emerald-500/10 hover:border-white/20 group">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Eficiência</dt>
                  <dd className="text-lg font-bold text-white mt-1">{efficiencyPercent}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg min-w-0">
          <h3 className="text-lg font-medium text-white mb-6">Denúncias por Status</h3>
          <ChartContainer className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={getStatusCounts()} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                <YAxis type="category" dataKey="status" width={120} stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]}>
                  {getStatusCounts().map((entry, index) => (
                    <Cell key={`hcell-${index}`} fill={STATUS_COLORS[entry.statusKey as ReportStatus]} stroke="rgba(255,255,255,0.1)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg min-w-0 min-h-0">
            <h3 className="text-lg font-medium text-white mb-6">Denúncias por Nível de Risco</h3>
            <ChartContainer className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={getRiskCounts()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="risk" stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [value, 'TT']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                    {getRiskCounts().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskKey as RiskLevel]} stroke="rgba(255,255,255,0.1)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        
      </div>

      {/* Adicionais: linha de tendência mensal */}
      {getMonthlyData().length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg min-w-0 min-h-0">
            <h3 className="text-lg font-medium text-white mb-6">Tendência Mensal (Linha)</h3>
            <ChartContainer className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#cbd5e1'}} axisLine={{stroke: '#475569'}} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      )}

      {isUser && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-medium text-white mb-4">Últimos Comentários</h3>
            <ul className="space-y-3">
              {getLatestComments().length > 0 ? (
                getLatestComments().map((c: any, idx: number) => (
                  <li key={idx} className="border border-white/10 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className="text-xs text-gray-400">Denúncia “{c.report_title || c.report_id}” • {new Date(c.created_at).toLocaleString('pt-BR')}</div>
                    <div className="text-sm text-gray-200 mt-1">{c.content}</div>
                  </li>
                ))
              ) : (
                <div className="text-sm text-gray-500">Sem comentários recentes</div>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
