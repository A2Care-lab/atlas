import { supabase } from '../lib/supabase'
import { Report } from '../types/database'

export async function deleteReportsWithAttachments(reports: Report[]) {
  const ids = reports.map((report) => report.id)
  const attachmentPaths = Array.from(
    new Set(
      reports
        .flatMap((report) => report.attachments || [])
        .map((attachment) => attachment.file_path)
        .filter(Boolean)
    )
  )

  if (attachmentPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('reports')
      .remove(attachmentPaths)

    if (storageError) {
      console.warn('Falha ao remover anexos das denúncias no storage', storageError)
    }
  }

  const { error } = await supabase
    .from('reports')
    .delete()
    .in('id', ids)

  if (error) {
    throw error
  }

  return ids
}
