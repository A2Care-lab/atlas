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
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="box-border w-full min-w-0 max-w-[calc(100vw-32px)] sm:max-w-5xl h-auto max-h-[90vh] sm:max-h-[calc(100vh-3rem)] rounded-xl bg-slate-900/95 backdrop-blur-md shadow-2xl border border-white/10 overflow-hidden flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 p-4 sm:p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
          <h2 className="min-w-0 flex-1 pr-2 text-base sm:text-lg font-semibold text-white truncate">{title}</h2>
          <button onClick={onClose} className="flex-shrink-0 px-3 py-2 rounded-lg bg-petroleo-600/20 hover:bg-petroleo-600/40 text-petroleo-300 hover:text-white text-sm transition-colors border border-petroleo-500/30">Fechar</button>
        </div>
        <div className="p-6 prose prose-invert prose-sm sm:prose max-w-none overflow-y-auto overflow-x-hidden flex-1 break-words scrollbar-thin scrollbar-thumb-petroleo-600/50 scrollbar-track-transparent">
          <div dangerouslySetInnerHTML={{ __html: html || '' }} />
        </div>
        {footer && (
          <div className="p-3 sm:p-4 border-t border-white/10 text-xs text-gray-400 bg-slate-900/95 backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
