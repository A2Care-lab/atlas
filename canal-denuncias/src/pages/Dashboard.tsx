import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { normalizeReportCollection } from '../lib/reportCollections';
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
  received: '#006D77',
  under_analysis: '#F59E0B',
  under_investigation: '#EF4444',
  waiting_info: '#8B5CF6',
  corporate_approval: '#10B981',
  approved: '#059669',
  rejected: '#6B7280',
};

const RISK_COLORS = {
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

export function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const isUser = profile ? (profile.role === 'user') : false;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCompanies, setActiveCompanies] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [myCompanyStatus, setMyCompanyStatus] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'geral' | '1ano' | '6meses' | '3meses' | '1mes'>('geral');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [silentSeries, setSilentSeries] = useState<{ month: string; empresa: number; usuario: number }[]>([]);

  useEffect(() => {
    loadReports();
    loadActiveCounts();
    loadCompanies();
    loadMyCompanyStatus();
    loadSilentIntentSeries();
  }, [profile]);

  useEffect(() => {
    loadSilentIntentSeries();
  }, [selectedCompanies, periodo]);

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
          const extras = (data || []).map((r:any)=>r.company_id);
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
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      // Filtrar por empresa e permissões
      if (isUser) {
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
        setReports(normalizeReportCollection((data as any) || []));
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
          const extras = (data || []).map((r:any)=>r.company_id);
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
          const extras = (data || []).map((r:any)=>r.company_id);
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

  const loadSilentIntentSeries = async () => {
    if (!profile) return;
    try {
      const now = new Date();
      const inicio = new Date(now);
      if (periodo === '1ano') inicio.setFullYear(inicio.getFullYear() - 1);
      if (periodo === '6meses') inicio.setMonth(inicio.getMonth() - 6);
      if (periodo === '3meses') inicio.setMonth(inicio.getMonth() - 3);
      if (periodo === '1mes') inicio.setMonth(inicio.getMonth() - 1);

      const monthStartIso = new Date(inicio.getFullYear(), inicio.getMonth(), 1).toISOString();

      let companyFilter: string[] | null = null;
      if (profile.role === 'admin') {
        companyFilter = selectedCompanies.length > 0 ? selectedCompanies : null;
      } else if (profile.role === 'crm_n1') {
        try {
          const { data } = await supabase
            .from('crm_n1_company_access')
            .select('company_id')
            .eq('user_id', profile.id);
          const extras = (data || []).map((r: any) => r.company_id);
          companyFilter = Array.from(new Set([...(profile.company_id ? [profile.company_id] : []), ...extras]));
        } catch {
          companyFilter = profile.company_id ? [profile.company_id] : [];
        }
      } else {
        companyFilter = profile.company_id ? [profile.company_id] : [];
      }

      let q = supabase
        .from('monthly_silent_intent_stats')
        .select('month_start, company_id, generated_by_user_id, clicked, not_submitted, percent')
        .order('month_start', { ascending: true });
      if (periodo !== 'geral') {
        q = q.gte('month_start', monthStartIso);
      }

      if (companyFilter && companyFilter.length > 0) {
        q = q.in('company_id', companyFilter as any);
      }

      const { data, error } = await q;
      if (error) {
        setSilentSeries([]);
        return;
      }
      const rows = (data as any[]) || [];

      // Agrega por mês: empresa = agregado por companyFilter; usuário = somente profile.id
      const byMonth: Record<string, { empresaClicked: number; empresaNot: number; userClicked: number; userNot: number }> = {};
      for (const r of rows) {
        const m = new Date(r.month_start).toLocaleDateString('pt-BR', { month: 'short' });
        if (!byMonth[m]) byMonth[m] = { empresaClicked: 0, empresaNot: 0, userClicked: 0, userNot: 0 };
        // Empresa: soma de todas as empresas consideradas
        byMonth[m].empresaClicked += Number(r.clicked || 0);
        byMonth[m].empresaNot += Number(r.not_submitted || 0);
        // Usuário: apenas linhas do usuário gerador atual
        if (r.generated_by_user_id && r.generated_by_user_id === profile.id) {
          byMonth[m].userClicked += Number(r.clicked || 0);
          byMonth[m].userNot += Number(r.not_submitted || 0);
        }
      }

      const series = Object.keys(byMonth).map((m) => {
        const v = byMonth[m];
        const emp = v.empresaClicked > 0 ? Math.round((v.empresaNot * 10000) / v.empresaClicked) / 100 : 0;
        const usr = v.userClicked > 0 ? Math.round((v.userNot * 10000) / v.userClicked) / 100 : 0;
        return { month: m, empresa: emp, usuario: usr };
      });
      // Ordena por calendário aproximado usando índice do mês em pt-BR; fallback por ordem de iteração
      const order = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      series.sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
      setSilentSeries(series);
    } catch {
      setSilentSeries([]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight truncate">Painel Geral de Denúncias</h1>
          <p className="mt-2 sm:mt-1 text-sm sm:text-sm text-gray-600 leading-relaxed">
            {isUser
              ? 'Visualize indicadores, status e tendências das denúncias registradas por você no nosso sistema.'
              : 'Visualize indicadores, status e tendências das denúncias registradas no sistema.'}
          </p>
          {profile?.role === 'admin' && (
            <div className="hidden">
              <span className="text-sm text-gray-600 block mb-1">Empresas</span>
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
                  className="text-sm border border-gray-300 rounded-md bg-white px-3 py-2 w-full text-left focus:outline-none focus:ring-1 focus:ring-petroleo-600 focus:border-petroleo-600"
                  onClick={() => setCompaniesOpen((v) => !v)}
                >
                  {selectedCompaniesLabel}
                </button>
                {companiesOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-64 overflow-auto">
                    <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === 0}
                        onChange={() => setSelectedCompanies([])}
                      />
                      <span className="text-sm">Todas as Empresas</span>
                    </label>
                    {companies.map((c) => {
                      const checked = selectedCompanies.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer">
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
        </div>
        <div className="grid grid-cols-2 lg:auto-cols-max lg:grid-flow-col gap-x-6 gap-y-3 w-full lg:w-auto">
          {profile?.role === 'admin' && (
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2 w-full lg:w-auto lg:mt-0 mt-1">
              <span className="text-sm text-gray-600 block sm:inline">Empresas</span>
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
                  className="text-sm border border-gray-300 rounded-md bg-white px-3 py-2 w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] text-left focus:outline-none focus:ring-1 focus:ring-petroleo-600 focus:border-petroleo-600"
                  onClick={() => setCompaniesOpen((v) => !v)}
                >
                  {selectedCompaniesLabel}
                </button>
                {companiesOpen && (
                  <div className="absolute left-0 right-0 lg:left-auto lg:right-0 z-10 mt-2 w-full lg:w-64 bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-64 overflow-auto">
                    <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === 0}
                        onChange={() => setSelectedCompanies([])}
                      />
                      <span className="text-sm">Todas as Empresas</span>
                    </label>
                    {companies.map((c) => {
                      const checked = selectedCompanies.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer">
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
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto sm:mt-0 mt-1">
            <span className="text-sm text-gray-600">Período</span>
            <select
              className="text-sm border border-gray-300 rounded-md bg-white px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-petroleo-600 focus:border-petroleo-600"
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
      {!isUser && (
        <>
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-petroleo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Denúncias
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {isUser 
                  ? <MessageSquare className="h-6 w-6 text-petroleo-600" /> 
                  : <AlertTriangle className="h-6 w-6 text-red-600" />}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isUser ? 'Denúncias Comentadas' : 'Alto Risco'}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {isUser ? commentedOpenReports : highRiskReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {isUser 
                  ? <BadgeCheck className="h-6 w-6 text-green-600" /> 
                  : <AlertOctagon className="h-6 w-6 text-red-700" />}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isUser ? '% Denúncias Dentro do SLA' : 'Risco Crítico'}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {isUser ? `${calcUserSlaWithinPercent()}%` : criticalRiskReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendentes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Concluídas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {approvedReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">SLA Excedido</dt>
                  <dd className="text-lg font-medium text-gray-900">{calcSlaExceededPercent()}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-petroleo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
                      ? 'Status Minha Empresa'
                      : 'Empresas Ativas'}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {profile?.role === 'corporate_manager' || profile?.role === 'approver_manager'
                      ? (myCompanyStatus ?? '—')
                      : activeCompanies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-petroleo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejeitadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{rejectedPercent}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Eficiência</dt>
                  <dd className="text-lg font-medium text-gray-900">{efficiencyPercent}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5 min-w-0 min-h-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Denúncias por Status</h3>
          <ChartContainer className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={getStatusCounts()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  nameKey="status"
                  label={({ name, value, percent }: any) => `${name}: ${value} (${Math.round(percent * 100)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {getStatusCounts().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey as ReportStatus]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, _name: any, props: any) => [value, props?.payload?.status || 'TT']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5 min-w-0 min-h-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Denúncias por Nível de Risco</h3>
            <ChartContainer className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={getRiskCounts()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'TT']} />
                  <Bar dataKey="count" fill="#006D77">
                    {getRiskCounts().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskKey as RiskLevel]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        
      </div>

      {/* Gráficos adicionais: barras horizontais por Status, tendência mensal e intenção silenciosa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5 min-w-0 min-h-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status (Horizontal)</h3>
          <ChartContainer className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={getStatusCounts()} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="status" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#334155">
                  {getStatusCounts().map((entry, index) => (
                    <Cell key={`hcell-${index}`} fill={STATUS_COLORS[entry.statusKey as ReportStatus]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5 min-w-0 min-h-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tendência Mensal (Linha)</h3>
          <ChartContainer className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {getMonthlyData().length > 0 ? (
                <LineChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Sem dados</div>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5 min-w-0 min-h-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Índice de Intenção Silenciosa (Linha)</h3>
          <ChartContainer className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {silentSeries.length > 0 ? (
                <LineChart data={silentSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(v)=>`${v}%`} />
                  <Tooltip formatter={(value:any)=>[`${value}%`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="empresa" name="Empresa" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="usuario" name="Usuário" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Sem dados para o período</div>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {isUser && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-6 rounded-2xl shadow-lg ring-1 ring-black/5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Últimos Comentários</h3>
            <ul className="space-y-3">
              {getLatestComments().length > 0 ? (
                getLatestComments().map((c: any, idx: number) => (
                  <li key={idx} className="border border-gray-200 rounded-xl p-3">
                    <div className="text-xs text-gray-600">Denúncia “{c.report_title || c.report_id}” • {new Date(c.created_at).toLocaleString('pt-BR')}</div>
                    <div className="text-sm text-gray-900 mt-1">{c.content}</div>
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
