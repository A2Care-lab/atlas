import { createPortal } from 'react-dom'
import { useState } from 'react'
import { X, CheckCircle, XCircle, Paperclip } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Report } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import MessageModal from './MessageModal'

interface Props {
  open: boolean
  report: Report | null
  action: 'approve' | 'reject'
  onClose: () => void
  onCompleted?: () => void
}

export default function ApproveReportModal({ open, report, action, onClose, onCompleted }: Props) {
  const { profile } = useAuth()
  const [comment, setComment] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const MAX_COMMENT_LEN = 500
  const canSubmit = comment.trim().length > 0 && comment.trim().length <= MAX_COMMENT_LEN

  const sanitizeFileName = (name: string) => {
    const base = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    return base.replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-')
  }

  const handleSubmit = async () => {
    if (!report || !profile) return
    setSubmitting(true)
    try {
      const MAX_SIZE = 10 * 1024 * 1024
      for (const file of pendingFiles) {
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
        await supabase
          .from('attachments')
          .insert({
            report_id: report.id,
            file_name: safeName,
            file_path: uploadRes.data?.path || path,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: profile?.id
          })
      }

      if (comment && comment.trim()) {
        await supabase
          .from('comments')
          .insert({
            report_id: report.id,
            content: comment.trim(),
            is_internal: false,
            user_id: profile?.id,
            author_role: profile?.role
          })
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', report.id)
      if (updateError) throw updateError

      await supabase.from('status_history').insert({
        report_id: report.id,
        previous_status: 'corporate_approval',
        new_status: newStatus,
        changed_by: profile?.id,
        comment: comment && comment.trim() ? comment.trim() : (newStatus === 'approved' ? 'Denúncia aprovada e encerrada' : 'Denúncia rejeitada')
      })

      setComment('')
      setPendingFiles([])
      onClose()
      onCompleted && onCompleted()
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erro ao concluir ação.')
      setErrorOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !report) return null

  const title = action === 'approve' ? 'Aprovar Denúncia' : 'Rejeitar Denúncia'
  const cta = action === 'approve' ? 'Aprovar' : 'Rejeitar'
  const ctaColor = action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'

  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-[32rem] bg-white rounded-lg shadow-xl border-2 border-petroleo-500">
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <div className="flex items-center gap-2 text-gray-900">
              {action === 'approve' ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-red-600"/>}
              <h2 className="text-base font-semibold">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-200"><X className="h-4 w-4 text-gray-800"/></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-sm text-gray-700">Protocolo: <span className="font-medium text-gray-900">{report.protocol}</span></div>
            <div>
              <label className="text-xs text-gray-700">Justificativa do aprovador</label>
              <textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={4} maxLength={MAX_COMMENT_LEN} className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900" placeholder="Descreva a decisão e justificativa"/>
              <div className="mt-1 text-[11px] text-gray-600">Limite de {MAX_COMMENT_LEN} caracteres — {comment.length}/{MAX_COMMENT_LEN}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-900"><Paperclip className="h-4 w-4"/><span className="text-sm font-medium">Anexos</span></div>
              <input type="file" multiple onChange={(e)=>setPendingFiles(Array.from(e.target.files || []))} />
              {pendingFiles.length > 0 && (
                <div className="mt-1 text-xs text-gray-700">{pendingFiles.length} arquivo(s) selecionado(s)</div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-400 text-sm text-gray-900 hover:bg-gray-100">Cancelar</button>
              <button onClick={handleSubmit} disabled={submitting || !canSubmit} className={`px-3 py-2 rounded-md text-white text-sm ${submitting || !canSubmit ? 'bg-gray-400 cursor-not-allowed' : ctaColor}`}>{submitting ? 'Salvando...' : cta}</button>
            </div>
          </div>
          <MessageModal open={errorOpen} title={"Erro"} message={errorMsg} variant="error" onClose={()=>setErrorOpen(false)} />
        </div>
      </div>
    </div>,
    document.body
  )
}
