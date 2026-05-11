import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HtmlModal } from '../components/HtmlModal'
import AtlasLogo from '../components/AtlasLogo'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import MessageModal from '../components/MessageModal'
import { formatDate } from '../utils/format'
import { supabase } from '../lib/supabase'
import PasswordRequirements from '../components/PasswordRequirements'
import { isPasswordStrong } from '../utils/passwordRequirements'

type InviteInfo = {
  email: string
  full_name?: string | null
  role?: string | null
  company_id?: string | null
  company_name?: string | null
  expires_at?: string | null
}

export default function Onboarding() {
  const { user, loading, updatePassword, signIn } = useAuth()
  const [type, setType] = useState<'invite'|'recovery'>('invite')
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
  const [privacyVersion, setPrivacyVersion] = useState<string>('')
  const [termsVersion, setTermsVersion] = useState<string>('')
  const [nonRetaliationVersion, setNonRetaliationVersion] = useState<string>('')
  const [docError, setDocError] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteData, setInviteData] = useState<InviteInfo | null>(null)
  const [successRedirectPath, setSuccessRedirectPath] = useState<string | null>(null)
  const passwordsMatch = Boolean(password) && password === confirm
  const readTypeFromHash = () => {
    const searchParams = new URLSearchParams(window.location.search || '')
    const typeParam = searchParams.get('type')
    if (typeParam === 'recovery') return 'recovery'
    if (typeParam === 'invite') return 'invite'
    const h = window.location.hash || ''
    let qStr = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
    if (qStr.includes('#')) qStr = qStr.split('#')[0]
    const params = new URLSearchParams(qStr)
    const t = params.get('type')
    if (t === 'recovery') return 'recovery'
    if (t === 'invite') return 'invite'
    return 'invite'
  }
  const resolveVerifyType = (rawType: string): 'recovery' | 'invite' | 'magiclink' | 'signup' => {
    const normalizedType = (rawType || '').toLowerCase()
    if (normalizedType === 'recovery') return 'recovery'
    if (normalizedType === 'magiclink') return 'magiclink'
    if (normalizedType === 'signup') return 'signup'
    return 'invite'
  }
  const readAuthParams = () => {
    const searchParams = new URLSearchParams(window.location.search || '')
    const h = window.location.hash || ''
    const idx = h.indexOf('#access_token=')
    const frag = idx !== -1 ? h.substring(idx + 1) : ''
    const hashTokenParams = new URLSearchParams(frag)
    let routeQuery = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
    if (routeQuery.includes('#')) routeQuery = routeQuery.split('#')[0]
    const routeParams = new URLSearchParams(routeQuery)
    const accessToken = searchParams.get('access_token') || hashTokenParams.get('access_token') || undefined
    const refreshToken = searchParams.get('refresh_token') || hashTokenParams.get('refresh_token') || undefined
    const tokenHash =
      searchParams.get('token_hash') ||
      searchParams.get('token') ||
      routeParams.get('token_hash') ||
      routeParams.get('token') ||
      hashTokenParams.get('token_hash') ||
      hashTokenParams.get('token') ||
      undefined
    const code =
      searchParams.get('code') ||
      routeParams.get('code') ||
      hashTokenParams.get('code') ||
      undefined
    const rawType =
      searchParams.get('auth_type') ||
      routeParams.get('auth_type') ||
      hashTokenParams.get('auth_type') ||
      searchParams.get('type') ||
      routeParams.get('type') ||
      hashTokenParams.get('type') ||
      readTypeFromHash()
    return {
      accessToken,
      refreshToken,
      tokenHash,
      code,
      rawType,
      hasAuthPayload: Boolean(accessToken || refreshToken || tokenHash || code),
    }
  }
  const readInviteToken = () => {
    const searchParams = new URLSearchParams(window.location.search || '')
    const h = window.location.hash || ''
    let routeQuery = h.includes('?') ? h.substring(h.indexOf('?') + 1) : ''
    if (routeQuery.includes('#')) routeQuery = routeQuery.split('#')[0]
    const routeParams = new URLSearchParams(routeQuery)
    return (
      searchParams.get('invite_token') ||
      routeParams.get('invite_token') ||
      undefined
    )
  }
  const bootstrapSessionFromUrl = async () => {
    const { accessToken, refreshToken, tokenHash, code, rawType, hasAuthPayload } = readAuthParams()
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      if (error) throw error
      return data.session || (await supabase.auth.getSession()).data.session || null
    }
    if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: resolveVerifyType(rawType),
        token_hash: tokenHash,
      } as any)
      if (error) throw error
      const session = data?.session || (await supabase.auth.getSession()).data.session || null
      if (!session) {
        throw new Error('Nao foi possivel validar o link de convite. Solicite um novo convite.')
      }
      if (data?.session?.access_token && data?.session?.refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (setSessionError) throw setSessionError
      }
      return session
    }
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      const session = data?.session || (await supabase.auth.getSession()).data.session || null
      if (!session) {
        throw new Error('Nao foi possivel validar o link de convite. Solicite um novo convite.')
      }
      return session
    }
    if (!hasAuthPayload) {
      return (await supabase.auth.getSession()).data.session || null
    }
    return null
  }
  const resolveInvite = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('user-invite', {
      body: {
        action: 'resolve',
        token,
      }
    })
    if (error) throw error
    const invite = (data as any)?.invite
    if (!invite?.email) {
      throw new Error('Link de convite invalido, expirado ou ja utilizado. Solicite um novo convite.')
    }
    setInviteData(invite)
  }

  useEffect(() => {
    let cancelled = false
    const update = () => setType(readTypeFromHash())
    update()
    void (async () => {
      try {
        setError('')
        const nextType = readTypeFromHash()
        if (nextType === 'invite') {
          const inviteToken = readInviteToken()
          if (!inviteToken) {
            throw new Error('Link de convite invalido, expirado ou ja utilizado. Solicite um novo convite.')
          }
          setInviteLoading(true)
          await resolveInvite(inviteToken)
        } else {
          setInviteData(null)
          await bootstrapSessionFromUrl()
        }
      } catch (e: any) {
        if (!cancelled) {
          const message = String(e?.message || '')
          setError(
            /expired|invalid|token|otp|used|flow state/i.test(message)
              ? 'Link de convite invalido, expirado ou ja utilizado. Solicite um novo convite.'
              : (message || 'Falha ao validar o link de convite.')
          )
        }
      } finally {
        if (!cancelled) {
          setInviteLoading(false)
        }
      }
      try {
        const t = readTypeFromHash()
        const { hasAuthPayload } = readAuthParams()
        if (!hasAuthPayload && t === 'recovery') {
          window.location.hash = '#/login'
          return
        }
      } catch {}
    })()
    window.addEventListener('hashchange', update)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', update)
    }
  }, [])

  useEffect(() => {
    if (!successRedirectPath) return

    const timer = window.setTimeout(() => {
      navigate(successRedirectPath, { replace: true })
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [navigate, successRedirectPath])

  if (loading || inviteLoading) {
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
      if (type === 'invite') {
        const inviteToken = readInviteToken()
        if (!inviteToken) {
          throw new Error('Link de convite invalido, expirado ou ja utilizado. Solicite um novo convite.')
        }
        if (!inviteData?.email) {
          throw new Error('Nao foi possivel carregar os dados do convite. Solicite um novo convite.')
        }
        if (password && isPasswordStrong(password)) {
          if (password !== confirm) {
            throw new Error('As senhas não coincidem')
          }
        } else {
          throw new Error('A senha deve ter no minimo 6 caracteres, com letras maiusculas, minusculas, numeros e simbolos.')
        }
        if (!agree) {
          throw new Error('E necessario aceitar as politicas e termos para concluir o cadastro.')
        }
        const getPrivacyVersion = async (): Promise<string> => {
          if (privacyVersion) return privacyVersion
          try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_privacy_policy', { body: { type: 'Política de Privacidade', system_name: 'A2Care' } })
            if (!fnError && fnData) {
              const doc = Array.isArray(fnData) ? fnData[0] : fnData
              return doc?.version || ''
            }
            const { data: altData, error: altErr } = await supabase.functions.invoke('legalsdesk_privacy_policy', { body: { type: 'Política de Privacidade', system_name: 'A2Care' } })
            if (!altErr && altData) {
              const doc = Array.isArray(altData) ? altData[0] : altData
              return doc?.version || ''
            }
          } catch {}
          return ''
        }
        const getTermsVersion = async (): Promise<string> => {
          if (termsVersion) return termsVersion
          try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_terms_of_use', { body: { type: 'Termos de Uso', system_name: 'ATLAS' } })
            if (!fnError && fnData) {
              const doc = Array.isArray(fnData) ? fnData[0] : fnData
              return doc?.version || ''
            }
          } catch {}
          return ''
        }
        const getNonRetaliationVersion = async (): Promise<string> => {
          if (nonRetaliationVersion) return nonRetaliationVersion
          try {
            const { data, error } = await supabase
              .from('politica_nao_retaliacao_versions')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            if (!error && data) {
              const doc: any = data
              return doc?.version_code || ''
            }
          } catch {}
          return ''
        }
        const [pv, tv, nrv] = await Promise.all([
          getPrivacyVersion(),
          getTermsVersion(),
          getNonRetaliationVersion(),
        ])
        const { data, error } = await supabase.functions.invoke('user-invite', {
          body: {
            action: 'accept',
            token: inviteToken,
            password,
            agree: true,
            privacyVersion: pv,
            termsVersion: tv,
            nonRetaliationVersion: nrv,
          }
        })
        if (error) throw error
        const loginEmail = (data as any)?.email || inviteData.email
        const { error: signInError } = await signIn(loginEmail, password)
        if (signInError) throw signInError
        setSuccessRedirectPath('/dashboard')
        return
      }
      let session = (await supabase.auth.getSession()).data.session
      if (!session) {
        session = await bootstrapSessionFromUrl()
      }
      const requireSession = true
      if (!session && requireSession) {
        throw new Error('Sessão ausente. Abra o link de convite enviado por e-mail para concluir o cadastro e definir sua senha. Se estiver em desenvolvimento, garanta que o domínio esteja configurado nas URLs de redirecionamento do Supabase.')
      }
      if (password && isPasswordStrong(password)) {
        if (password !== confirm) {
          throw new Error('As senhas não coincidem')
        }
        const { error: pwErr } = await updatePassword(password)
        if (pwErr) throw pwErr
      } else {
        throw new Error('A senha deve ter no minimo 6 caracteres, com letras maiusculas, minusculas, numeros e simbolos.')
      }
      if (!session?.user) { throw new Error('Sessão ausente') }
      const now = new Date().toISOString()
      const email = session.user.email || ''
      const inv = await supabase
        .from('invitations')
        .select('id, role, company_id')
        .eq('email', email)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const invited = (!inv.error && inv.data) ? (inv.data as any) : null

      if (invited) {
        const changes: any = { role: invited.role, company_id: invited.company_id, is_active: true }
        if (agree) { changes.accepted_terms = true; changes.terms_accepted_at = now }
        await supabase
          .from('user_profiles')
          .update(changes)
          .eq('id', session.user.id)
        try {
          await supabase.auth.updateUser({ data: { role: invited.role, company_id: invited.company_id } } as any)
        } catch (_) {}
        if (agree) {
          await supabase
            .from('invitations')
            .update({ accepted_at: now })
            .eq('id', invited.id)
        }
      }

      if (type !== 'recovery' || invited) {
        if (agree) {
          let companyName = ''
          let companyId = invited?.company_id as string | undefined
          if (!companyId) {
            try {
              const { data: prof } = await supabase
                .from('user_profiles')
                .select('company_id')
                .eq('id', session.user.id)
                .maybeSingle()
              companyId = (prof as any)?.company_id || undefined
            } catch (_) {}
          }
          if (companyId) {
            try {
              const { data: comp } = await supabase
                .from('companies')
                .select('name')
                .eq('id', companyId)
                .maybeSingle()
              companyName = (comp as any)?.name || ''
            } catch (_) {}
          }
          // Garantir versões vigentes mesmo sem abrir os documentos
          const getPrivacyVersion = async (): Promise<string> => {
            if (privacyVersion) return privacyVersion
            try {
              const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_privacy_policy', { body: { type: 'Política de Privacidade', system_name: 'A2Care' } })
              if (!fnError && fnData) {
                const doc = Array.isArray(fnData) ? fnData[0] : fnData
                return doc?.version || ''
              }
              const { data: altData, error: altErr } = await supabase.functions.invoke('legalsdesk_privacy_policy', { body: { type: 'Política de Privacidade', system_name: 'A2Care' } })
              if (!altErr && altData) {
                const doc = Array.isArray(altData) ? altData[0] : altData
                return doc?.version || ''
              }
            } catch {}
            return ''
          }
          const getTermsVersion = async (): Promise<string> => {
            if (termsVersion) return termsVersion
            try {
              const { data: fnData, error: fnError } = await supabase.functions.invoke('legaldesk_terms_of_use', { body: { type: 'Termos de Uso', system_name: 'ATLAS' } })
              if (!fnError && fnData) {
                const doc = Array.isArray(fnData) ? fnData[0] : fnData
                return doc?.version || ''
              }
            } catch {}
            return ''
          }
          const getNonRetaliationVersion = async (): Promise<string> => {
            if (nonRetaliationVersion) return nonRetaliationVersion
            try {
              const { data, error } = await supabase
                .from('politica_nao_retaliacao_versions')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()
              if (!error && data) {
                const doc: any = data
                return doc?.version_code || ''
              }
            } catch {}
            return ''
          }

          const [pv, tv, nrv] = await Promise.all([
            getPrivacyVersion(),
            getTermsVersion(),
            getNonRetaliationVersion(),
          ])

          const { error: taErr } = await supabase
            .from('terms_acceptances')
            .insert({
              user_id: session.user.id,
              full_name: (session.user.user_metadata?.full_name as string) || '',
              email,
              accepted_at: now,
              company_name: companyName || '',
              privacy_version: pv,
              terms_version: tv,
              non_retaliation_version: nrv,
            })
          if (taErr) throw taErr
        }
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
        setPrivacyVersion(doc?.version || '')
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
        setPrivacyVersion(doc?.version || '')
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
        setTermsVersion(doc?.version || '')
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
      setNonRetaliationVersion(doc?.version_code || '')
      setHtmlTitle('Política de Não Retaliação')
      setOpenHtml(true)
    } catch (e: any) {
      setDocError(`Não foi possível carregar a Política de Não Retaliação. ${e?.message || ''}`.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-petroleo-950 to-gray-900 py-12 px-4 sm:px-6 lg:px-8 selection:bg-petroleo-500/30 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(14,165,233,0.15),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.15),transparent_40%)] pointer-events-none fixed" />
      
      <div className="max-w-2xl w-full space-y-6 bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center gap-3 mb-6">
            <AtlasLogo className="h-16 w-16 text-white" />
            <span className="text-2xl font-bold text-white tracking-widest">ATLAS</span>
          </div>
          <h1 className="text-2xl font-bold text-white whitespace-nowrap">{type === 'recovery' ? 'Redefinir senha' : 'Boas vindas ao ATLAS - Integridade Corporativa.'}</h1>
          <p className="mt-2 text-sm text-gray-400">{type === 'recovery' ? 'Defina uma nova senha para sua conta' : 'Para concluir seu cadastro, crie uma senha e aceite nossas políticas e termos.'}</p>
          <p className="mt-1 text-xs text-gray-500 font-mono bg-white/5 inline-block px-2 py-1 rounded border border-white/5">{type === 'invite' ? inviteData?.email : user?.email}</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-300">Definir senha</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="w-full pl-3 pr-12 py-2.5 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-petroleo-500 focus:border-transparent transition-all"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <PasswordRequirements password={password} className="mt-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Confirmar senha</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e)=>setConfirm(e.target.value)}
                className="w-full pl-3 pr-12 py-2.5 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-petroleo-500 focus:border-transparent transition-all"
                placeholder={type === 'recovery' ? 'Repita a nova senha' : 'Repita a senha'}
              />
              <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors" aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}>
                {showConfirm ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            {passwordsMatch && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400 shadow-sm shadow-green-500/10">
                <CheckCircle2 className="h-3.5 w-3.5" />
                As senhas coincidem.
              </p>
            )}
            {!!confirm && confirm !== password && (
              <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                As senhas não coincidem.
              </p>
            )}
          </div>
          {type !== 'recovery' && (
            <>
              <div className="flex gap-3 pt-2 flex-wrap sm:flex-nowrap">
                <button type="button" onClick={openPrivacy} className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white text-sm transition-colors whitespace-nowrap">Política de Privacidade</button>
                <button type="button" onClick={openTerms} className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white text-sm transition-colors whitespace-nowrap">Termos de Uso</button>
                <button type="button" onClick={openNonRetaliation} className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white text-sm transition-colors whitespace-nowrap">Política de Não Retaliação</button>
              </div>
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input 
                    id="agree" 
                    type="checkbox" 
                    checked={agree} 
                    onChange={(e)=>setAgree(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-gray-900/50 text-petroleo-600 focus:ring-petroleo-500 focus:ring-offset-gray-900"
                  />
                </div>
                <label htmlFor="agree" className="text-sm text-gray-400 select-none">
                  Li e concordo com a Política de Privacidade, Política de Não Retaliação e Termos de Uso
                </label>
              </div>
            </>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">{error}</div>
          )}
          <button 
            type="submit" 
            disabled={
              isSubmitting ||
              (type !== 'recovery' && !agree) ||
              !isPasswordStrong(password) ||
              !passwordsMatch
            }
            className="w-full py-3 px-4 rounded-lg bg-petroleo-600 text-white font-medium hover:bg-petroleo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-petroleo-900/20 hover:shadow-petroleo-500/20 mt-4"
          >
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
        <MessageModal
          open={!!successRedirectPath}
          title="Cadastro concluído"
          message={
            <>
              <p>Seu cadastro foi concluído com sucesso.</p>
              <p className="mt-2 text-xs text-gray-400">Você será direcionado automaticamente para a tela inicial do sistema.</p>
            </>
          }
          variant="success"
          onClose={() => {
            if (successRedirectPath) {
              navigate(successRedirectPath, { replace: true })
            }
          }}
          actions={
            <button
              onClick={() => {
                if (successRedirectPath) {
                  navigate(successRedirectPath, { replace: true })
                }
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
            >
              Ir para o sistema
            </button>
          }
        />
      </div>
    </div>
  )
}
