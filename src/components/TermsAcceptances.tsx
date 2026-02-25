import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw } from 'lucide-react'
import { ClearFiltersButton } from './ClearFiltersButton'

interface Acceptance {
  id: string
  user_id: string
  full_name: string
  email: string
  accepted_at: string
  privacy_version?: string
  terms_version?: string
  non_retaliation_version?: string
  company_name?: string
}

interface Filters {
  name: string
  email: string
  start?: string
  end?: string
}

export default function TermsAcceptances() {
  const [rows, setRows] = useState<Acceptance[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>({ name: '', email: '' })
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('terms_acceptances')
        .select('id, user_id, full_name, email, accepted_at, privacy_version, terms_version, non_retaliation_version, company_name')
        .order('accepted_at', { ascending: false })

      if (filters.email) query = query.ilike('email', `%${filters.email}%`)
      if (filters.name) query = query.ilike('full_name', `%${filters.name}%`)
      if (filters.start) query = query.gte('accepted_at', filters.start)
      if (filters.end) query = query.lte('accepted_at', filters.end + ' 23:59:59')

      const { data, error } = await query
      if (error) throw error
      setRows((data as any) || [])
    } catch (e) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => rows, [rows])

  useEffect(() => { setCurrentPage(1) }, [filters, rows])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedRows = filtered.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={load} className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm text-sm font-medium">
          <RefreshCw className="h-4 w-4"/> Atualizar
        </button>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M6 8h12M9 12h6M12 16h0"/></svg>
            Filtros
          </h3>
          <ClearFiltersButton onClick={()=>setFilters({ name:'', email:'', start:'', end:'' })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">Nome</label>
            <input value={filters.name} onChange={(e)=>setFilters({...filters, name:e.target.value})} className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-500" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">E-mail</label>
            <input value={filters.email} onChange={(e)=>setFilters({...filters, email:e.target.value})} className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Início</label>
            <input type="date" value={filters.start||''} onChange={(e)=>setFilters({...filters, start:e.target.value||undefined})} className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Fim</label>
            <input type="date" value={filters.end||''} onChange={(e)=>setFilters({...filters, end:e.target.value||undefined})} className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [color-scheme:dark]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{filtered.length} registro(s)</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Itens por página</span>
          <select
            value={pageSize}
            onChange={(e)=>{ setPageSize(Number(e.target.value)); setCurrentPage(1) }}
            className="px-2 py-1 border border-white/10 bg-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 [&>option]:bg-slate-800"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl shadow-lg">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">E-mail</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aceite</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Privacidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Termos de Uso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Não Retaliação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedRows.map(r => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-200">{r.full_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-200">{r.email}</td>
                <td className="px-4 py-3 text-sm text-gray-200">{r.company_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.accepted_at ? new Date(r.accepted_at).toLocaleString('pt-BR') : '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.privacy_version || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.terms_version || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.non_retaliation_version || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={7}>{loading?'Carregando...':'Nenhum aceite encontrado'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400">Mostrando {startIndex + 1}-{Math.min(endIndex, filtered.length)} de {filtered.length}</p>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded-md border border-white/10 text-sm text-gray-300 disabled:opacity-50 hover:bg-white/5 transition-colors"
              disabled={page <= 1}
              onClick={()=>setCurrentPage(p=>Math.max(1, p-1))}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300">Página {page} de {totalPages}</span>
            <button
              className="px-3 py-1 rounded-md border border-white/10 text-sm text-gray-300 disabled:opacity-50 hover:bg-white/5 transition-colors"
              disabled={page >= totalPages}
              onClick={()=>setCurrentPage(p=>Math.min(totalPages, p+1))}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
