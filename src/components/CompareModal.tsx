import { createPortal } from 'react-dom'

export default function CompareModal({ open, leftTitle, rightTitle, leftUpdatedAt, rightUpdatedAt, leftHtml, rightHtml, onClose }: { open: boolean, leftTitle: string, rightTitle: string, leftUpdatedAt?: string, rightUpdatedAt?: string, leftHtml: string, rightHtml: string, onClose: () => void }) {
  if (!open) return null
  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/40 flex items-start justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-6xl rounded-lg bg-white shadow-xl border-2 border-petroleo-600 overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Comparação de versões</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Fechar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-auto">
          <div className="p-4 border-r border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">{leftTitle}</h3>
            {leftUpdatedAt && <div className="text-xs text-gray-500 mb-2">{leftUpdatedAt}</div>}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: leftHtml || '' }} />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">{rightTitle}</h3>
            {rightUpdatedAt && <div className="text-xs text-gray-500 mb-2">{rightUpdatedAt}</div>}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: rightHtml || '' }} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
