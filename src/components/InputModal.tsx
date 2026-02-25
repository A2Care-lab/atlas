import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  label: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onClose: () => void
}

export default function InputModal({ open, title, label, placeholder, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onClose }: Props) {
  const [value, setValue] = useState('')
  if (!open) return null
  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-start justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] shadow-2xl border border-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm border border-white/10 transition-colors">Fechar</button>
        </div>
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium text-gray-400">{label}</label>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="shadow-sm focus:ring-sky-500 focus:border-sky-500 block w-full sm:text-sm border-white/10 bg-white/5 rounded-lg text-white placeholder-gray-500"
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-white/10">
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">{cancelText}</button>
          <button
            onClick={() => { onConfirm(value.trim()); setValue(''); }}
            disabled={!value.trim()}
            className={`px-3 py-2 rounded-lg text-sm text-white font-medium transition-colors ${!value.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
          >{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
