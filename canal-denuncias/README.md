# ATLAS – Integridade Corporativa

ATLAS – Integridade Corporativa. Plataforma multi-tenant com autenticação segura, classificação automática de risco e fluxo de aprovação empresarial.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: Hooks React + Context API
- **UI**: Tailwind CSS + Lucide React Icons
- **Gráficos**: Recharts
- **Emails**: Resend API via Supabase Functions
- **PWA**: Service Worker + Manifest

## 📋 Funcionalidades

### 🔐 Autenticação & Autorização
- Login com email/senha
- 4 perfis de usuário: Admin, Gestor Corporativo, Gestor Aprovador, Usuário
- Controle de acesso baseado em empresa (multi-tenant)
- Convites por email para novos usuários

### 📊 Dashboard & KPIs
- Total de denúncias por status
- Classificação por nível de risco
- Gráficos de barras e pizza
- Filtros por período, status e risco

### 📝 Sistema de Denúncias
- **Token de Segurança**: Link único com token para cada denúncia
- **Anonimato Opcional**: Usuário pode optar por denúncia anônima
- **Formulário Estruturado**: 7 perguntas obrigatórias para classificação
- **Anexos**: Upload de arquivos (PDF, DOC, imagens)
- **Protocolo Único**: Gerado automaticamente

### 🤖 Classificação Automática de Risco
Algoritmo baseado em:
- **Tipo de situação** (conflito, assédio, fraude, etc.)
- **Risco imediato** (+40 pontos se sim)
- **Envolvimento de liderança** (+20 pontos se sim)
- **Alcance** (individual, equipe, departamento, empresa)
- **Recorrência** (primeira vez, ocorreu antes, frequente)
- **Retaliação** (+30 pontos se sim)

**Níveis de Risco:**
- Baixo: 0-29 pontos
- Moderado: 30-69 pontos
- Alto: 70-109 pontos
- Crítico: 110+ pontos

**Overrides obrigatórios:**
- Assédio sexual → mínimo ALTO
- Ameaça/violência → mínimo ALTO
- Risco imediato → mínimo ALTO
- Risco imediato + ameaça → CRÍTICO

### 🔄 Fluxo de Trabalho
1. **Abertura**: Usuário cria denúncia com token seguro
2. **Análise**: Gestor Corporativo analisa e adiciona comentários
3. **Aprovação**: Gestor Aprovador revisa e aprova/rejeita
4. **Notificação**: Email automático ao denunciante

### 📧 Sistema de Emails
- Confirmação de abertura da denúncia
- Notificação de conclusão
- Templates HTML responsivos
- Integração segura com Resend via Supabase Functions

### 📱 PWA (Progressive Web App)
- Instalável em desktop e mobile
- Funcionamento offline básico
- Ícones e manifesto configurados
- Service Worker para cache

## 🏗️ Arquitetura

### Banco de Dados
```
companies          → Empresas do sistema
user_profiles      → Perfis de usuário (extende auth.users)
invitations        → Convites de usuários
reports            → Denúncias principais
attachments        → Arquivos anexados
comments           → Comentários e andamentos
status_history     → Histórico de mudanças
report_reasons     → Motivos parametrizáveis
```

### Segurança (RLS - Row Level Security)
- Cada usuário só vê denúncias da sua empresa
- Usuários comuns só veem suas próprias denúncias
- Gestores veem todas as denúncias da empresa
- Admin tem acesso total

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Conta Supabase
- Conta Resend (para emails)

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd canal-denuncias
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Supabase**
- Crie um projeto no Supabase
- Configure as tabelas usando as migrations em `/supabase/migrations`
- Obtenha as chaves de API (anon e service_role)
- Configure as políticas RLS

4. **Configure as variáveis de ambiente**
Crie um arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
RESEND_API_KEY=sua-chave-resend
```

5. **Execute as migrations**
```bash
# As migrations são aplicadas automaticamente via Supabase CLI
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

7. **Acesse a aplicação**
```
http://localhost:5173
```

## 📖 Uso

### Primeiro Acesso (Admin)
1. Acesse `/login` 
2. Use as credenciais padrão (configure no Supabase)
3. Crie uma empresa
4. Convide usuários gestores

### Fluxo de Denúncia
1. **Usuário**: Acessa "Nova Denúncia" → Gera token → Preenche formulário
2. **Gestor Corporativo**: Acessa "Gestão de Denúncias" → Analisa → Adiciona comentários
3. **Gestor Aprovador**: Acessa "Aprovação Corporativa" → Revisa → Aprova/Rejeita

### Perfis e Permissões

| Perfil | Permissões |
|--------|------------|
| **Admin** | Tudo - todas as empresas e usuários |
| **Gestor Corporativo** | Ver todas denúncias da empresa, alterar status, comentar |
| **Gestor Aprovador** | Tudo do Gestor Corporativo + aprovar denúncias |
| **Usuário** | Criar denúncias, ver apenas as próprias |

## 🔧 Configuração de Produção

### Supabase
- Configure domínios permitidos
- Ative RLS em todas as tabelas
- Configure rate limiting
- Configure backup automático

### Resend
- Configure domínio verificado
- Configure webhooks para bounces
- Configure templates de email

### Vercel/Deploy
- Configure variáveis de ambiente
- Configure build settings
- Configure analytics

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🔒 Segurança

- Todas as senhas são hasheadas com bcrypt
- Tokens de denúncia são únicos e seguros
- Dados sensíveis são criptografados
- Conformidade com LGPD
- Auditoria de ações

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@seu-dominio.com

---

**Desenvolvido com ❤️ para promover ética e transparência corporativa.**
