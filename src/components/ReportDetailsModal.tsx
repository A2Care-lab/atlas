import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Send, Paperclip, MessageSquare, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Report, Attachment, Comment, ReportStatus, UserProfile } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import MessageModal from '../components/MessageModal'

interface Props {
  report: Report | null
  open: boolean
  onClose: () => void
  hideRiskInfo?: boolean
  hideStatusControls?: boolean
  hideInternalCommentToggle?: boolean
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  received: 'bg-petroleo-100 text-petroleo-800',
  under_analysis: 'bg-yellow-100 text-yellow-800',
  under_investigation: 'bg-red-100 text-red-800',
  waiting_info: 'bg-purple-100 text-purple-800',
  corporate_approval: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800'
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-600 text-white'
}

const ROLE_TEXT_COLORS: Record<UserProfile['role'], string> = {
  admin: 'text-indigo-700',
  corporate_manager: 'text-emerald-700',
  approver_manager: 'text-blue-700',
  user: 'text-gray-800'
}

const ROLE_BORDER_COLORS: Record<UserProfile['role'], string> = {
  admin: 'border-indigo-600',
  corporate_manager: 'border-emerald-600',
  approver_manager: 'border-blue-600',
  user: 'border-gray-400'
}

export function ReportDetailsModal({ report, open, onClose, hideRiskInfo, hideStatusControls, hideInternalCommentToggle }: Props) {
  const { profile } = useAuth()
  const [attachmentsUrls, setAttachmentsUrls] = useState<Record<string, string>>({})
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [internal, setInternal] = useState(false)
  const canInternal = profile?.role && profile.role !== 'user'
  const [reporterName, setReporterName] = useState<string>('')
  const canManage = !!profile && ['admin','corporate_manager','approver_manager'].includes(profile.role)
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
      const roleMap: Record<string, UserProfile['role']> = {}
      const userMap: Record<string, { email?: string; full_name?: string; role?: UserProfile['role'] }> = {}
      ;(profiles || []).forEach((p: any) => { roleMap[p.id] = p.role; userMap[p.id] = { email: p.email, full_name: p.full_name, role: p.role } })
      list = list.map((c) => {
        if (c.user_id) {
          const info = userMap[c.user_id]
          if (info) {
            return { ...c, user: { ...(c.user || {}), id: c.user_id, email: info.email, full_name: info.full_name, role: info.role } }
          }
        }
        return c
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
    const prev = displayStatus
    const { error } = await supabase
      .from('reports')
      .update({ status: statusDraft })
      .eq('id', report.id)
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
  const canAttachFiles = !isFinalized || !!isAdmin

  const renderSlaBadge = () => {
    if (!report) return null
    const slaDays = typeof report.company?.sla_days === 'number' ? (report.company?.sla_days || 0) : 0
    if (!slaDays) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">SLA não definido</span>
    }
    const created = new Date(report.created_at)
    const deadline = new Date(created)
    deadline.setDate(deadline.getDate() + slaDays)
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const expired = diffDays < 0
    const color = expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
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
        user_id: profile?.id
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
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="fixed inset-0 flex items-start justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[48rem] max-h-[74vh] overflow-y-auto bg-white rounded-lg shadow-xl border-2 border-petroleo-500">
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Detalhes da Denúncia</h2>
              <div className="text-xs text-gray-700">Protocolo: <span className="font-medium text-gray-900">{report.protocol}</span></div>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-200">
              <X className="h-4 w-4 text-gray-800" />
            </button>
          </div>
          <div className="px-4 pt-4 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-700">Criado em</div>
                <div className="text-sm text-gray-900">{new Date(report.created_at).toLocaleString('pt-BR')}</div>
              </div>
              <div className="flex items-end gap-6">
                <div className="space-y-1">
                  <div className="text-xs text-gray-700">Status</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus]}`}>
                    {getIconForStatus(displayStatus)}
                    <span className="ml-1">{getStatusLabel(displayStatus)}</span>
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-700">SLA de Tratativa</div>
                  {renderSlaBadge()}
                </div>
                {!hideRiskInfo && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-700">Grau de Risco</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[report.risk_level]}`}>
                      {getRiskLabel(report.risk_level)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!hideStatusControls && canManage && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-700">Alterar status</label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as ReportStatus)}
                    className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900"
                  >
                    {(['received','under_analysis','under_investigation','waiting_info','corporate_approval','approved','rejected'] as ReportStatus[]).map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-700">Comentário de status (opcional)</label>
                  <input
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900"
                    placeholder="Descreva a alteração"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end">
                  <button onClick={handleUpdateStatus} className="inline-flex items-center px-3 py-2 rounded-md bg-petroleo-600 hover:bg-petroleo-700 text-white text-sm">Atualizar Status</button>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-xs text-gray-700">Título</div>
              <div className="text-sm font-medium text-gray-900">{report.title}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-700">Descrição</div>
              <div className="text-sm text-gray-900 whitespace-pre-line">{report.description}</div>
            </div>
            <div className="border border-gray-300 rounded-md p-3">
              <div className="text-sm font-medium text-gray-900 mb-3">Informações do formulário</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-700">Identificação</div>
                  <div className="text-sm text-gray-900">{report.is_anonymous ? 'Anônimo' : reporterName ? `Identificado — ${reporterName}` : 'Identificado'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Departamento</div>
                  <div className="text-sm text-gray-900">{report.department || 'Não informado'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Tipo de situação</div>
                  <div className="text-sm text-gray-900">{getSituationLabel(report.situation_type)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Risco imediato</div>
                  <div className="text-sm text-gray-900">{report.has_immediate_risk ? 'Sim' : 'Não'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Liderança envolvida</div>
                  <div className="text-sm text-gray-900">{report.involves_leadership ? 'Sim' : 'Não'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Escopo afetado</div>
                  <div className="text-sm text-gray-900">{getScopeLabel(report.affected_scope)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Recorrência</div>
                  <div className="text-sm text-gray-900">{getRecurrenceLabel(report.recurrence)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Retaliação</div>
                  <div className="text-sm text-gray-900">{report.has_retaliation ? 'Sim' : 'Não'}</div>
                </div>
                {!hideRiskInfo && (
                  <div>
                    <div className="text-xs text-gray-700">Pontuação de risco</div>
                    <div className="text-sm text-gray-900">{report.risk_score}</div>
                  </div>
                )}
                {!hideRiskInfo && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-gray-700">Score Classificação de Riscos</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {[
                        { range: '0–29', level: 'low' },
                        { range: '30–69', level: 'moderate' },
                        { range: '70–109', level: 'high' },
                        { range: '110+', level: 'critical' }
                      ].map((item) => (
                        <span key={item.range} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[item.level]}`}>
                          <span className="mr-1">{item.range}</span>
                          {getRiskLabel(item.level)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!hideRiskInfo && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-gray-700">Justificativa do risco</div>
                    <div className="text-sm text-gray-900 whitespace-pre-line">{report.risk_justification || '—'}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-900"><Paperclip className="h-4 w-4" /><span className="text-sm font-medium">Anexos ({localAttachments.length})</span></div>
              {canManage && canAttachFiles && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                    />
                    {uploading && <span className="text-xs text-gray-700">Enviando...</span>}
                  </div>
                  {pendingFiles.length > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-700">
                        {pendingFiles.length} arquivo(s) selecionado(s)
                      </div>
                      <button
                        onClick={() => handleUploadAttachments(pendingFiles)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-white bg-petroleo-600 hover:bg-petroleo-700 text-xs"
                      >
                        Enviar Anexos
                      </button>
                    </div>
                  )}
                </div>
              )}
              {canManage && !canAttachFiles && (
                <div className="mb-3 text-xs text-gray-700">Inclusão de anexos desabilitada para denúncias Concluídas/Rejeitadas (apenas Admin).</div>
              )}
              {(localAttachments && localAttachments.length > 0) ? (
                <ul className="divide-y divide-gray-300 border border-gray-300 rounded-md">
                  {localAttachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="truncate">
                        <div className="text-gray-900 truncate">{att.file_name}</div>
                        <div className="text-xs text-gray-700">{(att.file_size / 1024).toFixed(1)} KB</div>
                      </div>
                      <a
                        href={attachmentsUrls[att.id] || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-400 text-gray-900 hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-700">Nenhum anexo</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-900"><MessageSquare className="h-4 w-4" /><span className="text-sm font-medium">Comentários ({filteredComments.length})</span></div>
              {filteredComments.length > 0 ? (
                <ul className="space-y-3">
                  {filteredComments.map((c) => (
                    <li key={c.id} className={`p-3 rounded-md border border-gray-200 border-l-4 ${ROLE_BORDER_COLORS[(c.user?.role || 'user')]}`}>
                      <div className="text-xs text-gray-700 flex items-center justify-between">
                        <span className={`font-medium ${ROLE_TEXT_COLORS[(c.user?.role || 'user')]}`}>{getRoleLabel(c.user?.role)}</span>
                        <span className="text-petroleo-700">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-900 whitespace-pre-line">{c.content}</div>
                      {c.is_internal && (<div className="mt-1 text-[10px] inline-flex px-1.5 py-0.5 rounded bg-gray-200 text-gray-900">Interno</div>)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-700">Nenhum comentário</div>
              )}
              <div className="mt-3 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Escreva um comentário"
                  disabled={!canComment}
                  className={`w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-petroleo-400 ${!canComment ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {!hideInternalCommentToggle && canInternal && (
                  <label className={`flex items-center gap-2 text-xs text-gray-900 ${!canComment ? 'opacity-60' : ''}`}>
                    <input type="checkbox" disabled={!canComment} checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                    Comentário interno
                  </label>
                )}
                {!canComment && (
                  <div className="text-xs text-gray-700">Comentários desabilitados para denúncias Concluídas/Rejeitadas (apenas Admin).</div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!canComment}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-white text-sm ${!canComment ? 'bg-gray-400 cursor-not-allowed' : 'bg-petroleo-600 hover:bg-petroleo-700'}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Comentário
                  </button>
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
