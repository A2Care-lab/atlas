import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Send, Paperclip, MessageSquare, FileText, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Report, Attachment, Comment, ReportStatus, UserProfile, StatusHistory } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import MessageModal from '../components/MessageModal'

interface Props {
  report: Report | null
  open: boolean
  onClose: () => void
  hideRiskInfo?: boolean
  hideStatusControls?: boolean
  hideInternalCommentToggle?: boolean
  hideCommentInput?: boolean
  disableAttachmentUpload?: boolean
  hideFinalStatusOptions?: boolean
}

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

const ROLE_TEXT_COLORS: Record<UserProfile['role'], string> = {
  admin: 'text-indigo-400',
  corporate_manager: 'text-emerald-400',
  approver_manager: 'text-blue-400',
  crm_n1: 'text-teal-400',
  user: 'text-gray-300'
}

const ROLE_BORDER_COLORS: Record<UserProfile['role'], string> = {
  admin: 'border-indigo-500',
  corporate_manager: 'border-emerald-500',
  approver_manager: 'border-blue-500',
  crm_n1: 'border-teal-500',
  user: 'border-gray-500'
}

export function ReportDetailsModal({ report, open, onClose, hideRiskInfo, hideStatusControls, hideInternalCommentToggle, hideCommentInput, disableAttachmentUpload, hideFinalStatusOptions }: Props) {
  const { profile } = useAuth()
  const [attachmentsUrls, setAttachmentsUrls] = useState<Record<string, string>>({})
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [commentAuthors, setCommentAuthors] = useState<Record<string, { id: string; email?: string; full_name?: string; role?: UserProfile['role'] }>>({})
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [newComment, setNewComment] = useState('')
  const [internal, setInternal] = useState(false)
  const canInternal = profile?.role && profile.role !== 'user'
  const [reporterName, setReporterName] = useState<string>('')
  const canManage = !!profile && ['admin','corporate_manager','approver_manager','crm_n1'].includes(profile.role)
  const canChangeStatus = !!profile && ['admin','corporate_manager','approver_manager'].includes(profile.role)
  const [displayStatus, setDisplayStatus] = useState<ReportStatus>(report?.status || 'received')
  const [statusDraft, setStatusDraft] = useState<ReportStatus>(report?.status || 'received')
  const [statusComment, setStatusComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadComments = async (reportId: string) => {
    let list: any[] = []
    let res
    try {
      res = await supabase
        .from('comments')
        .select('*, user:user_profiles(id, email, full_name, role)')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })
    } catch {}
    if (!res || res.error) {
      const res2 = await supabase
        .from('comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })
      list = (res2.data || []) as any[]
    } else {
      list = (res.data || []) as any[]
    }

    const missingIds = Array.from(new Set(list.filter((c) => !c.user?.role && c.user_id).map((c) => c.user_id)))
    if (missingIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .in('id', missingIds)
      const userMap: Record<string, { email?: string; full_name?: string; role?: UserProfile['role'] }> = {}
      ;(profiles || []).forEach((p: any) => { userMap[p.id] = { email: p.email, full_name: p.full_name, role: p.role } })
      list = list.map((c) => {
        if (c.user_id) {
          const info = userMap[c.user_id]
          if (info) {
            return { ...c, user: { ...(c.user || {}), id: c.user_id, email: info.email, full_name: info.full_name, role: info.role } }
          }
        }
        return c
      })
      setCommentAuthors((prev) => {
        const next = { ...prev }
        Object.keys(userMap).forEach((id) => { next[id] = { id, ...userMap[id] } })
        return next
      })
    }

    setComments(((list || []) as unknown) as Comment[])
  }

  useEffect(() => {
    if (!open || !report) return
    setLocalAttachments(report.attachments || [])
    setDisplayStatus(report.status)
    setStatusDraft(report.status)
    loadComments(report.id)
    ;(async () => {
      try {
        const { data } = await supabase
          .from('status_history')
          .select('*')
          .eq('report_id', report.id)
          .order('created_at', { ascending: true })
        setHistory((data || []) as StatusHistory[])
      } catch {
        setHistory([])
      }
    })()
    setNewComment('')
    setInternal(false)
    prepareAttachmentUrls(report.attachments || [])
    loadAttachmentsList(report.id)
    if (!report.is_anonymous) {
      if (report.user?.full_name) {
        setReporterName(report.user.full_name)
      } else if (report.user_id) {
        (async () => {
          try {
            const { data } = await supabase
              .from('user_profiles')
              .select('full_name,email')
              .eq('id', report.user_id)
              .single()
            setReporterName((data?.full_name || data?.email || '').trim())
          } catch {
            setReporterName('')
          }
        })()
      }
    } else {
      setReporterName('')
    }
  }, [open, report])

  const prepareAttachmentUrls = async (list: Attachment[]) => {
    const map: Record<string, string> = {}
    for (const att of list) {
      const signed = await supabase.storage.from('reports').createSignedUrl(att.file_path, 60 * 60)
      map[att.id] = signed.data?.signedUrl || ''
    }
    setAttachmentsUrls(map)
  }

  const loadAttachmentsList = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('report_id', reportId)
        .order('uploaded_at', { ascending: true })
      if (!error && data) {
        const list = (data as Attachment[])
        setLocalAttachments(list)
        prepareAttachmentUrls(list)
      }
    } catch {}
  }

  const sanitizeFileName = (name: string) => {
    const base = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    return base.replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-')
  }

  const handleUpdateStatus = async () => {
    if (!report || !canManage) return
    if (displayStatus === 'approved' || displayStatus === 'rejected') return
    const prev = displayStatus
    const { error } = await supabase
      .from('reports')
      .update({ status: statusDraft })
      .eq('id', report.id)
      .select()
      
    if (!error) {
      setDisplayStatus(statusDraft)
      await supabase
        .from('status_history')
        .insert({ report_id: report.id, previous_status: prev, new_status: statusDraft, changed_by: profile?.id, comment: statusComment })
      setStatusComment('')
    }
  }

  const handleUploadAttachments = async (files: File[] | null) => {
    if (!files || files.length === 0 || !report || !canManage) return
    if ((displayStatus === 'approved' || displayStatus === 'rejected') && profile?.role !== 'admin') return
    setUploading(true)
    try {
      const newAtts: Attachment[] = []
      const MAX_SIZE = 10 * 1024 * 1024
      for (const file of files) {
        if (file.size > MAX_SIZE) {
          setErrorMsg(`Arquivo ${file.name} excede 10MB.`)
          setErrorOpen(true)
          continue
        }
        const safeName = sanitizeFileName(file.name)
        const path = `${report.id}/${Date.now()}-${safeName}`
        const uploadRes = await supabase.storage.from('reports').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
        if (uploadRes.error) {
          setErrorMsg(`Falha ao enviar ${file.name}.`)
          setErrorOpen(true)
          continue
        }
        const { data, error } = await supabase
          .from('attachments')
          .insert({
            report_id: report.id,
            file_name: safeName,
            file_path: uploadRes.data?.path || path,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: profile?.id
          })
          .select('*')
          .single()
        if (error) {
          setErrorMsg(`Falha ao registrar anexo ${file.name}.`)
          setErrorOpen(true)
        } else if (data) {
          newAtts.push(data as Attachment)
        }
      }
      if (newAtts.length > 0) {
        const updated = [...localAttachments, ...newAtts]
        setLocalAttachments(updated)
        prepareAttachmentUrls(updated)
        await loadAttachmentsList(report.id)
      }
    } finally {
      setUploading(false)
      setPendingFiles([])
    }
  }

  const getStatusLabel = (s: ReportStatus) => {
    const labels: Record<ReportStatus, string> = {
      received: 'Recebida',
      under_analysis: 'Em Análise',
      under_investigation: 'Em Apuração',
      waiting_info: 'Aguardando Informação',
      corporate_approval: 'Aprovação Corporativa',
      approved: 'Concluída',
      rejected: 'Rejeitada'
    }
    return labels[s]
  }

  const getRiskLabel = (risk: string): string => {
    const labels = {
      low: 'Baixo',
      moderate: 'Moderado',
      high: 'Alto',
      critical: 'Crítico'
    }
    return labels[risk as keyof typeof labels] || risk
  }

  const getRoleLabel = (role?: UserProfile['role']): string => {
    const map: Record<UserProfile['role'], string> = {
      admin: 'Administrador do Sistema',
      corporate_manager: 'Gestor Corporativo',
      approver_manager: 'Aprovador Corporativo',
      crm_n1: 'CRM - N1',
      user: 'Usuário'
    }
    if (!role) return 'Usuário'
    return map[role]
  }

  const getIconForStatus = (status: ReportStatus) => {
    switch (status) {
      case 'received':
      case 'under_analysis':
        return <Clock className="h-4 w-4" />
      case 'under_investigation':
      case 'waiting_info':
        return <AlertCircle className="h-4 w-4" />
      case 'corporate_approval':
        return <FileText className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getSituationLabel = (v: Report['situation_type']) => {
    const map: Record<string, string> = {
      conflict: 'Conflito',
      misconduct: 'Mau comportamento',
      moral_harassment: 'Assédio moral',
      discrimination: 'Discriminação',
      sexual_harassment: 'Assédio sexual',
      threat_violence: 'Ameaça/Violência',
      fraud: 'Fraude',
      other: 'Outro'
    }
    return map[v] || v
  }

  const getScopeLabel = (v: Report['affected_scope']) => {
    const map: Record<string, string> = {
      individual: 'Individual',
      team: 'Equipe',
      department: 'Departamento',
      company: 'Empresa'
    }
    return map[v] || v
  }

  const getRecurrenceLabel = (v: Report['recurrence']) => {
    const map: Record<string, string> = {
      first_time: 'Primeira vez',
      occurred_before: 'Já ocorreu antes',
      frequent: 'Frequente'
    }
    return map[v] || v
  }

  const filteredComments = useMemo(() => {
    if (!comments) return []
    if (profile?.role === 'user') return comments.filter((c) => !c.is_internal)
    return comments
  }, [comments, profile])

  const isFinalized = displayStatus === 'approved' || displayStatus === 'rejected'
  const isAdmin = profile?.role === 'admin'
  const canComment = !isFinalized || !!isAdmin
  const canAttachFiles = (!isFinalized || !!isAdmin) && !disableAttachmentUpload

  const finalizedAt: Date | undefined = useMemo(() => {
    if (!report || !isFinalized) return undefined
    const list = (history || []).filter((h) => h.new_status === 'approved' || h.new_status === 'rejected')
    if (list.length > 0) {
      const last = list[list.length - 1]
      return new Date(last.created_at)
    }
    try {
      return new Date(report.updated_at)
    } catch {
      return undefined
    }
  }, [history, isFinalized, report])

  const renderSlaBadge = () => {
    if (!report) return null
    const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0
    const created = new Date(report.created_at)

    if (isFinalized && finalizedAt) {
      const totalDays = Math.max(0, Math.ceil((finalizedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
      const over = slaDays ? Math.max(0, totalDays - slaDays) : 0
      const within = slaDays ? totalDays <= slaDays : true
      const color = within ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
      const label = `${totalDays} dia${totalDays === 1 ? '' : 's'}`
      const extra = slaDays ? (over > 0 ? `- Fora do SLA por ${over} dia${over === 1 ? '' : 's'}` : `- Dentro do SLA`) : ''
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}{extra ? ` ${extra}` : ''}</span>
    }

    if (!slaDays) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600">SLA não definido</span>
    }
    const deadline = new Date(created)
    deadline.setDate(deadline.getDate() + slaDays)
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const expired = diffDays < 0
    const color = expired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    const label = `${expired ? 'Vencido' : 'Vence em'} ${deadline.toLocaleDateString('pt-BR')}`
    const extra = `${expired ? 'há' : 'faltam'} ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'}`
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label} — {extra}</span>
  }

  const handleAddComment = async () => {
    if (!report || !newComment.trim() || !canComment) return
    const { data, error } = await supabase
      .from('comments')
      .insert({
        report_id: report.id,
        content: newComment.trim(),
        is_internal: canInternal ? internal : false,
        user_id: profile?.id,
        author_role: profile?.role
      })
      .select('*')
      .single()
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment])
      setNewComment('')
      setInternal(false)
      loadComments(report.id)
    }
  }

  if (!open || !report) return null

  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[52rem] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all transform scale-100">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Detalhes da Denúncia
                {report.risk_level === 'critical' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    Prioridade Crítica
                  </span>
                )}
              </h2>
              <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-gray-300 font-medium border border-white/5">{report.protocol}</span>
                {report.company?.name && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">{report.company.name}</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-8">
            {/* Cabeçalho de Status e Datas */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status Atual</div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[displayStatus]}`}>
                  {getIconForStatus(displayStatus)}
                  <span className="ml-2">{getStatusLabel(displayStatus)}</span>
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Criado em</div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {new Date(report.created_at).toLocaleString('pt-BR')}
                </div>
              </div>

              {isFinalized && finalizedAt && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Encerrado em</div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    {finalizedAt.toLocaleString('pt-BR')}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">SLA</div>
                {renderSlaBadge()}
              </div>
            </div>

            {!hideStatusControls && canChangeStatus && (
              <div className="bg-sky-500/5 rounded-xl p-4 border border-sky-500/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Alterar status</label>
                    <div className="mt-1 relative">
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as ReportStatus)}
                        disabled={isFinalized}
                        className={`block w-full rounded-lg border-white/10 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm py-2.5 text-white [&>option]:bg-slate-800 ${isFinalized ? 'bg-white/5 cursor-not-allowed text-gray-500' : 'bg-white/5'}`}
                      >
                        {(hideFinalStatusOptions ? (['received','under_analysis','under_investigation','waiting_info','corporate_approval'] as ReportStatus[]) : (['received','under_analysis','under_investigation','waiting_info','corporate_approval','approved','rejected'] as ReportStatus[])).map((s) => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Comentário de status (opcional)</label>
                      <input
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        disabled={isFinalized}
                        className={`mt-1 block w-full rounded-lg border-white/10 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm py-2.5 text-white placeholder-gray-500 ${isFinalized ? 'bg-white/5 cursor-not-allowed' : 'bg-white/5'}`}
                        placeholder="Descreva o motivo da alteração..."
                      />
                    </div>
                    <button 
                      onClick={handleUpdateStatus} 
                      disabled={isFinalized} 
                      className={`mb-[1px] inline-flex items-center px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm transition-all ${isFinalized ? 'bg-gray-600 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800'}`}
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white leading-tight">{report.title}</h3>
                <div className="mt-3 text-sm text-gray-300 whitespace-pre-line leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                  {report.description}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Informações */}
              <div className="bg-white/5 rounded-2xl border border-white/10 shadow-lg overflow-hidden">
                <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <div className="bg-white/10 p-1.5 rounded-md shadow-sm border border-white/5">
                    <FileText className="h-4 w-4 text-sky-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Detalhes do Formulário</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Identificação</div>
                    <div className="text-sm font-medium text-white bg-white/5 px-3 py-2 rounded-lg border border-white/5 inline-block w-full">
                      {report.is_anonymous ? 'Anônimo' : reporterName ? `Identificado — ${reporterName}` : 'Identificado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Departamento</div>
                    <div className="text-sm font-medium text-white bg-white/5 px-3 py-2 rounded-lg border border-white/5 inline-block w-full">
                      {report.department || 'Não informado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Tipo de situação</div>
                    <div className="text-sm font-medium text-white">{getSituationLabel(report.situation_type)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Risco imediato</div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {report.has_immediate_risk 
                        ? <span className="text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Sim</span> 
                        : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Não</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Liderança envolvida</div>
                    <div className="text-sm font-medium text-white">{report.involves_leadership ? 'Sim' : 'Não'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Escopo afetado</div>
                    <div className="text-sm font-medium text-white">{getScopeLabel(report.affected_scope)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Recorrência</div>
                    <div className="text-sm font-medium text-white">{getRecurrenceLabel(report.recurrence)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">Retaliação</div>
                    <div className="text-sm font-medium text-white">{report.has_retaliation ? 'Sim' : 'Não'}</div>
                  </div>
                  
                  {!hideRiskInfo && (
                    <div className="sm:col-span-2 pt-4 border-t border-white/10 mt-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-medium text-gray-400">Pontuação de risco</div>
                        <div className="text-lg font-bold text-white">{report.risk_score}</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-400 mb-2">Classificação</div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { range: '0–29', level: 'low' },
                              { range: '30–69', level: 'moderate' },
                              { range: '70–109', level: 'high' },
                              { range: '110+', level: 'critical' }
                            ].map((item) => (
                              <span 
                                key={item.range} 
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                                  getRiskLabel(report.risk_level) === getRiskLabel(item.level) 
                                    ? RISK_COLORS[item.level] + ' ring-1 ring-inset ring-black/5 shadow-sm' 
                                    : 'bg-white/5 text-gray-500 border-white/5'
                                }`}
                              >
                                {item.range} {getRiskLabel(item.level)}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-400 mb-1">Justificativa do risco</div>
                          <div className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/10 italic">
                            {report.risk_justification || 'Nenhuma justificativa fornecida.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Anexos e Comentários */}
              <div className="space-y-6">
                {/* Anexos */}
                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-lg overflow-hidden">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-white/10 p-1.5 rounded-md shadow-sm border border-white/5">
                        <Paperclip className="h-4 w-4 text-sky-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">Anexos ({localAttachments.length})</h3>
                    </div>
                    {canManage && (
                      <label className={`cursor-pointer inline-flex items-center p-1.5 rounded-lg transition-colors ${!canAttachFiles ? 'opacity-50 cursor-not-allowed bg-white/5' : 'hover:bg-white/10 text-sky-400'}`}>
                        <Plus className="h-4 w-4" />
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          disabled={!canAttachFiles}
                          onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {uploading && (
                      <div className="mb-3 text-xs text-sky-400 bg-sky-500/10 px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                        <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                        Enviando arquivos...
                      </div>
                    )}
                    
                    {pendingFiles.length > 0 && (
                      <div className="mb-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-sky-200 font-medium">{pendingFiles.length} arquivo(s) para enviar</span>
                          <button
                            onClick={() => handleUploadAttachments(pendingFiles)}
                            disabled={!canAttachFiles}
                            className="text-xs bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                          >
                            Confirmar Envio
                          </button>
                        </div>
                      </div>
                    )}

                    {(localAttachments && localAttachments.length > 0) ? (
                      <ul className="space-y-2">
                        {localAttachments.map((att) => (
                          <li key={att.id} className="group flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-sky-500/30 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-sky-500/10 transition-colors">
                                <FileText className="h-5 w-5 text-gray-400 group-hover:text-sky-400" />
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-medium text-gray-200 truncate">{att.file_name}</div>
                                <div className="text-xs text-gray-500">{(att.file_size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <a
                              href={attachmentsUrls[att.id] || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-gray-500 hover:text-sky-400 hover:bg-white/10 rounded-lg transition-colors"
                              title="Baixar arquivo"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <div className="text-sm text-gray-500">Nenhum anexo disponível</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comentários */}
                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col h-[500px]">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <div className="bg-white/10 p-1.5 rounded-md shadow-sm border border-white/5">
                      <MessageSquare className="h-4 w-4 text-sky-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Histórico de Comentários ({filteredComments.length})</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                    {filteredComments.length > 0 ? (
                      filteredComments.map((c) => {
                        const author = c.user || (c.user_id ? commentAuthors[c.user_id] : undefined)
                        const roleKey = ((author?.role || c.author_role || 'user') as UserProfile['role'])
                        const isInternal = !!c.is_internal
                        const borderColor = isInternal ? 'border-l-gray-500' : `border-l-[4px] ${ROLE_BORDER_COLORS[roleKey].replace('border-', 'border-l-')}`
                        
                        return (
                          <div key={c.id} className={`bg-[#1e293b] p-4 rounded-xl shadow-sm border border-white/5 relative ${isInternal ? 'bg-gray-800' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-opacity-10 ${ROLE_TEXT_COLORS[roleKey].replace('text-', 'bg-')} ${ROLE_TEXT_COLORS[roleKey]}`}>
                                  {getRoleLabel(roleKey)}
                                </span>
                                {isInternal && <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Interno</span>}
                              </div>
                              <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-white/10">
                              {c.content}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Nenhum comentário ainda</span>
                      </div>
                    )}
                  </div>

                  {!hideCommentInput && (
                    <div className="p-4 bg-white/5 border-t border-white/10">
                      <div className="space-y-3">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                          placeholder={canComment ? "Escreva sua mensagem..." : "Comentários desativados"}
                          disabled={!canComment}
                          className={`w-full rounded-xl border-white/10 px-4 py-3 text-sm focus:border-sky-500 focus:ring-sky-500 resize-none text-white placeholder-gray-500 ${!canComment ? 'bg-white/5 cursor-not-allowed' : 'bg-white/5 focus:bg-white/10 transition-colors'}`}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {!hideInternalCommentToggle && canInternal && (
                              <label className={`flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer hover:text-white transition-colors ${!canComment ? 'opacity-50' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  disabled={!canComment} 
                                  checked={internal} 
                                  onChange={(e) => setInternal(e.target.checked)}
                                  className="rounded border-gray-600 bg-slate-800 text-sky-500 focus:ring-sky-500" 
                                />
                                Apenas interno
                              </label>
                            )}
                          </div>
                          <button
                            onClick={handleAddComment}
                            disabled={!canComment || !newComment.trim()}
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-all ${!canComment || !newComment.trim() ? 'bg-gray-700 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 hover:shadow-md active:transform active:scale-95'}`}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <MessageModal open={errorOpen} title="Falha no upload" message={errorMsg} variant="error" onClose={() => setErrorOpen(false)} />
        </div>
      </div>
    </div>,
    document.body
  )
}
