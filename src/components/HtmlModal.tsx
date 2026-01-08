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
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/40 flex items-start justify-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-lg bg-white shadow-xl border-2 border-petroleo-600 overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Fechar</button>
        </div>
        <div className="p-4 prose prose-sm max-w-none overflow-y-auto flex-1">
          <div dangerouslySetInnerHTML={{ __html: html || '' }} />
        </div>
        {footer && (
          <div className="p-4 border-t border-gray-200 text-xs text-gray-600">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
