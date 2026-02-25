import { ReactNode } from 'react'

export default function MessageModal({ open, title, message, variant = 'info', onClose, actions, size = 'md' }: { open: boolean, title?: string, message: ReactNode, variant?: 'success' | 'error' | 'info', onClose: () => void, actions?: ReactNode, size?: 'md' | 'xl' }) {
  if (!open) return null
  const ringColor = variant === 'success' ? 'ring-emerald-500' : variant === 'error' ? 'ring-red-500' : 'ring-sky-500'
  const titleColor = variant === 'success' ? 'text-emerald-400' : variant === 'error' ? 'text-red-400' : 'text-sky-400'
  const widthClass = size === 'xl' ? 'max-w-4xl' : 'max-w-md'
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 transition-all duration-300">
      <div className={`bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 w-full ${widthClass} ring-1 ${ringColor} ring-opacity-20 transform transition-all scale-100`}>
        {title && <h3 className={`text-lg font-bold mb-3 ${titleColor}`}>{title}</h3>}
        <div className="text-sm text-gray-300 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-3 mt-6">
          {actions}
          {!actions && (
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium text-sm shadow-sm"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
