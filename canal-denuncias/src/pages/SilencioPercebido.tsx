import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MonthlySilentIntentStat, Company } from '../types/database';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  LineChart,
  Line
} from 'recharts';
import { Loader2, TrendingUp, Building2, AlertCircle, Info, MousePointerClick, FileX } from 'lucide-react';

interface EnhancedStat extends MonthlySilentIntentStat {
  company_name: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const acessos = payload.find((p: any) => p.name === "Acessos Totais" || p.name === "Acessos")?.value || 0;
    const naoSubmetidos = payload.find((p: any) => p.name === "Não Submetidos (Silêncio)" || p.name === "Silêncio")?.value || 0;
    const silencioPercent = acessos > 0 ? ((naoSubmetidos / acessos) * 100).toFixed(1) : 0;
    const conversaoPercent = acessos > 0 ? (100 - Number(silencioPercent)).toFixed(1) : 0;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-blue-600">
            Acessos Totais: <span className="font-bold">{acessos}</span>
          </p>
          <p className="text-sm text-red-600">
            Silêncio: <span className="font-bold">{naoSubmetidos}</span>
          </p>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              Índice de Silêncio: <span className="text-red-600 font-bold">{silencioPercent}%</span>
            </p>
            <p className="text-sm font-medium text-gray-600">
              Conversão em Denúncia: <span className="text-green-600 font-bold">{conversaoPercent}%</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function SilencioPercebido() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnhancedStat[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [funnelMonthly, setFunnelMonthly] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .from('monthly_silent_intent_stats')
        .select('*');

      if (statsError) throw statsError;

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name');

      if (companiesError) throw companiesError;

      // Process and enrich data
      const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]));

      const enrichedStats: EnhancedStat[] = (statsData || []).map(stat => ({
        ...stat,
        company_name: companiesMap.get(stat.company_id) || 'Desconhecida'
      }));

      setStats(enrichedStats);
      processChartData(enrichedStats);
      await loadMonthlyFunnel();

    } catch (error) {
      console.error('Error fetching silent intent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyFunnel = async () => {
    try {
      let eventsQuery = supabase
        .from('report_funnel_events')
        .select('created_at, event_type, link_token, company_id');
      if (profile && profile.role !== 'admin' && profile.company_id) {
        eventsQuery = eventsQuery.eq('company_id', profile.company_id);
      }
      const { data: events } = await eventsQuery;

      let reportsQuery = supabase
        .from('reports')
        .select('created_at, company_id, token');
      if (profile && profile.role !== 'admin' && profile.company_id) {
        reportsQuery = reportsQuery.eq('company_id', profile.company_id);
      }
      const { data: reportsData } = await reportsQuery;
      const monthKey = (y: number, m: number) => {
        const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        return { label: `${names[m]}. ${y}`, sort: new Date(Date.UTC(y, m, 1, 12)).getTime() };
      };

      // Coorte por mês de geração: por token, pegamos o mês do primeiro link_generated
      const genByToken = new Map<string, { y: number; m: number }>();
      const clickedSet = new Set<string>();
      const submittedSet = new Set<string>();

      (events || []).forEach((e: any) => {
        if (e.event_type === 'link_generated') {
          const dt = new Date(e.created_at);
          const y = dt.getUTCFullYear();
          const m = dt.getUTCMonth();
          const prev = genByToken.get(e.link_token);
          if (!prev || new Date(Date.UTC(y,m,1)).getTime() < new Date(Date.UTC(prev.y, prev.m,1)).getTime()) {
            genByToken.set(e.link_token, { y, m });
          }
        } else if (e.event_type === 'link_clicked') {
          clickedSet.add(e.link_token);
        }
      });

      (reportsData || []).forEach((r: any) => {
        if (r.token) submittedSet.add(r.token);
      });

      const map = new Map<string, { name: string; sort: number; generated: number; clicked: number; submitted: number }>();
      for (const [token, ym] of genByToken.entries()) {
        const k = monthKey(ym.y, ym.m);
        if (!map.has(k.label)) map.set(k.label, { name: k.label, sort: k.sort, generated: 0, clicked: 0, submitted: 0 });
        const row = map.get(k.label)!;
        row.generated += 1;
        if (clickedSet.has(token)) row.clicked += 1;
        if (submittedSet.has(token)) row.submitted += 1;
      }

      const series = Array.from(map.values()).sort((a,b)=>a.sort-b.sort);
      setFunnelMonthly(series);
    } catch {
      setFunnelMonthly([]);
    }
  };

  const processChartData = (data: EnhancedStat[]) => {
    // 1. Time Series Data
    const timeMap = new Map();
    data.forEach(stat => {
      let dateLabel = 'Data Inválida';
      let dateObj = new Date();

      if (stat.month_start) {
        // Parse manual para evitar problemas de timezone com YYYY-MM-DD
        const parts = stat.month_start.split('-');
        if (parts.length === 3) {
          // Cria data meio-dia UTC para evitar problemas de timezone
          dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));
          
          const monthNames = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
          ];
          
          const monthIndex = parseInt(parts[1]) - 1;
          const year = parts[0];
          
          if (monthIndex >= 0 && monthIndex < 12) {
            dateLabel = `${monthNames[monthIndex]}. ${year}`;
          }
        }
      }

      if (!timeMap.has(dateLabel)) {
        timeMap.set(dateLabel, { 
          name: dateLabel, 
          acessos: 0, 
          nao_submetidos: 0, 
          dateObj: dateObj // for sorting
        });
      }
      const entry = timeMap.get(dateLabel);
      entry.acessos += stat.clicked;
      entry.nao_submetidos += stat.not_submitted;
    });
    
    const sortedTimeData = Array.from(timeMap.values())
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map((d: any) => {
        const conv = d.acessos > 0 ? ((d.acessos - d.nao_submetidos) / d.acessos) * 100 : 0;
        return { ...d, conversion: Math.round(conv * 10) / 10 };
      });
    setTimeData(sortedTimeData);

    // 2. Company Data
    const companyMap = new Map();
    data.forEach(stat => {
      if (!companyMap.has(stat.company_name)) {
        companyMap.set(stat.company_name, { name: stat.company_name, acessos: 0, nao_submetidos: 0 });
      }
      const entry = companyMap.get(stat.company_name);
      entry.acessos += stat.clicked;
      entry.nao_submetidos += stat.not_submitted;
    });
    setCompanyData(Array.from(companyMap.values()));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-petroleo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Índice de Intenção Silenciosa</h1>
          <p className="mt-1 text-sm text-gray-200">
            Intenção sem formalização: um sinal importante
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Atualizar
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-petroleo-300" />
          <h2 className="text-lg font-semibold text-white">Entenda os Indicadores</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
              <MousePointerClick className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Acessos Totais</h3>
              <p className="text-sm text-gray-300 mt-1">
                Contabiliza todas as vezes que o formulário de denúncia foi acessado através de um link gerado.
                Representa o interesse inicial ou a intenção de fazer um relato.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg mt-1">
              <FileX className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Silêncio (Não Submetido)</h3>
              <p className="text-sm text-gray-300 mt-1">
                Representa os acessos que <strong>não resultaram em uma denúncia formalizada</strong>. 
                Um alto índice de silêncio pode indicar barreiras como medo de retaliação, complexidade do formulário ou insegurança no processo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum dado encontrado</h3>
          <p className="mt-2 text-gray-500">Ainda não há registros de intenção silenciosa no período.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Evolução Temporal */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Evolução Temporal</h2>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNaoSubmetidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="name" tick={{ fill: '#E5E7EB' }} />
                  <YAxis tick={{ fill: '#E5E7EB' }} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend wrapperStyle={{ color: '#E5E7EB' }} />
                  <Area 
                    type="monotone" 
                    dataKey="acessos" 
                    name="Acessos Totais" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorAcessos)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="nao_submetidos" 
                    name="Não Submetidos (Silêncio)" 
                    stroke="#EF4444" 
                    fillOpacity={1} 
                    fill="url(#colorNaoSubmetidos)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendência de Conversão */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Tendência de Conversão</h2>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="name" tick={{ fill: '#E5E7EB' }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v:any)=>`${v}%`} tick={{ fill: '#E5E7EB' }} />
                  <Tooltip formatter={(v:any)=>[`${v}%`, 'Conversão']} cursor={false} />
                  <Line type="monotone" dataKey="conversion" name="Conversão" stroke="#10B981" strokeWidth={3} dot={{ r: 3, stroke: '#10B981', fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funil Mensal */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Funil Mensal</h2>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelMonthly} margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap={20} barGap={-18}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="name" tick={{ fill: '#E5E7EB' }} />
                  <YAxis tick={{ fill: '#E5E7EB' }} />
                  <Legend wrapperStyle={{ color: '#E5E7EB' }} />
                  <Tooltip cursor={false} />
                  <Bar dataKey="generated" name="Links Criados" fill="#8B5CF6" stroke="#8B5CF6" opacity={0.35} radius={[4,4,0,0]} />
                  <Bar dataKey="clicked" name="Links Clicados" fill="#3B82F6" stroke="#3B82F6" opacity={0.6} radius={[4,4,0,0]} />
                  <Bar dataKey="submitted" name="Denúncias Concluídas" fill="#10B981" stroke="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Por Empresa (somente admin) */}
            {profile?.role === 'admin' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white flex-1">Por Empresa</h2>
                <select
                  value={companyFilter || ''}
                  onChange={(e) => setCompanyFilter(e.target.value || null)}
                  className="text-sm px-3 py-2 rounded-md bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="text-gray-900">Todas</option>
                  {companyData.map((c: any) => (
                    <option key={c.name} value={c.name} className="text-gray-900">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(companyFilter ? companyData.filter((d:any)=>d.name===companyFilter) : companyData)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.15)" />
                    <XAxis type="number" tick={{ fill: '#E5E7EB' }} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#E5E7EB' }} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Legend wrapperStyle={{ color: '#E5E7EB' }} />
                    <Bar dataKey="acessos" name="Acessos Totais" fill="#3B82F6" stroke="#3B82F6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="nao_submetidos" name="Não Submetidos (Silêncio)" fill="#EF4444" stroke="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
