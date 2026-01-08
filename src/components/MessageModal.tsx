import { ReactNode } from 'react'

export default function MessageModal({ open, title, message, variant = 'info', onClose, actions }: { open: boolean, title?: string, message: string, variant?: 'success' | 'error' | 'info', onClose: () => void, actions?: ReactNode }) {
  if (!open) return null
  const border = variant === 'success' ? 'border-green-600' : variant === 'error' ? 'border-red-600' : 'border-petroleo-600'
  const titleColor = variant === 'success' ? 'text-green-700' : variant === 'error' ? 'text-red-700' : 'text-petroleo-700'
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow p-6 w-full max-w-md border ${border}`}>
        {title && <h3 className={`text-lg font-semibold mb-3 ${titleColor}`}>{title}</h3>}
        <p className="text-sm text-gray-800">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          {actions}
          <button onClick={onClose} className="px-3 py-2 rounded bg-petroleo-600 text-white">OK</button>
        </div>
      </div>
    </div>
  )
}

