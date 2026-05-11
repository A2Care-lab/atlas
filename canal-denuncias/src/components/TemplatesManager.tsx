import { useEffect, useMemo, useState } from 'react'
import { Code2, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { SystemTemplate } from '../types/database'

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<SystemTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<SystemTemplate | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [html, setHtml] = useState('')
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    setPageError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('system_templates')
        .select('id, title, html, created_at, updated_at, created_by, updated_by')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTemplates((data as SystemTemplate[]) || [])
    } catch (loadError) {
      console.error('Erro ao carregar templates', loadError)
      const message = loadError instanceof Error ? loadError.message : ''
      setPageError(
        message.includes('does not exist') || message.includes('42P01')
          ? 'A tabela de templates ainda nao existe no banco. Aplique a migracao para habilitar esta aba.'
          : 'Nao foi possivel carregar os templates do Supabase.'
      )
    } finally {
      setLoading(false)
    }
  }

  const templateCountLabel = useMemo(() => {
    return templates.length === 1 ? '1 template cadastrado' : `${templates.length} templates cadastrados`
  }, [templates])

  const resetForm = () => {
    setTitle('')
    setHtml('')
    setFormError('')
  }

  const openModal = () => {
    resetForm()
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const openEditModal = (template: SystemTemplate) => {
    setEditingTemplate(template)
    setTitle(template.title)
    setHtml(template.html)
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTemplate(null)
    setFormError('')
  }

  const handleSave = async () => {
    const normalizedTitle = title.trim()
    const normalizedHtml = html.trim()

    if (!normalizedTitle) {
      setFormError('Informe o título do template.')
      return
    }

    if (!normalizedHtml) {
      setFormError('Cole o HTML do template.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const { data: sessionData } = await supabase.auth.getUser()
      const authUserId = sessionData.user?.id || null
      const now = new Date().toISOString()

      const payload = {
        title: normalizedTitle,
        html: normalizedHtml,
        updated_by: authUserId,
        updated_at: now,
      }

      const query = editingTemplate
        ? supabase
            .from('system_templates')
            .update(payload)
            .eq('id', editingTemplate.id)
        : supabase
            .from('system_templates')
            .insert({
              ...payload,
              created_by: authUserId,
            })

      const { data, error: saveError } = await query
        .select('id, title, html, created_at, updated_at, created_by, updated_by')
        .single()

      if (saveError) throw saveError

      const savedTemplate = data as SystemTemplate
      setTemplates((current) =>
        editingTemplate
          ? current.map((item) => (item.id === editingTemplate.id ? savedTemplate : item))
          : [savedTemplate, ...current]
      )
      closeModal()
      resetForm()
    } catch (saveTemplateError) {
      console.error('Erro ao salvar template', saveTemplateError)
      setFormError('Nao foi possivel salvar o template no Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId)
    try {
      const { error: deleteError } = await supabase
        .from('system_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      setTemplates((current) => current.filter((item) => item.id !== templateId))
      setPendingDeleteId(null)
    } catch (deleteTemplateError) {
      console.error('Erro ao excluir template', deleteTemplateError)
      setPageError('Nao foi possivel excluir o template no Supabase.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-medium text-white mb-2">Templates</h2>
          <p className="text-gray-400">Cadastre templates HTML para centralizar os modelos utilizados pelo sistema.</p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          +Template
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full border border-sky-500/30 bg-sky-500/15 p-3">
            <Code2 className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Biblioteca de Templates</p>
            <p className="text-sm text-gray-400">{templateCountLabel}</p>
          </div>
        </div>

        {pageError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {pageError}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/10 px-6 py-10 text-center">
            <p className="text-base font-medium text-white">Carregando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
            <p className="text-base font-medium text-white">Nenhum template cadastrado</p>
            <p className="mt-2 text-sm text-gray-400">Use o botão +Template para adicionar um novo HTML salvo no Supabase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium text-white">{template.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Criado em {new Date(template.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                    <ActionIconButton
                      onClick={() => setPreviewTemplate(template)}
                      label="Visualizar"
                      tone="sky"
                    >
                      <Eye className="h-4 w-4" />
                    </ActionIconButton>
                    <ActionIconButton
                      onClick={() => openEditModal(template)}
                      label="Editar"
                      tone="amber"
                    >
                      <Pencil className="h-4 w-4" />
                    </ActionIconButton>
                    <ActionIconButton
                      onClick={() => setPendingDeleteId((current) => (current === template.id ? null : template.id))}
                      label="Excluir"
                      tone="red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionIconButton>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                      HTML
                    </span>
                  </div>
                </div>

                <pre className="mt-4 max-h-52 overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-4 text-xs text-sky-100 whitespace-pre-wrap break-words">
{template.html}
                </pre>

                {pendingDeleteId === template.id && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                    <p className="text-sm text-red-200">Confirmar exclusao deste template?</p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
                        disabled={deletingId === template.id}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={deletingId === template.id}
                      >
                        {deletingId === template.id ? 'Excluindo...' : 'Confirmar exclusao'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f172a] p-6 text-white shadow-2xl">
            <h3 className="mb-1 text-lg font-semibold">{editingTemplate ? 'Editar Template' : 'Novo Template'}</h3>
            <p className="mb-6 text-sm text-gray-400">
              {editingTemplate
                ? 'Atualize o titulo e o HTML do template salvo no Supabase.'
                : 'Informe o título e cole o HTML completo do template para salvar no Supabase.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Convite de Usuário"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">HTML do template</label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<html>...</html>"
                  rows={14}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Salvando...' : editingTemplate ? 'Salvar Alteracoes' : 'Salvar Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-[#0f172a] p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Visualizar Template</h3>
                <p className="text-sm text-gray-400">{previewTemplate.title}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-white">
              <iframe
                title={`Preview ${previewTemplate.title}`}
                srcDoc={previewTemplate.html}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionIconButton({
  onClick,
  label,
  tone,
  children,
}: {
  onClick: () => void
  label: string
  tone: 'sky' | 'amber' | 'red'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-500/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
      : tone === 'amber'
        ? 'border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        : 'border-red-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/25'

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${toneClass}`}
        title={label}
        aria-label={label}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}
