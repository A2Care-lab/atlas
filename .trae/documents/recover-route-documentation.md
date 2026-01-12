# Documentação da Rota /recover - Recuperação de Senha

## 1. Visão Geral

A rota `/recover` implementa o fluxo de recuperação de senha por token, permitindo que usuários redefinam suas senhas de forma segura através de um link enviado por email.

## 2. Fluxo de Recuperação de Senha

### 2.1 Etapas do Processo

```mermaid
graph TD
    A[Página Login] -->|"Clicou em 'Esqueceu senha?'"| B[/recover]
    B --> C{Email válido?}
    C -->|Sim| D[Enviar email com token]
    C -->|Não| E[Exibir erro de email]
    D --> F[Email enviado com sucesso]
    F --> G[Usuário acessa link do email]
    G --> H[/recover/:token]
    H --> I{Token válido?}
    I -->|Sim| J[Formulário nova senha]
    I -->|Não| K[Token inválido/expirado]
    J --> L{Senhas conferem?}
    L -->|Sim| M[Atualizar senha]
    L -->|Não| N[Erro de confirmação]
    M --> O[Redirecionar para login]
```

## 3. Componentes e Validações

### 3.1 Página /recover (Solicitação)

**Campos do formulário:**

* Email (obrigatório)

  * Validação: Formato de email válido

  * Validação: Email deve existir na base de dados

**Comportamento UX:**

* Loading state durante envio

* Mensagem de sucesso: "Email de recuperação enviado! Verifique sua caixa de entrada"

* Link para voltar ao login

* Previne spam: Rate limiting (máximo 3 tentativas por hora)

### 3.2 Página /recover/:token (Redefinição)

**Validações do token:**

* Token deve existir na base de dados

* Token não pode estar expirado (válido por 24 horas)

* Token não pode ter sido usado

**Campos do formulário:**

* Nova senha (obrigatório)

  * Mínimo 8 caracteres

  * Deve conter letras e números

  * Caracteres especiais permitidos

* Confirmar senha (obrigatório)

  * Deve ser idêntica à nova senha

## 4. Design da Interface

### 4.1 Estilo Visual

* **Layout:** Centralizado, card-based

* **Cores:**

  * Primária: Azul (#2563EB)

  * Fundo: Branco (#FFFFFF)

  * Texto: Cinza escuro (#374151)

* **Tipografia:**

  * Títulos: 24px, font-weight: 600

  * Textos: 16px, font-weight: 400

* **Botões:** Rounded corners (8px), hover effects

### 4.2 Elementos de UX

**Página de Solicitação:**

* Header com logo

* Card central com:

  * Título "Recuperar Senha"

  * Subtítulo "Digite seu email para receber instruções"

  * Input de email com ícone 📧

  * Botão primário "Enviar instruções"

  * Link secundário "Voltar ao login"

**Página de Redefinição:**

* Header com logo

* Card central com:

  * Título "Criar Nova Senha"

  * Indicador de força da senha em tempo real

  * Input de senha com toggle de visibilidade 👁️

  * Input de confirmação de senha

  * Botão primário "Redefinir senha"

  * Mensagem de tempo restante do token

## 5. Estados e Feedback

### 5.1 Estados de Loading

* Spinner durante envio de email

* Spinner durante redefinição de senha

* Desabilitar botões durante processamento

### 5.2 Mensagens de Erro

```
Email inválido: "Por favor, insira um email válido"
Email não encontrado: "Email não cadastrado"
Token inválido: "Link expirado ou inválido"
Senha fraca: "Senha deve ter pelo menos 8 caracteres"
Senhas diferentes: "As senhas não conferem"
```

### 5.3 Mensagens de Sucesso

```
Email enviado: "Verifique seu email para redefinir sua senha"
Senha alterada: "Senha redefinida com sucesso!"
```

## 6. Segurança

### 6.1 Medidas Implementadas

* Tokens únicos e aleatórios (UUID v4)

* Expiração de token: 24 horas

* Hash de senha com bcrypt/bcryptjs

* Rate limiting por IP

* HTTPS obrigatório

* Sanitização de inputs

### 6.2 Armazenamento de Tokens

```sql
-- Estrutura sugerida para tokens
create table password_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text unique not null,
  used boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Índices para performance
create index idx_recovery_tokens_user_id on password_recovery_tokens(user_id);
create index idx_recovery_tokens_token on password_recovery_tokens(token);
create index idx_recovery_tokens_expires on password_recovery_tokens(expires_at);
```

## 7. Integração com Email

### 7.1 Template de Email

**Assunto:** "Recupere sua senha - \[Nome do Sistema]"
**Conteúdo:**

* Saudação personalizada

* Texto explicativo breve

* Botão de ação principal

* Link alternativo em texto

* Validade do link (24h)

* Informações de segurança

### 7.2 Serviço de Email

Recomenda-se usar:

* Supabase Edge Functions + Resend

* SendGrid

* AWS SES

* ou serviço similar

## 8. Testes Recomendados

### 8.1 Casos de Teste

1. Email válido existe → Sucesso
2. Email inválido → Erro de validação
3. Email não cadastrado → Mensagem genérica de segurança
4. Token válido → Acesso ao formulário
5. Token expirado → Redirecionamento com erro
6. Token já usado → Redirecionamento com erro
7. Senhas não conferem → Erro de validação
8. Rate limiting → Bloqueio temporário

### 8.2 Testes de UX

* Navegação entre páginas

* Responsividade mobile

* Acessibilidade (leitores de tela)

* Performance de carregamento

* Feedback visual adequado

