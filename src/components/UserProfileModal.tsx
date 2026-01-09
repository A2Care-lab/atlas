import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { UserProfile } from '../types/database'
import { supabase } from '../lib/supabase'
import { useCorporateAreas } from '../hooks/useCorporateAreas'

type EditableFields = Pick<UserProfile, 'full_name' | 'phone' | 'department' | 'avatar_url'>

interface Props {
  profile: UserProfile | null
  open: boolean
  onClose: () => void
  onSave: (changes: EditableFields) => Promise<void> | void
  anchorRef?: React.RefObject<HTMLElement>
}

export function UserProfileModal({ profile, open, onClose, onSave, anchorRef }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditableFields>({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    avatar_url: profile?.avatar_url || ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const { areas } = useCorporateAreas()
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{ top: number; left: number; width: number; arrowLeft: number }>({ top: 80, left: 0, width: 440, arrowLeft: 24 })
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      avatar_url: profile?.avatar_url || ''
    })
  }, [profile])

  useEffect(() => {
    const loadCompany = async () => {
      if (!profile?.company_id) { setCompanyName(''); return }
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .maybeSingle()
      setCompanyName((data as any)?.name || '')
    }
    loadCompany()
  }, [profile?.company_id])

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const maxW = 640
      const width = Math.min(Math.floor(vw * 0.92), maxW)
      const anchor = anchorRef?.current
      const rect = anchor?.getBoundingClientRect()
      const margin = 16
      const top = (rect?.bottom || 64) + 8
      let left = vw - width - margin
      if (rect) {
        const centerX = rect.left + rect.width / 2
        left = Math.max(margin, Math.min(centerX - width * 0.6, vw - width - margin))
        const arrowLeft = Math.max(24, Math.min(centerX - left - 8, width - 24))
        setLayout({ top, left, width, arrowLeft })
      } else {
        setLayout({ top, left, width, arrowLeft: 24 })
      }
    }
    if (open) {
      compute()
      const r = () => compute()
      window.addEventListener('resize', r)
      window.addEventListener('scroll', r, { passive: true })
      return () => {
        window.removeEventListener('resize', r)
        window.removeEventListener('scroll', r)
      }
    }
  }, [open, anchorRef])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handlePrimary = async () => {
    if (!editing) {
      setEditing(true)
      return
    }
    let avatarUrl = form.avatar_url || undefined
    if (avatarFile && profile?.id) {
      const fileExt = avatarFile.name.split('.').pop() || 'png'
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, {
        upsert: true,
        contentType: avatarFile.type || 'image/png'
      })
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = data.publicUrl
      }
    }
    await onSave({
      full_name: form.full_name || undefined,
      phone: form.phone || undefined,
      department: form.department || undefined,
      avatar_url: avatarUrl
    })
    setEditing(false)
    setAvatarFile(null)
  }

  if (!open) return null

  return (
    createPortal(
      <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000]" onClick={onClose}>
        <div
        ref={containerRef}
        className="fixed bg-white rounded-lg shadow-xl border-2 border-petroleo-600"
        style={{ top: layout.top, left: layout.left, width: layout.width }}
        onClick={(e) => e.stopPropagation()}
        >
        <div
          className="absolute bg-white rotate-45 border-2 border-petroleo-600"
          style={{ top: -8, left: layout.arrowLeft, width: 16, height: 16 }}
        />
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Perfil do Usuário</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
          <div className="p-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-sm">Avatar</span>
              )}
            </div>
            {editing && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Nome</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              disabled={!editing}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petroleo-300 disabled:bg-gray-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">E-mail</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Celular/WhatsApp</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petroleo-300 disabled:bg-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Departamento</label>
              <select
                name="department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                disabled={!editing}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petroleo-300 disabled:bg-gray-50"
              >
                <option value="">Selecionar...</option>
                {areas.filter((a) => a.status === 'active').map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Empresa</label>
            <input
              type="text"
              value={companyName || ''}
              disabled
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
            />
          </div>
          <div className="text-xs text-gray-500">Função: <span className="font-medium text-gray-700">{profile?.role || '—'}</span></div>
        </div>
          <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
            <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Fechar</button>
            <button onClick={handlePrimary} className="px-3 py-2 rounded-md bg-petroleo-600 hover:bg-petroleo-700 text-white text-sm">
              {editing ? 'Salvar' : 'Editar'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  )
}
