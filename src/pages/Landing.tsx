import { Footer } from '../components/Footer'
import AtlasLogo from '../components/AtlasLogo'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MessageModal from '../components/MessageModal'

export default function Landing() {
  const navigate = useNavigate()
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)

  useEffect(() => {
    const fetchWhatsApp = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .maybeSingle()
        
        if (error) {
          console.error('Error fetching WhatsApp number:', error)
        }

        if (data?.value) {
          setWhatsappNumber(data.value)
        }
      } catch (error) {
        console.error('Unexpected error fetching WhatsApp number:', error)
      }
    }
    fetchWhatsApp()
  }, [])

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (whatsappNumber) {
      setShowWhatsAppModal(true)
    } else {
      // Fallback or navigate to onboarding if no number
      navigate('/onboarding')
    }
  }

  const confirmWhatsAppRedirect = () => {
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/\D/g, '')
      const message = encodeURIComponent("Olá, estou acessando o Atlas e gostaria de ter mais informações.")
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank')
      setShowWhatsAppModal(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-900 via-petroleo-950 to-gray-900 text-white selection:bg-petroleo-500/30 selection:text-white">
      <MessageModal
        open={showWhatsAppModal}
        title="Redirecionamento para WhatsApp"
        message="Você será direcionado para o WhatsApp para falar com nossos consultores."
        onClose={() => setShowWhatsAppModal(false)}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirmWhatsAppRedirect}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
            >
              Continuar para WhatsApp
            </button>
          </div>
        }
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(14,165,233,0.15),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.15),transparent_40%)] pointer-events-none fixed" />
      
      <header className="border-b border-white/10 bg-transparent relative z-50 backdrop-blur-sm">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AtlasLogo className="h-8 w-8 text-white" />
            <span className="text-white font-semibold text-lg tracking-tight">ATLAS</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-petroleo-600 hover:bg-petroleo-500 rounded-lg shadow-lg shadow-petroleo-900/20 border border-transparent focus:outline-none focus:ring-2 focus:ring-petroleo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
            >
              Entrar
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
              <AtlasLogo className="w-64 h-64 text-white mt-8 absolute -right-20 -top-20 opacity-20 blur-3xl" />
            </div>
          </div>
          <div className="relative w-full mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                  Canal de Denúncias <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">moderno</span> para proteger pessoas e reputações
                </h1>
                <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-2xl">
                  O ATLAS ajuda empresas a enfrentar assédio, discriminação e outras violações
                  com confidencialidade, rastreabilidade e governança. Infraestrutura segura,
                  controles de acesso e processos auditáveis para receber, tratar e analisar
                  denúncias — fortalecendo cultura, conformidade e a confiança de colaboradores
                  e stakeholders.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : "#/onboarding"}
                    onClick={handleWhatsAppClick}
                    target={whatsappNumber ? "_blank" : "_self"}
                    rel={whatsappNumber ? "noopener noreferrer" : ""}
                    className="px-6 py-3.5 rounded-lg bg-petroleo-600 text-white font-semibold hover:bg-petroleo-500 transition-all shadow-lg shadow-petroleo-900/20 hover:shadow-petroleo-500/20"
                  >
                    Começar agora
                  </a>
                  <a
                    href="#/preview/email/convite-usuario"
                    className="px-6 py-3.5 rounded-lg bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    Ver exemplo de comunicação
                  </a>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <img
                  src="/hero-office.svg"
                  alt="Equipe corporativa colaborando com ética e governança"
                  className="relative rounded-xl shadow-2xl ring-1 ring-white/10 w-full h-auto bg-gray-900/50 backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="">
          <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Confidencialidade</h3>
                <p className="text-gray-400 leading-relaxed">
                  Fluxos de relato seguros e anônimos, com opções de acompanhamento e
                  comunicação protegida entre área responsável e denunciante.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Governança</h3>
                <p className="text-gray-400 leading-relaxed">
                  Trilhas de auditoria, SLA configurável, aprovações corporativas e
                  política de não retaliação integrada ao processo.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center mb-6 group-hover:bg-sky-500/20 transition-colors">
                  <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Reputação</h3>
                <p className="text-gray-400 leading-relaxed">
                  Adoção de práticas efetivas contra assédio e discriminação reforça
                  a credibilidade da marca perante talentos, clientes e investidores.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white/5 backdrop-blur-sm border-y border-white/5">
          <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                 <div className="absolute -inset-1 bg-gradient-to-br from-petroleo-600 to-indigo-600 rounded-2xl blur opacity-20"></div>
                <img
                  src="/diversity-meeting.svg"
                  alt="Ambiente corporativo diverso e seguro"
                  className="relative rounded-xl shadow-2xl ring-1 ring-white/10 w-full h-auto bg-gray-900/50"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Por que tratar assédio com seriedade?
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  Além de obrigações legais e normativas, o combate ao assédio é essencial
                  para um ambiente saudável e produtivo. Empresas que lideram iniciativas
                  de escuta e responsabilização reduzem riscos, ampliam diversidade e
                  retenção de talentos, e constroem relações mais sólidas com a sociedade.
                </p>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <span>Conformidade com leis e boas práticas de mercado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <span>Cultura organizacional segura e inclusiva</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <span>Proteção à imagem corporativa e redução de passivos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Segurança e conformidade</h2>
              <p className="text-lg text-gray-300 mb-8">
                Práticas robustas de proteção de dados e controles corporativos para garantir confiança e integridade.
              </p>
              <ul className="space-y-6 text-gray-300">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                     <div className="w-8 h-8 rounded-full bg-petroleo-500/20 flex items-center justify-center border border-petroleo-500/30">
                        <svg className="w-4 h-4 text-petroleo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     </div>
                  </div>
                  <div>
                    <strong className="text-white block mb-1">LGPD</strong>
                    <span className="text-gray-400">Coleta mínima, finalidade definida e direitos dos titulares respeitados.</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                     <div className="w-8 h-8 rounded-full bg-petroleo-500/20 flex items-center justify-center border border-petroleo-500/30">
                        <svg className="w-4 h-4 text-petroleo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     </div>
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Confidencialidade</strong>
                    <span className="text-gray-400">Criptografia em trânsito e repouso, canais de relato protegidos.</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                     <div className="w-8 h-8 rounded-full bg-petroleo-500/20 flex items-center justify-center border border-petroleo-500/30">
                        <svg className="w-4 h-4 text-petroleo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </div>
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Governança técnica</strong>
                    <span className="text-gray-400">Acesso por papéis (RBAC), logs de auditoria, backups e monitoramento contínuo.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 border-t border-white/10">
          <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Recursos do ATLAS</h2>
              <p className="text-lg text-gray-400">
                Plataforma completa, pronta para uso corporativo e com integrações nativas.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Denúncia anônima", desc: "Formulários acessíveis e canais dedicados com acompanhamento seguro." },
                { title: "Fluxos e SLA", desc: "Etapas configuráveis, prazos e responsabilidades com trilha de auditoria." },
                { title: "Relatórios e riscos", desc: "Análises consolidadas e indicadores para decisões estratégicas." },
                { title: "Perfis e permissões", desc: "Acesso por papéis com segurança e segregação de funções." },
                { title: "Política de não retaliação", desc: "Conteúdos oficiais integrados e atualizados via API." },
                { title: "Segurança e modernidade", desc: "Controles de acesso, criptografia, monitoramento e atualizações contínuas." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <h4 className="font-semibold text-white text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <a
                href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : "#/onboarding"}
                onClick={handleWhatsAppClick}
                target={whatsappNumber ? "_blank" : "_self"}
                rel={whatsappNumber ? "noopener noreferrer" : ""}
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-petroleo-600 text-white font-semibold hover:bg-petroleo-500 transition-all shadow-lg shadow-petroleo-900/20 hover:shadow-petroleo-500/20 text-lg"
              >
                Falar com a equipe
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
