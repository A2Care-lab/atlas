import { useState } from 'react';
import MessageModal from './MessageModal';
import { HtmlModal } from './HtmlModal';
import { formatDate } from '../utils/format';
import { supabase } from '../lib/supabase';

export function Footer() {
  const [openHtml, setOpenHtml] = useState(false)
  const [html, setHtml] = useState('')
  const [version, setVersion] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [htmlTitle, setHtmlTitle] = useState<string>('')

  const handlePrivacyClick = async () => {
    setError('')
    try {
      // 1ª tentativa: nome recomendado
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

      // 2ª tentativa: variação do nome publicada
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

      const url = 'https://peuvnxfkzbewhuajdqhd.supabase.co/rest/v1/latest_documents?type=eq.Pol%C3%ADtica%20de%20Privacidade&system_name=eq.A2Care&select=*'
      const apiKey = import.meta.env.VITE_A2CARE_API_KEY as string
      const bearer = import.meta.env.VITE_A2CARE_BEARER as string
      if (apiKey && bearer) {
        const headers: Record<string, string> = {
          apikey: apiKey,
          Authorization: `Bearer ${bearer}`,
        }
        const res = await fetch(url, { headers })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Erro ${res.status}`)
        }
        const data = await res.json()
        const doc = Array.isArray(data) ? data[0] : data
        setHtml(doc?.content || '')
        setVersion(doc?.version || '')
        setLastUpdated(doc?.last_updated || '')
        setHtmlTitle('Política de Privacidade')
        setOpenHtml(true)
        return
      }

    } catch (e: any) {
      setError('Não foi possível carregar a Política de Privacidade. Verifique a função do Supabase ou as chaves de configuração.')
    }
  }

  const handleTermsClick = async () => {
    setError('')
    try {
      // 1ª tentativa: via Edge Function
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

      // 2ª tentativa: fallback direto no REST (requer vars locais)
      const url = 'https://peuvnxfkzbewhuajdqhd.supabase.co/rest/v1/latest_documents?type=eq.Termos%20de%20Uso&system_name=eq.ATLAS&select=*'
      const apiKey = import.meta.env.VITE_A2CARE_API_KEY as string
      const bearer = import.meta.env.VITE_A2CARE_BEARER as string
      if (!apiKey || !bearer) {
        throw new Error('Chaves de API não configuradas')
      }
      const headers: Record<string, string> = {
        apikey: apiKey,
        Authorization: `Bearer ${bearer}`,
      }
      const res = await fetch(url, { headers })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Erro ${res.status}`)
      }
      const data = await res.json()
      const doc = Array.isArray(data) ? data[0] : data
      setHtml(doc?.content || '')
      setVersion(doc?.version || '')
      setLastUpdated(doc?.last_updated || '')
      setHtmlTitle('Termos de Uso')
      setOpenHtml(true)
    } catch (e: any) {
      setError(`Não foi possível carregar os Termos de Uso. ${e?.message || ''}`.trim())
    }
  }

  return (
    <footer className="bg-petroleo-600 border-t border-petroleo-700">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-white/90">
        <span>© {new Date().getFullYear()} ATLAS</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrivacyClick}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-1 focus:ring-offset-petroleo-600"
          >
            Política de Privacidade
          </button>
          <button
            onClick={handleTermsClick}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-1 focus:ring-offset-petroleo-600"
          >
            Termos de Uso
          </button>
        </div>
      </div>
      <HtmlModal
        open={openHtml}
        title={htmlTitle || "Documento"}
        html={html}
        footer={lastUpdated || version ? `Atualizado em ${formatDate(lastUpdated)} – Versão ${version || '—'}` : undefined}
        onClose={() => setOpenHtml(false)}
      />
      <MessageModal
        open={!!error}
        title={"Erro"}
        message={error}
        variant="error"
        onClose={() => setError('')}
      />
    </footer>
  );
}
