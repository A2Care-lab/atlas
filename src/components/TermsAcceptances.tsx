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
        <button onClick={load} className="inline-flex items-center gap-2 bg-petroleo-600 text-white px-4 py-2 rounded-md">
          <RefreshCw className="h-4 w-4"/> Atualizar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M6 8h12M9 12h6M12 16h0"/></svg>
            Filtros
          </h3>
          <ClearFiltersButton onClick={()=>setFilters({ name:'', email:'', start:'', end:'' })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input value={filters.name} onChange={(e)=>setFilters({...filters, name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input value={filters.email} onChange={(e)=>setFilters({...filters, email:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Início</label>
            <input type="date" value={filters.start||''} onChange={(e)=>setFilters({...filters, start:e.target.value||undefined})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fim</label>
            <input type="date" value={filters.end||''} onChange={(e)=>setFilters({...filters, end:e.target.value||undefined})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{filtered.length} registro(s)</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Itens por página</span>
          <select
            value={pageSize}
            onChange={(e)=>{ setPageSize(Number(e.target.value)); setCurrentPage(1) }}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nome</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">E-mail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Empresa</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aceite</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Privacidade</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Termos de Uso</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Não Retaliação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{r.full_name || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.email}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.company_name || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.accepted_at ? new Date(r.accepted_at).toLocaleString('pt-BR') : '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.privacy_version || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.terms_version || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.non_retaliation_version || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={7}>{loading?'Carregando...':'Nenhum aceite encontrado'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Mostrando {startIndex + 1}-{Math.min(endIndex, filtered.length)} de {filtered.length}</p>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={()=>setCurrentPage(p=>Math.max(1, p-1))}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">Página {page} de {totalPages}</span>
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
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
