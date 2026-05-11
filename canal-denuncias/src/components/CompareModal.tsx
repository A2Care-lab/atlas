import { createPortal } from 'react-dom'

export default function CompareModal({ open, leftTitle, rightTitle, leftUpdatedAt, rightUpdatedAt, leftHtml, rightHtml, onClose }: { open: boolean, leftTitle: string, rightTitle: string, leftUpdatedAt?: string, rightUpdatedAt?: string, leftHtml: string, rightHtml: string, onClose: () => void }) {
  if (!open) return null
  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-start justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-6xl rounded-2xl bg-[#0f172a] shadow-2xl border border-white/10 overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Comparação de versões</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm border border-white/10 transition-colors">Fechar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-auto">
          <div className="p-4 border-r border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">{leftTitle}</h3>
            {leftUpdatedAt && <div className="text-xs text-gray-500 mb-2">{leftUpdatedAt}</div>}
            <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-gray-300" dangerouslySetInnerHTML={{ __html: leftHtml || '' }} />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">{rightTitle}</h3>
            {rightUpdatedAt && <div className="text-xs text-gray-500 mb-2">{rightUpdatedAt}</div>}
            <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-gray-300" dangerouslySetInnerHTML={{ __html: rightHtml || '' }} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
