import { supabase } from '../lib/supabase';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(data: EmailData) {
  try {
    // Chamar função do Supabase para enviar email
    const { data: result, error } = await supabase
      .rpc('send_email', {
        p_to: data.to,
        p_subject: data.subject,
        p_html: data.html,
        p_text: data.text || data.html.replace(/<[^>]*>/g, ''),
      });

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateReportCreatedEmail(protocol: string, isAnonymous: boolean, name?: string): string {
  const subject = `Confirmação de abertura de denúncia – Protocolo ${protocol}`;
  const nome = name || '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    table { border-collapse:collapse; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 22px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .divider { height:1px; background:#e5e7eb; margin:16px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    @media (max-width:480px){ .header, .content, .footer { padding:20px; } h1 { font-size:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${subject}</div>
      </div>
      <div class="content">
        <h1>Sua denúncia foi devidamente registrada em nosso canal.</h1>
        <p>Olá${nome ? `, ${nome}` : ''}.</p>
        <p>Recebemos sua denúncia com sucesso.</p>
        <p>Seu protocolo é ${protocol}.</p>
        <p>Guarde este número para acompanhar ou complementar sua denúncia.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integrigade Corporativa.</p>
        <div class="divider"></div>
      </div>
      <div class="footer">Este e-mail foi enviado automaticamente pelo Canal de Denúncias.
        <div style="margin-top:6px; text-align:center">
          <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
          <span style="margin:0 6px; color:#94a3b8">|</span>
          <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generatePasswordChangeEmail(name?: string, actionUrl?: string): string {
  const subject = `Instruções para Redefinição de Senha`;
  const nome = name || '';
  const url = actionUrl || 'https://atlas.a2care.com.br';
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    table { border-collapse:collapse; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 22px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .btn { display:inline-block; background:#006D77; color:#ffffff; padding:10px 16px; border-radius:8px; text-decoration:none; font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .divider { height:1px; background:#e5e7eb; margin:16px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    @media (max-width:480px){ .header, .content, .footer { padding:20px; } h1 { font-size:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${subject}</div>
      </div>
      <div class="content">
        <h1>Redefinição de Senha</h1>
        <p>Olá${nome ? `, ${nome}` : ''}.</p>
        <p>Para alterar sua senha, clique no botão abaixo e siga as instruções na página.</p>
        <p><a class="btn" href="${url}" target="_blank" rel="noopener">Alterar senha</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Se não foi você quem solicitou esta alteração, ignore este e-mail.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integrigade Corporativa.</p>
        <div class="divider"></div>
      </div>
      <div class="footer">Este e-mail foi enviado automaticamente pelo Canal de Denúncias.
        <div style="margin-top:6px; text-align:center">
          <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
          <span style="margin:0 6px; color:#94a3b8">|</span>
          <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generateUserInviteEmail(name?: string, inviteUrl?: string, company?: string): string {
  const subject = `Convite para acesso ao sistema`;
  const nome = name || '';
  const base = (typeof window !== 'undefined' ? window.location.origin : ((import.meta as any)?.env?.DEV ? 'http://localhost:5173' : 'http://localhost:4173'))
  const cleanBase = String(base || '').replace(/\/+$/, '')
  const url = inviteUrl || `${cleanBase}/#/onboarding?type=invite`;
  const empresa = company || '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    table { border-collapse:collapse; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 22px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .btn { display:inline-block; background:#006D77; color:#ffffff; padding:10px 16px; border-radius:8px; text-decoration:none; font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .divider { height:1px; background:#e5e7eb; margin:16px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    @media (max-width:480px){ .header, .content, .footer { padding:20px; } h1 { font-size:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${subject}</div>
      </div>
      <div class="content">
        <h1>Ativação de Conta no ATLAS</h1>
        <p>Olá${nome ? `, ${nome}` : ''}.</p>
        <p>${empresa ? `Você foi convidado(a) pela ${empresa} ` : 'Você foi convidado(a) '}a se cadastrar e acessar o sistema ATLAS – Integridade Corporativa.</p>
        <p style="margin-top:12px; color:#0f172a; font-weight:600;">Importante:</p>
        <p style="margin-top:4px; color:#475569;">Realize o cadastro usando <strong>o mesmo e-mail</strong> que recebeu este convite e <strong>o mesmo nome</strong> informado no seu pré-cadastro.</p>
        <p style="margin-top:6px; color:#334155;">Para evitar inconsistências, utilize exatamente o nome exibido na saudação acima: <strong>${nome || ''}</strong>.</p>
        <p style="margin-top:6px; color:#475569;">Você poderá ajustar esses dados <strong>após concluir</strong> o cadastro.</p>
        <p style="margin-top:8px; color:#1f2937;">Clique no botão abaixo para iniciar seu cadastro.</p>
        <p><a class="btn" href="${url}" target="_blank" rel="noopener">Criar conta</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Se você não reconhece este convite, ignore este e-mail.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integrigade Corporativa.</p>
        <div class="divider"></div>
      </div>
      <div class="footer">Este e-mail foi enviado automaticamente pelo Canal de Denúncias.
        <div style="margin-top:6px; text-align:center">
          <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
          <span style="margin:0 6px; color:#94a3b8">|</span>
          <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generatePasswordRecoveryEmail(name?: string, recoveryUrl?: string): string {
  const subject = 'Recupere sua senha - ATLAS';
  const nome = name || '';
  const url = recoveryUrl || 'https://atlas.a2care.com.br';
  
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    table { border-collapse:collapse; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 22px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .btn { display:inline-block; background:#006D77; color:#ffffff; padding:10px 16px; border-radius:8px; text-decoration:none; font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .divider { height:1px; background:#e5e7eb; margin:16px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    @media (max-width:480px){ .header, .content, .footer { padding:20px; } h1 { font-size:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${subject}</div>
      </div>
      <div class="content">
        <h1>Recuperação de Senha</h1>
        <p>Olá${nome ? `, ${nome}` : ''}.</p>
        <p>Recebemos uma solicitação para recuperar sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <p><a class="btn" href="${url}" target="_blank" rel="noopener">Criar nova senha</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Este link é válido por 24 horas. Se não foi você quem solicitou esta recuperação, ignore este e-mail.</p>
        <p style="margin-top:16px; font-weight:600;">Atenciosamente, equipe ATLAS - Integridade Corporativa.</p>
        <div class="divider"></div>
      </div>
      <div class="footer">Este e-mail foi enviado automaticamente pelo Canal de Denúncias.
        <div style="margin-top:6px; text-align:center">
          <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
          <span style="margin:0 6px; color:#94a3b8">|</span>
          <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
