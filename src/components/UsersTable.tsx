import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase'
import { Company, UserProfile, UserRole, Invitation } from '../types/database'
import { getUserRoleLabel } from '../utils/labels'
import { Plus, Ban, Trash2, RefreshCw, Pencil, Mail } from 'lucide-react'
import { ClearFiltersButton } from './ClearFiltersButton'
import { useAuth } from '../hooks/useAuth'
import { useCorporateAreas } from '../hooks/useCorporateAreas'
import MessageModal from './MessageModal'

interface Filters {
  name: string
  email: string
  start?: string
  end?: string
  companyId?: string
  status?: 'Todos' | 'Ativo' | 'Inativo' | 'Pendente'
}

export default function UsersTable() {
  const { profile, resetPassword } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>({ name: '', email: '', status: 'Todos' })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)
  const [editInvite, setEditInvite] = useState<Invitation | null>(null)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgTitle, setMsgTitle] = useState<string>('')
  const [msgText, setMsgText] = useState<string>('')
  const [msgVariant, setMsgVariant] = useState<'success'|'error'|'info'>('info')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const canAdmin = profile?.role === 'admin'

  useEffect(() => {
    load()
    loadCompanies()
    loadInvites()
  }, [profile])

  const load = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('user_profiles')
        .select('id, email, full_name, role, company_id, department, phone, is_active, created_at')
        .order('created_at', { ascending: false })

      if (profile && profile.role !== 'admin') {
        query = query.eq('company_id', profile.company_id)
      }

      // Apply filters server-side where possible
      if (filters.email) query = query.ilike('email', `%${filters.email}%`)
      if (filters.name) query = query.ilike('full_name', `%${filters.name}%`)
      if (filters.companyId) query = query.eq('company_id', filters.companyId)
      if (filters.start) query = query.gte('created_at', filters.start)
      if (filters.end) query = query.lte('created_at', filters.end + ' 23:59:59')

      const { data, error } = await query
      if (error) throw error
      setUsers((data as any) || [])
    } catch (e) {
      console.error('load users error', e)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      if (!profile) return
      let query = supabase.from('companies').select('id, name').order('name')
      if (profile.role !== 'admin') query = query.eq('id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setCompanies((data as any) || [])
    } catch (e) {
      console.error(e)
      setCompanies([])
    }
  }

  const loadInvites = async () => {
    try {
      if (!profile) return
      let query = supabase
        .from('invitations')
        .select('id, email, role, company_id, full_name, created_at, accepted_at, last_invite_at')
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
      if (profile.role !== 'admin') query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setInvites((data as any) || [])
    } catch (e) {
      console.error(e)
      setInvites([])
    }
  }

  const toggleActive = async (user: UserProfile) => {
    if (!canAdmin) return
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    if (!error) load()
  }

  const removeUser = async (user: UserProfile) => {
    if (!canAdmin) return
    try {
      const { error: fnErr } = await supabase.functions.invoke('delete-auth-user', {
        body: { uid: user.id }
      })
      if (fnErr) {
        const ctx = (fnErr as any)?.context || {}
        const status = (ctx as any)?.response?.status || (ctx as any)?.status || ''
        if (status === 401) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) throw new Error('Sem sessão válida (401). Faça login novamente.')
          const res = await fetch(`${supabaseUrl}/functions/v1/delete-auth-user`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id })
          })
          if (!res.ok) {
            const txt = await res.text()
            throw new Error(`Falha (HTTP ${res.status}) ${txt}`)
          }
        } else {
          const details = ctx ? `: ${JSON.stringify(ctx)}` : ''
          throw new Error(fnErr.message + details)
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)
      if (error) throw error
      setMsgTitle('Usuário excluído')
      setMsgText('Usuário removido do Auth e do cadastro.')
      setMsgVariant('success')
      setMsgOpen(true)
      await load()
    } catch (e: any) {
      setMsgTitle('Erro ao excluir usuário')
      setMsgText(e?.message || 'Falha ao excluir no Auth')
      setMsgVariant('error')
      setMsgOpen(true)
    }
  }

  const sendReset = async (email: string) => {
    try {
      const { error } = await resetPassword(email)
      if (!error) {
        setMsgTitle('E-mail de recuperação enviado')
        setMsgText('Verifique sua caixa de entrada para redefinir a senha.')
        setMsgVariant('success')
        setMsgOpen(true)
      } else {
        setMsgTitle('Erro ao enviar e-mail')
        setMsgText(error?.message || 'Falha ao solicitar recuperação de senha')
        setMsgVariant('error')
        setMsgOpen(true)
      }
    } catch (e: any) {
      setMsgTitle('Erro ao enviar e-mail')
      setMsgText(e?.message || 'Falha ao solicitar recuperação de senha')
      setMsgVariant('error')
      setMsgOpen(true)
    }
  }

  const createInvite = async (email: string, role: UserRole, companyId?: string, fullName?: string) => {
    try {
      const company = companies.find(c => c.id === (companyId || profile?.company_id))
      const expires = new Date(); expires.setDate(expires.getDate() + 7)
      const token = crypto.randomUUID()
      const { error: dbErr } = await supabase
        .from('invitations')
        .insert({ email, role, company_id: company?.id || profile?.company_id, full_name: fullName || null, invited_by: profile?.id!, token, expires_at: expires.toISOString(), last_invite_at: new Date().toISOString() })
      if (dbErr) throw dbErr

      const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-user-invite', {
        body: {
          email,
          nome: fullName || '',
          empresa: company?.name || '',
          perfil: role,
          redirect_to: `${window.location.origin}/#/onboarding`,
        }
      })
      if (fnErr) {
        const details = (fnErr as any)?.context ? `: ${JSON.stringify((fnErr as any).context)}` : ''
        throw new Error(fnErr.message + details)
      }

      setInviteOpen(false)
      setMsgTitle('Convite criado')
      setMsgText(fnData && (fnData as any).fallback_link ? `Mailer do Supabase falhou; link gerado:\n${(fnData as any).fallback_link}` : 'Convite criado e e-mail enviado.')
      setMsgVariant('success')
      setMsgOpen(true)
    } catch (e: any) {
      setMsgTitle('Erro ao criar convite')
      setMsgText(e?.message || 'Falha ao enviar convite')
      setMsgVariant('error')
      setMsgOpen(true)
    }
  }

  const resendInvite = async (invite: Invitation) => {
    try {
      const company = companies.find(c => c.id === invite.company_id || profile?.company_id)
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-user-invite', {
        body: {
          email: invite.email,
          nome: invite.full_name || '',
          empresa: company?.name || '',
          perfil: invite.role,
          redirect_to: `${window.location.origin}/#/onboarding`,
        }
      })
      if (fnErr) {
        const details = (fnErr as any)?.context ? `: ${JSON.stringify((fnErr as any).context)}` : ''
        throw new Error(fnErr.message + details)
      }
      await supabase
        .from('invitations')
        .update({ last_invite_at: new Date().toISOString() })
        .eq('id', invite.id)
      await loadInvites()
      setMsgTitle('Convite reenviado')
      setMsgText(fnData && (fnData as any).fallback_link ? `Mailer do Supabase falhou; link gerado:\n${(fnData as any).fallback_link}` : 'E-mail de convite reenviado com sucesso.')
      setMsgVariant('success')
      setMsgOpen(true)
    } catch (e: any) {
      setMsgTitle('Erro ao reenviar convite')
      setMsgText(e?.message || 'Falha ao reenviar convite')
      setMsgVariant('error')
      setMsgOpen(true)
    }
  }

  const filteredUsers = useMemo(() => users, [users])
  const combinedRows = useMemo(() => {
    const userRows = users.map(u => ({
      kind: 'user' as const,
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      company_id: u.company_id,
      created_at: u.created_at,
      status: u.is_active ? 'Ativo' : 'Inativo',
      is_active: u.is_active,
    }))
    const inviteRows = invites.map(i => ({
      kind: 'invite' as const,
      id: i.id,
      full_name: (i as any).full_name || undefined,
      email: i.email,
      role: i.role,
      company_id: i.company_id,
      created_at: i.created_at,
      last_invite_at: (i as any).last_invite_at,
      status: 'Pendente',
      is_active: false,
    }))
    return [...inviteRows, ...userRows]
      .filter(row => {
        const nameMatch = !filters.name || (row.full_name || '').toLowerCase().includes(filters.name.toLowerCase())
        const emailMatch = !filters.email || row.email.toLowerCase().includes(filters.email.toLowerCase())
        const companyMatch = !filters.companyId || row.company_id === filters.companyId
        const startMatch = !filters.start || new Date(row.created_at) >= new Date(filters.start)
        const endMatch = !filters.end || new Date(row.created_at) <= new Date(filters.end + 'T23:59:59')
        const statusMatch = !filters.status || filters.status === 'Todos' || row.status === filters.status
        return nameMatch && emailMatch && companyMatch && startMatch && endMatch && statusMatch
      })
      .sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [users, invites, companies, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, users, invites])

  const totalPages = Math.max(1, Math.ceil(combinedRows.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedRows = combinedRows.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={load} className="inline-flex items-center gap-2 bg-petroleo-600 text-white px-4 py-2 rounded-md">
          <RefreshCw className="h-4 w-4"/> Atualizar
        </button>
        {canAdmin && (
          <button onClick={()=>setInviteOpen(true)} className="ml-2 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md">
            <Plus className="h-4 w-4"/> Cadastrar Usuário
          </button>
        )}
        {canAdmin && (
          <button onClick={()=>setBulkOpen(true)} className="ml-2 inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md">
            <Plus className="h-4 w-4"/> Cadastrar Usuários em Lote
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M6 8h12M9 12h6M12 16h0"/></svg>
            Filtros
          </h3>
          <ClearFiltersButton onClick={()=>setFilters({ name:'', email:'', status:'Todos', start:'', end:'', companyId:'' })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input value={filters.name} onChange={(e)=>setFilters({...filters, name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
          </div>
          <div className="lg:col-span-2">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
            <select value={filters.companyId||''} onChange={(e)=>setFilters({...filters, companyId:e.target.value||undefined})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500">
              <option value="">Todas</option>
              {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={filters.status||'Todos'} onChange={(e)=>setFilters({...filters, status:e.target.value as Filters['status']})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500">
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{combinedRows.length} registro(s)</p>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Perfil</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Empresa</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cadastro</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Invite</th>
              {canAdmin && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRows.map(row => (
              <tr key={`${row.kind}-${row.id}`}>
                <td className="px-4 py-2 text-sm text-gray-900">{row.full_name || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.email}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{getUserRoleLabel(row.role)}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{companies.find(c=>c.id===row.company_id)?.name || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.status}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{(row as any).last_invite_at ? new Date((row as any).last_invite_at).toLocaleString('pt-BR') : (row.kind==='invite' ? new Date(row.created_at).toLocaleString('pt-BR') : '—')}</td>
                {canAdmin && (
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <div className="flex gap-2">
                      {row.kind === 'user' && (
                        <>
                          <button
                            onClick={()=>setEditUser(users.find(u=>u.id===row.id)!)}
                            className="inline-flex items-center justify-center p-2 rounded bg-blue-600 text-white"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4"/>
                          </button>
                          <button
                            onClick={()=>toggleActive(users.find(u=>u.id===row.id)!)}
                            className="inline-flex items-center justify-center p-2 rounded bg-yellow-600 text-white"
                            title={row.is_active ? 'Bloquear' : 'Desbloquear'}
                            aria-label={row.is_active ? 'Bloquear' : 'Desbloquear'}
                          >
                            <Ban className="h-4 w-4"/>
                          </button>
                          <button
                            onClick={()=>removeUser(users.find(u=>u.id===row.id)!)}
                            className="inline-flex items-center justify-center p-2 rounded bg-red-600 text-white"
                            title="Excluir"
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                          <button
                            onClick={()=>sendReset(row.email)}
                            className="inline-flex items-center justify-center p-2 rounded bg-petroleo-600 text-white"
                            title="Redefinir Senha"
                            aria-label="Redefinir Senha"
                          >
                            <RefreshCw className="h-4 w-4"/>
                          </button>
                          <button
                            disabled
                            className="inline-flex items-center justify-center p-2 rounded bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reenviar Convite (habilitado apenas para Pendente)"
                            aria-label="Reenviar Convite"
                          >
                            <ResendEmailIcon className="h-4 w-4"/>
                          </button>
                        </>
                      )}
                      {row.kind === 'invite' && (
                        <>
                          <button
                            onClick={()=>setEditInvite(invites.find(i=>i.id===row.id)!)}
                            className="inline-flex items-center justify-center p-2 rounded bg-blue-600 text-white"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4"/>
                          </button>
                          <button
                            onClick={async()=>{ await supabase.from('invitations').delete().eq('id', row.id); loadInvites(); }}
                            className="inline-flex items-center justify-center p-2 rounded bg-red-600 text-white"
                            title="Cancelar Convite"
                            aria-label="Cancelar Convite"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                          <button
                            onClick={()=>{ const inv = invites.find(i=>i.id===row.id)!; resendInvite(inv) }}
                            className="inline-flex items-center justify-center p-2 rounded bg-green-600 text-white"
                            title="Reenviar Convite"
                            aria-label="Reenviar Convite"
                          >
                            <ResendEmailIcon className="h-4 w-4"/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={canAdmin?8:7}>{loading?'Carregando...':'Nenhum usuário ou convite pendente'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {combinedRows.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Mostrando {startIndex + 1}-{Math.min(endIndex, combinedRows.length)} de {combinedRows.length}</p>
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

      {inviteOpen && canAdmin && (
        <InviteModal onClose={()=>setInviteOpen(false)} companies={companies} onCreate={async (...args)=>{ await createInvite(...args); await loadInvites(); }} />
      )}
      {bulkOpen && canAdmin && (
        <BulkInviteModal onClose={()=>setBulkOpen(false)} companies={companies} onCreateMany={async (rows)=>{
          for (const r of rows) {
            await createInvite(r.email, r.role as UserRole, r.companyId, r.fullName)
          }
          setBulkOpen(false)
          setMsgTitle('Convites criados')
          setMsgText('Convites em lote criados.')
          setMsgVariant('success')
          setMsgOpen(true)
          await loadInvites()
        }} />
      )}

      {editUser && canAdmin && (
        <EditUserModal 
          user={editUser} 
          companies={companies} 
          onClose={()=>setEditUser(null)} 
          onSaved={()=>{ setEditUser(null); load() }} 
        />
      )}

      {editInvite && canAdmin && (
        <EditInviteModal 
          invite={editInvite}
          companies={companies}
          onClose={()=>setEditInvite(null)}
          onSaved={async()=>{ setEditInvite(null); await loadInvites() }}
        />
      )}

      <MessageModal open={msgOpen} title={msgTitle} message={msgText} variant={msgVariant} onClose={()=>setMsgOpen(false)} />
    </div>
  )
}

function ResendEmailIcon({ className }: { className?: string }){
  return (
    <span className={"relative inline-block " + (className || "h-4 w-4") }>
      <RefreshCw className="absolute inset-0 h-full w-full"/>
      <Mail className="absolute inset-0 h-3 w-3 m-[2px]"/>
    </span>
  )
}

function InviteModal({ onClose, companies, onCreate }:{ onClose:()=>void, companies:Company[], onCreate:(email:string, role:UserRole, companyId?:string, fullName?:string)=>void }){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [companyId, setCompanyId] = useState<string>('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Cadastrar Usuário</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600">Nome completo</label>
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">E-mail</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Empresa</label>
            <select value={companyId} onChange={(e)=>setCompanyId(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">Selecione</option>
              {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Perfil</label>
            <select value={role} onChange={(e)=>setRole(e.target.value as UserRole)} className="border rounded px-2 py-1 w-full">
              <option value="user">Usuário</option>
              <option value="corporate_manager">Gestor Corporativo</option>
              <option value="approver_manager">Aprovador Corporativo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={()=>onCreate(email, role, companyId || undefined, fullName || undefined)} className="px-3 py-2 rounded bg-green-600 text-white">Criar Convite</button>
        </div>
      </div>
    </div>
  )
}

function EditInviteModal({ invite, companies, onClose, onSaved }:{ invite:Invitation, companies:Company[], onClose:()=>void, onSaved:()=>void }){
  const [form, setForm] = useState({
    full_name: invite.full_name || '',
    email: invite.email || '',
    role: invite.role,
    company_id: invite.company_id || '',
  })

  const save = async () => {
    const { error } = await supabase.from('invitations').update({
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      company_id: form.company_id || null,
    }).eq('id', invite.id)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Editar Convite</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600">Nome completo</label>
            <input value={form.full_name} onChange={(e)=>setForm({...form, full_name:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600">E-mail</label>
            <input value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Perfil</label>
            <select value={form.role} onChange={(e)=>setForm({...form, role:e.target.value as UserRole})} className="border rounded px-2 py-1 w-full">
              <option value="user">Usuário</option>
              <option value="corporate_manager">Gestor Corporativo</option>
              <option value="approver_manager">Aprovador Corporativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Empresa</label>
            <select value={form.company_id} onChange={(e)=>setForm({...form, company_id:e.target.value})} className="border rounded px-2 py-1 w-full">
              <option value="">Selecione</option>
              {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={save} className="px-3 py-2 rounded bg-petroleo-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  )
}

function BulkInviteModal({ onClose, companies, onCreateMany }:{ onClose:()=>void, companies:Company[], onCreateMany:(rows:{fullName:string,email:string,companyId?:string,role:string}[])=>void }){
  const roles: UserRole[] = ['user','corporate_manager','approver_manager','admin']
  const cellToString = (val: any): string => {
    if (val == null) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'number') return String(val)
    if (typeof val === 'boolean') return val ? 'true' : 'false'
    if (val instanceof Date) return val.toISOString()
    if (typeof val === 'object') {
      const v: any = val
      if (v.text) return String(v.text)
      if (Array.isArray(v.richText)) return v.richText.map((t: any) => t.text).join('')
      if (v.result) return String(v.result)
      if (v.hyperlink && v.text) return String(v.text)
    }
    return String(val)
  }
  const downloadTemplate = async () => {
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const ws = workbook.addWorksheet('modelo_cadastro_usuarios')
      ws.columns = [
        { header: 'Nome Completo', key: 'full_name', width: 30 },
        { header: 'E-mail', key: 'email', width: 30 },
        { header: 'Empresa', key: 'company', width: 28 },
        { header: 'Perfil', key: 'role', width: 22 },
      ];
      const rolesSheet = workbook.addWorksheet('Perfis');
      const allowed: string[] = (roles.filter(r=>r!=='admin') as unknown as string[]);
      (rolesSheet.getColumn(1) as any).values = ['Perfil', ...allowed] as any;
      (ws as any).addRow({ full_name: 'João da Silva', email: 'joao@empresa.com', company: companies[0]?.name || 'Empresa Exemplo LTDA', role: allowed[0] })
      (ws as any).dataValidations?.add('D2:D1048576', { type: 'list', allowBlank: true, formulae: [`=Perfis!$A$2:$A$${allowed.length+1}`] })
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_cadastro_usuarios.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      const allowed = roles.filter(r=>r!=='admin')
      const sep = ';'
      const header = `Nome Completo${sep}E-mail${sep}Empresa${sep}Perfil\n`
      const example = `João da Silva${sep}joao@empresa.com${sep}${companies[0]?.name || 'Empresa Exemplo LTDA'}${sep}${allowed[0]}\n`
      const bom = '\ufeff'
      const blob = new Blob([bom + header + example], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_cadastro_usuarios.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const [parsed, setParsed] = useState<{fullName:string,email:string,companyId?:string,role:string}[]>([])
  const [error, setError] = useState<string>('')

  const onFile = async (file: File) => {
    setError('')
    try {
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const ExcelJS = await import('exceljs')
        const buf = await file.arrayBuffer()
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buf)
        const ws = wb.worksheets[0]
        const headerRow = ws.getRow(1)
        const cols = [headerRow.getCell(1).value, headerRow.getCell(2).value, headerRow.getCell(3).value, headerRow.getCell(4).value].map(v=>cellToString(v).toLowerCase())
        const idxFull = cols.findIndex(c=>c.includes('nome'))
        const idxEmail = cols.findIndex(c=>c.includes('mail') || c.includes('e-mail'))
        const idxCompany = cols.findIndex(c=>c.includes('empresa'))
        const idxRole = cols.findIndex(c=>c.includes('perfil'))
        const mapNameToId = new Map(companies.map(c=>[c.name.toLowerCase(), c.id]))
        const allowedRoles = ['user','corporate_manager','approver_manager']
        const items: {fullName:string,email:string,companyId?:string,role:string}[] = []
        ws.eachRow((row: any, rowNumber: number)=>{
          if (rowNumber === 1) return
          const get = (i:number)=> cellToString(row.getCell(i+1).value).trim()
          const fullName = get(idxFull)
          const email = get(idxEmail)
          const companyName = get(idxCompany)
          let role = get(idxRole)
          if (!allowedRoles.includes(role)) role = 'user'
          const companyId = mapNameToId.get((companyName||'').toLowerCase())
          if (email) items.push({ fullName, email, companyId, role })
        })
        setParsed(items)
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const text = String(reader.result || '')
            const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.trim().length>0)
            if (lines.length === 0) throw new Error('Arquivo vazio')
            const header = lines[0].toLowerCase()
            const sep = header.includes(';') ? ';' : ','
            const cols = header.split(sep).map(c=>c.trim())
            const idxFull = cols.findIndex(c=>c.includes('nome'))
            const idxEmail = cols.findIndex(c=>c.includes('mail') || c.includes('e-mail'))
            const idxCompany = cols.findIndex(c=>c.includes('empresa'))
            const idxRole = cols.findIndex(c=>c.includes('perfil'))
            if (idxFull<0 || idxEmail<0 || idxCompany<0 || idxRole<0) throw new Error('Cabeçalho inválido')
            const mapNameToId = new Map(companies.map(c=>[c.name.toLowerCase(), c.id]))
            const allowedRoles = ['user','corporate_manager','approver_manager']
            const items: {fullName:string,email:string,companyId?:string,role:string}[] = []
            for (let i=1;i<lines.length;i++){
              const parts = lines[i].split(sep).map(p=>p.trim())
              if (parts.length < cols.length) continue
              const fullName = parts[idxFull]
              const email = parts[idxEmail]
              const companyName = parts[idxCompany]
              let role = parts[idxRole]
              if (!allowedRoles.includes(role)) role = 'user'
              const companyId = mapNameToId.get((companyName||'').toLowerCase())
              items.push({ fullName, email, companyId, role })
            }
            setParsed(items)
          } catch(e:any) {
            setError(e.message || 'Falha ao ler arquivo')
          }
        }
        reader.readAsText(file)
      }
    } catch(e:any) {
      setError(e.message || 'Falha ao ler arquivo')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Cadastrar Usuários em Lote</h3>
        <p className="text-sm text-gray-600 mb-3">Baixe o modelo, preencha os dados e faça o upload (Excel/CSV). Perfis permitidos: usuário, gestor corporativo, aprovador corporativo.</p>
        <div className="flex gap-3 mb-4">
          <button onClick={downloadTemplate} className="px-3 py-2 rounded bg-petroleo-600 text-white">Baixar Modelo</button>
          <input type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) onFile(f) }} />
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="max-h-64 overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Nome Completo</th>
                <th className="px-3 py-2 text-left">E-mail</th>
                <th className="px-3 py-2 text-left">Empresa</th>
                <th className="px-3 py-2 text-left">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((r, i)=> (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{companies.find(c=>c.id===r.companyId)?.name || '-'}</td>
                  <td className="px-3 py-2">{getUserRoleLabel(r.role)}</td>
                </tr>
              ))}
              {parsed.length===0 && (
                <tr><td className="px-3 py-4 text-center text-gray-500" colSpan={4}>Nenhum dado carregado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={()=>onCreateMany(parsed)} disabled={!parsed.length} className="px-3 py-2 rounded bg-green-600 text-white">Criar Convites</button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ user, companies, onClose, onSaved }:{ user:UserProfile, companies:Company[], onClose:()=>void, onSaved:()=>void }){
  const { areas } = useCorporateAreas()
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    role: user.role,
    company_id: user.company_id || '',
    department: user.department || '',
    phone: user.phone || '',
    is_active: user.is_active,
  })

  const activeAreas = areas.filter(a=>a.status==='active')
  const showCurrentDept = !!form.department && !activeAreas.some(a=>a.name===form.department)

  const save = async () => {
    const payload = {
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      company_id: form.company_id || null,
      department: form.department || null,
      phone: form.phone || null,
      is_active: form.is_active,
    }
    const { error } = await supabase.from('user_profiles').update(payload).eq('id', user.id)
    if (!error) onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Editar Usuário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600">Nome completo</label>
            <input value={form.full_name} onChange={(e)=>setForm({...form, full_name:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600">E-mail</label>
            <input value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Perfil</label>
            <select value={form.role} onChange={(e)=>setForm({...form, role:e.target.value as UserRole})} className="border rounded px-2 py-1 w-full">
              <option value="user">Usuário</option>
              <option value="corporate_manager">Gestor Corporativo</option>
              <option value="approver_manager">Aprovador Corporativo</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Empresa</label>
            <select value={form.company_id} onChange={(e)=>setForm({...form, company_id:e.target.value})} className="border rounded px-2 py-1 w-full">
              <option value="">Selecione</option>
              {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Departamento</label>
            <select value={form.department} onChange={(e)=>setForm({...form, department:e.target.value})} className="border rounded px-2 py-1 w-full">
              <option value="">Selecionar...</option>
              {showCurrentDept && (<option value={form.department}>{form.department}</option>)}
              {activeAreas.map(a=> (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Celular/WhatsApp</label>
            <input value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.is_active} onChange={(e)=>setForm({...form, is_active:e.target.checked})} />
            <label htmlFor="active" className="text-xs text-gray-600">Usuário ativo</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={save} className="px-3 py-2 rounded bg-petroleo-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  )
}
