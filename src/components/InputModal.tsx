import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function InputModal({ open, title, label, placeholder, initialValue = '', confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onClose }: { open: boolean, title: string, label: string, placeholder?: string, initialValue?: string, confirmText?: string, cancelText?: string, onConfirm: (value: string) => void, onClose: () => void }) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => { if (open) setValue(initialValue) }, [open, initialValue])
  if (!open) return null
  return createPortal(
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000] bg-black/40 flex items-start justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border-2 border-petroleo-600 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Fechar</button>
        </div>
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea rows={4} value={value} onChange={(e)=>setValue(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-800">{cancelText}</button>
          <button onClick={()=>{ if (value.trim()) onConfirm(value.trim()) }} className={`px-4 py-2 rounded-md text-sm text-white ${value.trim() ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'}`}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

