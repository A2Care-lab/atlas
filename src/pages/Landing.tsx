import { Footer } from '../components/Footer'
import AtlasLogo from '../components/AtlasLogo'
import { Link, useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-petroleo-100 bg-petroleo-50 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/atlas-icon.svg" alt="ATLAS" className="h-8 w-8" />
            <span className="text-petroleo-800 font-semibold">ATLAS</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-petroleo-600 hover:bg-petroleo-700 rounded-lg shadow-sm border border-petroleo-700 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-1 focus:ring-offset-petroleo-50"
            >
              Entrar
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-petroleo-600 to-petroleo-700 text-white">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AtlasLogo className="w-64 h-64 text-white mt-8" />
            </div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Canal de Denúncias moderno para proteger pessoas e reputações
                </h1>
                <p className="mt-4 text-base sm:text-lg text-white/90">
                  O ATLAS ajuda empresas a enfrentar assédio, discriminação e outras violações
                  com confidencialidade, rastreabilidade e governança. Infraestrutura segura,
                  controles de acesso, e processos auditáveis para receber, tratar e analisar
                  denúncias — fortalecendo cultura, conformidade e a confiança de colaboradores
                  e stakeholders.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#/onboarding"
                    className="px-5 py-3 rounded-lg bg-white text-petroleo-700 font-semibold hover:bg-papel"
                  >
                    Começar agora
                  </a>
                  <a
                    href="#/preview/email/convite-usuario"
                    className="px-5 py-3 rounded-lg bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20"
                  >
                    Ver exemplo de comunicação
                  </a>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/hero-office.svg"
                  alt="Equipe corporativa colaborando com ética e governança"
                  className="rounded-xl shadow-2xl ring-1 ring-white/20 w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-petroleo-100 bg-petroleo-50/50">
                <h3 className="text-lg font-semibold text-petroleo-800">Confidencialidade</h3>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Fluxos de relato seguros e anônimos, com opções de acompanhamento e
                  comunicação protegida entre área responsável e denunciante.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100 bg-petroleo-50/50">
                <h3 className="text-lg font-semibold text-petroleo-800">Governança</h3>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Trilhas de auditoria, SLA configurável, aprovações corporativas e
                  política de não retaliação integrada ao processo.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100 bg-petroleo-50/50">
                <h3 className="text-lg font-semibold text-petroleo-800">Reputação</h3>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Adoção de práticas efetivas contra assédio e discriminação reforça
                  a credibilidade da marca perante talentos, clientes e investidores.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-petroleo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <img
                  src="/diversity-meeting.svg"
                  alt="Ambiente corporativo diverso e seguro"
                  className="rounded-xl shadow-md ring-1 ring-petroleo-200"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-petroleo-800">
                  Por que tratar assédio com seriedade?
                </h2>
                <p className="mt-4 text-petroleo-900/80">
                  Além de obrigações legais e normativas, o combate ao assédio é essencial
                  para um ambiente saudável e produtivo. Empresas que lideram iniciativas
                  de escuta e responsabilização reduzem riscos, ampliam diversidade e
                  retenção de talentos, e constroem relações mais sólidas com a sociedade.
                </p>
                <ul className="mt-6 space-y-2 text-petroleo-900/80">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                    Conformidade com leis e boas práticas de mercado
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                    Cultura organizacional segura e inclusiva
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                    Proteção à imagem corporativa e redução de passivos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-petroleo-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-petroleo-800">Segurança e conformidade</h2>
              <p className="mt-3 text-petroleo-900/80">
                Práticas robustas de proteção de dados e controles corporativos para garantir confiança e integridade.
              </p>
              <ul className="mt-6 space-y-3 text-petroleo-900/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                  LGPD: coleta mínima, finalidade definida e direitos dos titulares respeitados.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                  Confidencialidade: criptografia em trânsito e repouso, canais de relato protegidos.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block w-2 h-2 rounded-full bg-petroleo-600" />
                  Governança técnica: acesso por papéis (RBAC), logs de auditoria, backups e monitoramento contínuo.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-petroleo-800">Recursos do ATLAS</h2>
              <p className="mt-3 text-petroleo-900/80">
                Plataforma completa, pronta para uso corporativo e com integrações nativas.
              </p>
            </div>
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Denúncia anônima</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Formulários acessíveis e canais dedicados com acompanhamento seguro.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Fluxos e SLA</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Etapas configuráveis, prazos e responsabilidades com trilha de auditoria.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Relatórios e riscos</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Análises consolidadas e indicadores para decisões estratégicas.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Perfis e permissões</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Acesso por papéis com segurança e segregação de funções.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Política de não retaliação</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Conteúdos oficiais integrados e atualizados via API.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-petroleo-100">
                <h4 className="font-semibold text-petroleo-800">Segurança e modernidade</h4>
                <p className="mt-2 text-sm text-petroleo-900/80">
                  Controles de acesso, criptografia, monitoramento e atualizações contínuas,
                  garantindo confiabilidade e proteção de dados.
                </p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <a
                href="#/onboarding"
                className="px-6 py-3 rounded-lg bg-petroleo-600 text-white font-semibold hover:bg-petroleo-700"
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
