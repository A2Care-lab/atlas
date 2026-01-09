import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HtmlModal } from '../components/HtmlModal'
import { Brand } from '../components/Brand'
import { Eye, EyeOff } from 'lucide-react'
import MessageModal from '../components/MessageModal'
import { formatDate } from '../utils/format'
import { supabase } from '../lib/supabase'

export default function Onboarding() {
  const { user, loading, updatePassword, updateProfile } = useAuth()
  const [type, setType] = useState<'invite'|'recovery'>('invite')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()
  const [agree, setAgree] = useState(false)
  const [openHtml, setOpenHtml] = useState(false)
  const [htmlTitle, setHtmlTitle] = useState<string>('')
  const [html, setHtml] = useState('')
  const [version, setVersion] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [docError, setDocError] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const isStrong = (p: string) => {
    if (!p || p.length < 6) return false
    const lower = /[a-z]/.test(p)
    const upper = /[A-Z]/.test(p)
    const digit = /\d/.test(p)
    const symbol = /[^A-Za-z0-9]/.test(p)
    return lower && upper && digit && symbol
  }
  const readTypeFromHash = () => {
    const h = window.location.hash || ''
    const qStr = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
    const params = new URLSearchParams(qStr)
    const t = params.get('type')
    if (t === 'recovery') return 'recovery'
    const searchParams = new URLSearchParams(window.location.search || '')
    if (searchParams.get('access_token')) return 'recovery'
    if (searchParams.get('token')) return 'recovery'
    if (/access_token=/.test(h)) return 'recovery'
    return 'invite'
  }
  const trySetSessionFromHash = async () => {
    const searchParams = new URLSearchParams(window.location.search || '')
    const access_token_q = searchParams.get('access_token') || undefined
    const refresh_token_q = searchParams.get('refresh_token') || undefined
    const h = window.location.hash || ''
    const idx = h.indexOf('#access_token=')
    const frag = idx !== -1 ? h.substring(idx + 1) : ''
    const hashParams = new URLSearchParams(frag)
    const access_token_h = hashParams.get('access_token') || undefined
    const refresh_token_h = hashParams.get('refresh_token') || undefined
    const access_token = access_token_q || access_token_h
    const refresh_token = refresh_token_q || refresh_token_h
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token })
    }
  }
  const tryVerifyTokenFromUrl = async () => {
    const searchParams = new URLSearchParams(window.location.search || '')
    const token_q = searchParams.get('token') || undefined
    const h = window.location.hash || ''
    const qStr = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
    const hashParams = new URLSearchParams(qStr)
    const token_h = hashParams.get('token') || undefined
    const token = token_q || token_h
    if (token) {
      await supabase.auth.verifyOtp({ type: 'recovery', token_hash: token } as any)
    }
  }

  useEffect(() => {
    const update = () => setType(readTypeFromHash())
    update()
    trySetSessionFromHash()
    tryVerifyTokenFromUrl()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600"></div>
      </div>
    )
  }

  // Página pública para conclusão de cadastro; não força login

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      let session = (await supabase.auth.getSession()).data.session
      if (!session) {
        await trySetSessionFromHash()
        session = (await supabase.auth.getSession()).data.session
      }
      if (!session) {
        await tryVerifyTokenFromUrl()
        session = (await supabase.auth.getSession()).data.session
      }
      if (!session) {
        throw new Error('Sessão de recuperação ausente. Abra o link enviado por e-mail para redefinir a senha. Se estiver em desenvolvimento, garanta que o domínio esteja configurado nas URLs de redirecionamento do Supabase.')
      }
      if (password && password.length >= 6 && isStrong(password)) {
        if (type === 'recovery' && password !== confirm) {
          throw new Error('As senhas não coincidem')
        }
        const { error: pwErr } = await updatePassword(password)
        if (pwErr) throw pwErr
      } else {
        throw new Error('A senha deve ter no mínimo 6 caracteres, com letras maiúsculas, minúsculas, números e símbolos.')
      }
      if (type !== 'recovery' && fullName) {
        const { error: profErr } = await updateProfile({ full_name: fullName })
        if (profErr) throw profErr
      }
      navigate(type === 'recovery' ? '/login' : '/')
    } catch (e: any) {
      setError(e?.message || 'Falha ao concluir cadastro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPrivacy = async () => {
    setDocError('')
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_privacy_policy', {
        body: { type: 'Política de Privacidade', system_name: 'A2Care' }
      })
      if (!fnError && fnData) {
        const doc = Array.isArray(fnData) ? fnData[0] : fnData
        setHtml(doc?.content || '')
        setVersion(doc?.version || '')
        setLastUpdated(doc?.last_updated || '')
        setHtmlTitle('Política de Privacidade')
        setOpenHtml(true)
        return
      }
      const { data: altData, error: altErr } = await supabase.functions.invoke('legalsdesk_privacy_policy', {
        body: { type: 'Política de Privacidade', system_name: 'A2Care' }
      })
      if (!altErr && altData) {
        const doc = Array.isArray(altData) ? altData[0] : altData
        setHtml(doc?.content || '')
        setVersion(doc?.version || '')
        setLastUpdated(doc?.last_updated || '')
        setHtmlTitle('Política de Privacidade')
        setOpenHtml(true)
        return
      }
      throw new Error('Falha ao carregar política de privacidade')
    } catch (e: any) {
      setDocError(`Não foi possível carregar a Política de Privacidade. ${e?.message || ''}`.trim())
    }
  }

  const openTerms = async () => {
    setDocError('')
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_terms_of_use', {
        body: { type: 'Termos de Uso', system_name: 'ATLAS' }
      })
      if (!fnError && fnData) {
        const doc = Array.isArray(fnData) ? fnData[0] : fnData
        setHtml(doc?.content || '')
        setVersion(doc?.version || '')
        setLastUpdated(doc?.last_updated || '')
        setHtmlTitle('Termos de Uso')
        setOpenHtml(true)
        return
      }
      throw new Error('Falha ao carregar termos de uso')
    } catch (e: any) {
      setDocError(`Não foi possível carregar os Termos de Uso. ${e?.message || ''}`.trim())
    }
  }

  const openNonRetaliation = async () => {
    setDocError('')
    try {
      const { data, error } = await supabase
        .from('politica_nao_retaliacao_versions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      const doc: any = data || {}
      setHtml(doc?.content || '')
      setVersion(doc?.version_code || '')
      setLastUpdated(doc?.updated_at || '')
      setHtmlTitle('Política de Não Retaliação')
      setOpenHtml(true)
    } catch (e: any) {
      setDocError(`Não foi possível carregar a Política de Não Retaliação. ${e?.message || ''}`.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Brand variant="teal" withText className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">{type === 'recovery' ? 'Redefinir senha' : 'Boas vindas ao ATLAS - Integridade Corporativa.'}</h1>
          <p className="mt-1 text-sm text-gray-600">{type === 'recovery' ? 'Defina uma nova senha para sua conta' : 'Conclua seu cadastro'}</p>
          <p className="mt-1 text-xs text-gray-500">{user?.email}</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {type !== 'recovery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome completo</label>
              <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Definir senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="mt-1 w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-petroleo-600" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-600">Mínimo 6 caracteres. Deve conter letras maiúsculas, minúsculas, números e símbolos.</p>
          </div>
          {type === 'recovery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirmar senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e)=>setConfirm(e.target.value)}
                  className="mt-1 w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-petroleo-500 focus:border-petroleo-500"
                  placeholder="Repita a nova senha"
                />
                <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-petroleo-600" aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showConfirm ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </button>
              </div>
              {!!confirm && confirm !== password && (
                <p className="mt-1 text-xs text-red-600">As senhas não coincidem.</p>
              )}
            </div>
          )}
          {type !== 'recovery' && (
            <>
              <div className="flex gap-3 pt-2 flex-nowrap">
                <button type="button" onClick={openPrivacy} className="px-3 py-1 rounded-lg border border-petroleo-600 text-petroleo-700 hover:bg-petroleo-50 whitespace-nowrap shrink-0">Política de Privacidade</button>
                <button type="button" onClick={openTerms} className="px-3 py-1 rounded-lg border border-petroleo-600 text-petroleo-700 hover:bg-petroleo-50 whitespace-nowrap shrink-0">Termos de Uso</button>
                <button type="button" onClick={openNonRetaliation} className="px-3 py-1 rounded-lg border border-petroleo-600 text-petroleo-700 hover:bg-petroleo-50 whitespace-nowrap shrink-0">Política de Não Retaliação</button>
              </div>
              <div className="flex items-center gap-2">
                <input id="agree" type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
                <label htmlFor="agree" className="text-xs text-gray-600">Li e concordo com a Política de Privacidade, Política de Não Retaliação e Termos de Uso</label>
              </div>
            </>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={isSubmitting || (type !== 'recovery' && !agree) || (type === 'recovery' && (!confirm || confirm !== password))} className="w-full py-2 px-4 rounded-md bg-petroleo-600 text-white hover:bg-petroleo-700 disabled:opacity-50">
            {isSubmitting ? (type === 'recovery' ? 'Alterando...' : 'Salvando...') : (type === 'recovery' ? 'Alterar senha' : 'Concluir cadastro')}
          </button>
        </form>

        <HtmlModal
          open={openHtml}
          title={htmlTitle || 'Documento'}
          html={html}
          footer={lastUpdated || version ? `Atualizado em ${formatDate(lastUpdated)} – Versão ${version || '—'}` : undefined}
          onClose={() => setOpenHtml(false)}
        />
        <MessageModal
          open={!!docError}
          title={"Erro"}
          message={docError}
          variant="error"
          onClose={() => setDocError('')}
        />
      </div>
    </div>
  )
}
