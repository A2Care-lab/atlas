import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  html: string
  footer?: string
  onClose: () => void
}

export function HtmlModal({ open, title, html, footer, onClose }: Props) {
  if (!open) return null
  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/40 flex items-start justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="box-border w-full min-w-0 max-w-[calc(100vw-32px)] sm:max-w-5xl h-auto max-h-[90vh] sm:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl border-2 border-petroleo-600 overflow-hidden flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 p-4 sm:p-4 border-b border-gray-200 bg-white">
          <h2 className="min-w-0 flex-1 pr-2 text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h2>
          <button onClick={onClose} className="flex-shrink-0 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Fechar</button>
        </div>
        <div className="p-4 prose prose-sm sm:prose max-w-none overflow-y-auto overflow-x-hidden flex-1 break-words">
          <div dangerouslySetInnerHTML={{ __html: html || '' }} />
        </div>
        {footer && (
          <div className="p-3 sm:p-4 border-t border-gray-200 text-xs text-gray-600 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
