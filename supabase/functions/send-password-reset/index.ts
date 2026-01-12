import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL");

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body: { email?: string; nome?: string; fromEmail?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const { email, nome, fromEmail, redirect_to } = body;
  if (!email) {
    return new Response(JSON.stringify({ error: "Campo obrigatório: email" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const safeNome = nome ? escapeHtml(nome) : "";
  const subject = "Instruções para Redefinição de Senha";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const headerOrigin = req.headers.get('origin') || req.headers.get('referer') || ''
  const ENVIRONMENT = (Deno.env.get('ENVIRONMENT') || Deno.env.get('ENV') || '').toLowerCase();
  let baseUrl: string | undefined = APP_URL || undefined;
  if (!baseUrl) {
    if (ENVIRONMENT === 'production' || ENVIRONMENT === 'prod') {
      baseUrl = 'https://atlas.a2care.com.br';
    } else {
      try {
        const u = new URL(headerOrigin);
        baseUrl = `${u.protocol}//${u.host}`;
      } catch {
        baseUrl = 'http://localhost:5173';
      }
    }
  }
  if (!baseUrl) {
    if (ENVIRONMENT === 'production' || ENVIRONMENT === 'prod') {
      return new Response(JSON.stringify({ error: "APP_URL ausente em produção. Configure o segredo APP_URL com a URL do site." }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    baseUrl = 'http://localhost:5173';
  }
  const linkRes = await admin.auth.admin.generateLink({ type: "recovery", email } as any);
  if (linkRes.error || !linkRes.data) {
    return new Response(JSON.stringify({ error: "Falha ao gerar link de recuperação", details: linkRes.error?.message || linkRes.error }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  // Preferir link com token quando disponível; caso contrário, manter action_link retornado pelo Supabase
  const rawToken = (linkRes.data as any)?.email_otp || (linkRes.data as any)?.oob_code || (linkRes.data as any)?.token || (linkRes.data as any)?.code || "";
  let actionLink = linkRes.data?.action_link || linkRes.data?.email_otp_link || "";
  let extractedToken = "";
  try {
    const u = new URL(actionLink);
    extractedToken = u.searchParams.get("email_otp") || u.searchParams.get("oob_code") || u.searchParams.get("token") || u.searchParams.get("code") || "";
  } catch {}
  const effectiveToken = rawToken || extractedToken;
  if (effectiveToken) {
    const directBase = `${String(baseUrl).replace(/\/+$/, '')}/#/onboarding?type=recovery`;
    actionLink = `${directBase}&token=${encodeURIComponent(effectiveToken)}`;
  }
  if (!actionLink) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "recovery", email }),
      });
      const json = await resp.json();
      if (resp.ok) {
        const tk = json?.email_otp || json?.oob_code || json?.token || json?.code || rawToken || "";
        actionLink = json?.action_link || json?.email_otp_link || actionLink;
        if (tk) {
          const directBase = `${String(baseUrl).replace(/\/+$/, '')}/#/onboarding?type=recovery`;
          actionLink = `${directBase}&token=${encodeURIComponent(tk)}`;
        }
      }
    } catch (_) {}
  }
  const safeUrl = escapeHtml(actionLink);

  const html = `<!doctype html>
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
        <p>Olá${safeNome ? `, ${safeNome}` : ""}.</p>
        <p>Para alterar sua senha, clique no botão abaixo e siga as instruções na página.</p>
        <p><a class="btn" href="${safeUrl}" target="_blank" rel="noopener" style="color:#ffffff !important; text-decoration:none !important;">Alterar senha</a></p>
        <p style="margin-top:12px; color:#475569; font-size:14px;">Se não foi você quem solicitou esta alteração, ignore este e-mail.</p>
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

  const from = fromEmail ?? "ATLAS - Integridade Corporativa <atlas@a2care.com.br>";

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html,
    }),
  });

  const data = await resendRes.json();

  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: "Falha ao enviar e-mail", details: data }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
