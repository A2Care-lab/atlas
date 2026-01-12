import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body: { email?: string; nome?: string; empresa?: string; perfil?: string; fromEmail?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const { email, nome, empresa, perfil, fromEmail, redirect_to } = body;
  if (!email) {
    return new Response(JSON.stringify({ error: "Campo obrigatório: email" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const subject = "Convite para acesso ao sistema";
  const safeNome = escapeHtml(nome || "");
  const safeEmpresa = escapeHtml(empresa || "");
  const safePerfil = escapeHtml(perfil || "");

  // Geração do link de cadastro (sem e-mail automático do Supabase)
  const ENVIRONMENT = (Deno.env.get('ENVIRONMENT') || Deno.env.get('ENV') || '').toLowerCase();
  let baseUrl = redirect_to || APP_URL;
  if (!baseUrl) {
    if (ENVIRONMENT === 'production' || ENVIRONMENT === 'prod') {
      return new Response(JSON.stringify({ error: "APP_URL ausente em produção. Configure o segredo APP_URL com a URL do site." }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    baseUrl = 'http://localhost:5173';
  }
  const redirectTarget = `${String(baseUrl).replace(/\/+$/,'')}/?go=${encodeURIComponent('/onboarding')}&type=invite`;
  let currentType: "invite" | "recovery" = "invite";
  let linkRes = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: redirectTarget,
    },
    data: { full_name: nome || "", company: empresa || "", role: perfil || "" },
  } as any);
  // Fallback via REST se SDK falhar
  if (linkRes.error || !linkRes.data) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "invite",
          email,
          redirect_to: redirectTarget,
          data: { full_name: nome || "", company: empresa || "", role: perfil || "" },
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        if (json?.error_code === "email_exists" || /already been registered/i.test(String(json?.msg))) {
          currentType = "recovery";
          const rec = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: redirectTarget } } as any);
          if (rec.error || !rec.data) {
            const r2 = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ type: "recovery", email, redirect_to: redirectTarget }),
        });
            const j2 = await r2.json();
            if (!r2.ok) {
              return new Response(JSON.stringify({ stage: "generate_link_rest", error: "Falha ao gerar link de recuperação", details: j2 }), {
                status: 409,
                headers: { ...corsHeaders, "content-type": "application/json" },
              });
            }
            linkRes = { data: j2, error: null } as any;
          } else {
            linkRes = rec as any;
          }
        } else {
          return new Response(JSON.stringify({ stage: "generate_link_rest", error: "Falha ao gerar link", details: json }), {
            status: 502,
            headers: { ...corsHeaders, "content-type": "application/json" },
          });
        }
      } else {
        linkRes = { data: json, error: null } as any;
      }
    } catch (e) {
      return new Response(JSON.stringify({ stage: "generate_link", error: "Exceção ao gerar link", details: String(e) }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  }

  const d: any = linkRes.data || {};
  let actionLink = d.action_link || d.email_otp_link || d?.properties?.action_link || d?.properties?.email_otp_link || "";
  if (!actionLink) {
    const token = d.email_otp || d.oob_code || d.token || d.code || "";
    if (token) {
      const params = new URLSearchParams({ type: currentType, token });
      if (redirectTarget) params.set("redirect_to", String(redirectTarget));
      actionLink = `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
    }
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
        body: JSON.stringify({ type: "magiclink", email, redirect_to: redirectTarget }),
      });
      const json = await resp.json();
      if (resp.ok && (json?.action_link || json?.email_otp_link)) {
        actionLink = json.action_link || json.email_otp_link;
        currentType = "invite";
      }
    } catch (_) {}
  }
  if (!actionLink) {
    try {
      const created = await admin.auth.admin.createUser({ email, user_metadata: { full_name: nome || "", company: empresa || "", role: perfil || "" } } as any);
      if (created.error && !/already exists/i.test(String(created.error?.message))) {
        return new Response(JSON.stringify({ stage: "create_user", error: "Falha ao criar usuário", details: created.error }), {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      currentType = "recovery";
      const rec = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: redirectTarget } } as any);
      const rd: any = rec?.data || {};
      actionLink = rd.action_link || rd.email_otp_link || rd?.properties?.action_link || rd?.properties?.email_otp_link || "";
      if (!actionLink) {
        const token = rd.email_otp || rd.oob_code || rd.token || rd.code || "";
        if (token) {
          const params = new URLSearchParams({ type: currentType, token });
          if (redirectTarget) params.set("redirect_to", String(redirectTarget));
          actionLink = `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
        }
      }
    } catch (e) {
      return new Response(JSON.stringify({ stage: "create_user_generate_recovery", error: String(e) }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  }
  if (!actionLink) {
    return new Response(JSON.stringify({ stage: "generate_link_no_url", error: "Link de ação não gerado" }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
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
        <h1>Ativação de Conta no ATLAS</h1>
        <p>Olá${safeNome ? `, ${safeNome}` : ""}.</p>
        <p>${safeEmpresa ? `Você foi convidado(a) pela ${safeEmpresa} ` : 'Você foi convidado(a) '}a se cadastrar e acessar o sistema ATLAS – Integridade Corporativa.</p>
        <p style="margin-top:12px; color:#0f172a; font-weight:600;">Importante:</p>
        <p style="margin-top:4px; color:#475569;">Realize o cadastro usando <strong>o mesmo e-mail</strong> que recebeu este convite e <strong>o mesmo nome</strong> informado no seu pré-cadastro.</p>
        <p style="margin-top:6px; color:#334155;">Para evitar inconsistências, utilize exatamente o nome exibido na saudação acima: <strong>${safeNome}</strong>.</p>
        <p style="margin-top:6px; color:#475569;">Você poderá ajustar esses dados <strong>após concluir</strong> o cadastro.</p>
        <p style="margin-top:8px; color:#1f2937;">Clique no botão abaixo para iniciar seu cadastro.</p>
        <p><a class="btn" href="${safeUrl}" target="_blank" rel="noopener">Criar conta</a></p>
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
</html>`;

  const fromName = Deno.env.get("RESEND_FROM_NAME") || "ATLAS - Integridade Corporativa";
  const rawFrom = fromEmail ?? (Deno.env.get("RESEND_FROM") || "atlas@a2care.com.br");
  const from = /<[^>]+>/.test(rawFrom) ? rawFrom : `${fromName} <${rawFrom}>`;

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
    try {
      const invited = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: redirectTarget } as any);
      if (invited.error) {
        return new Response(JSON.stringify({ stage: "resend", error: "Falha ao enviar e-mail", details: data, supabase_invite_error: invited.error }), {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, sent_by: "supabase", action_link: safeUrl }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ stage: "resend", error: "Falha ao enviar e-mail", details: data, supabase_invite_exception: String(e) }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
