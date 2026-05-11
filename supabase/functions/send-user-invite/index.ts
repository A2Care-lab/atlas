import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL");

const INVITE_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite para acesso ao sistema</title>
</head>

<body style="margin:0; padding:0; background:#f3f5f7;">

  <!-- Preheader -->
  <div style="display:none; font-size:1px; color:#f3f5f7; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Ative sua conta no ATLAS – Integridade Corporativa.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f5f7;">
    <tr>
      <td align="center" style="padding:20px 12px;">

        <!-- Container -->
        <table width="640" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff; border:1px solid #e6eaee; border-radius:8px; overflow:hidden; max-width:640px;">

          <!-- Header -->
          <tr>
            <td style="background:#006D77; padding:22px 28px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:600; color:#E6F2F3;">
                ATLAS - Integridade Corporativa
              </div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:800; color:#ffffff; margin-top:6px;">
                Convite para acesso ao sistema
              </div>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding:34px 48px 24px 48px;">

              <h1 style="font-family:Arial, Helvetica, sans-serif; font-size:28px; font-weight:800; color:#0c1b1b; margin:0 0 18px 0;">
                Ativação de Conta no ATLAS
              </h1>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Olá, {{full_name}}!
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Você foi convidado(a) pela A2CARE C T C LTDA a se cadastrar e acessar o sistema
                ATLAS – Integridade Corporativa.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; color:#0c1b1b; margin-top:24px;">
                Importante:
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Crie uma <strong>senha pessoal, intransferível e forte</strong>. Evite
                <strong>datas de nascimento, nome</strong> ou <strong>outros dados comuns</strong>.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Você poderá <strong>alterar sua senha a qualquer momento</strong> e
                <strong>ajustar seus dados</strong> após concluir o cadastro.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Clique no botão abaixo para iniciar seu cadastro.
              </p>

              <!-- Botão -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;">
                <tr>
                  <td>
                    <a href="{{ .ConfirmationURL }}"
                       style="
                         display:inline-block;
                         background:#006D77;
                         color:#ffffff;
                         font-family:Arial, Helvetica, sans-serif;
                         font-size:14px;
                         font-weight:700;
                         text-decoration:none;
                         padding:10px 18px;
                         border-radius:10px;
                       ">
                      Criar conta
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#0c1b1b;">
                Se você não reconhece este convite, ignore este e-mail.
              </p>

              <!-- Assinatura -->
              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b; margin-top:32px; margin-bottom:6px;">
                Atenciosamente,
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b; margin-top:16px;">
                Equipe ATLAS - Integridade Corporativa.
              </p>

              <hr style="border:none; border-top:1px solid #e6eaee; margin-top:28px;">

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px 24px; text-align:center;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#667085;">
                © ATLAS – Integridade Corporativa
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

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

  console.log("send-user-invite: start", { method: req.method, origin: req.headers.get("origin"), referer: req.headers.get("referer") });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ stage: "env", error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body: { email?: string; nome?: string; empresa?: string; perfil?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ stage: "parse_json", error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const nome = body.nome;
  const empresa = body.empresa;
  const perfil = body.perfil;
  const redirect_to = body.redirect_to;
  console.log("send-user-invite: payload", { email, nome, empresa, perfil, redirect_to });

  if (!email) {
    return new Response(JSON.stringify({ stage: "validation", error: "Campo obrigatório: email" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const ENVIRONMENT_RAW = Deno.env.get("ENVIRONMENT") || Deno.env.get("ENV") || "";
  const ENVIRONMENT = ENVIRONMENT_RAW.toLowerCase().trim();
  const isProd = ["production", "prod", "prd", "main"].includes(ENVIRONMENT);
  const baseAppUrl = isProd
    ? (APP_URL || "https://atlas.a2care.com.br")
    : (APP_URL || "http://localhost:5173");
  const inviteRedirectTarget = `${baseAppUrl}/?go=/invite&type=invite`;
  const recoveryRedirectTarget = `${baseAppUrl}/?go=/invite&type=recovery`;
  console.log("send-user-invite: redirect", { ENVIRONMENT_RAW, ENVIRONMENT, baseAppUrl, inviteRedirectTarget, recoveryRedirectTarget });

  try {
    let linkType: "invite" | "recovery" = "invite";
    let redirectTarget = inviteRedirectTarget;
    let linkRes = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: redirectTarget },
    } as any);
    if (linkRes.error) {
      const inviteMessage = String(linkRes.error?.message || "");
      const userMissing = /not found|no user|user.*does not exist/i.test(inviteMessage);
      const userAlreadyExists = /already been registered|already exists|duplicate|conflict|users_email_partial_key/i.test(inviteMessage);
      if (userMissing) {
        const createRes = await admin.auth.admin.createUser({
          email,
          email_confirm: false,
          user_metadata: { full_name: nome || "", company: empresa || "", role: perfil || "" },
        } as any);
        if (createRes.error) {
          console.error("send-user-invite: createUser fallback error", createRes.error);
          return new Response(JSON.stringify({ stage: "create_user_failed", error: String(createRes.error?.message || "") }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" },
          });
        }
        linkRes = await admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo: redirectTarget },
        } as any);
      } else if (userAlreadyExists) {
        linkType = "recovery";
        redirectTarget = recoveryRedirectTarget;
        linkRes = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
        } as any);
      }
    }
    if (linkRes.error) {
      console.error("send-user-invite: generateLink error", linkRes.error);
      return new Response(JSON.stringify({ stage: "generate_link_failed", link_type: linkType, error: String(linkRes.error?.message || "") }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const RESEND_FROM = Deno.env.get("RESEND_FROM") || "noreply@atlas.a2care.com.br";
    const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "ATLAS - Integridade Corporativa";
    const RESEND_SUBJECT = Deno.env.get("RESEND_SUBJECT") || "Convite para acessar o ATLAS";

    const templateHtml = INVITE_TEMPLATE_HTML;

    const props = (linkRes.data as any)?.properties || {};
    const hashedToken = props?.hashed_token || "";
    const actionLinkRaw = (linkRes.data as any)?.action_link || "";
    const fallbackLink = hashedToken
      ? `${baseAppUrl}/?go=/invite&type=${linkType}&token=${encodeURIComponent(hashedToken)}`
      : redirectTarget;
    const actionLink = actionLinkRaw || fallbackLink;
    const render = (html: string, vars: Record<string, string>) => html.replace(/\{\{\s*([\.\w-]+)\s*\}\}/g, (_, k) => (vars as any)[k] ?? "");
    const nameVars = {
      full_name: nome || "",
      nome: nome || "",
      name: nome || "",
      first_name: (nome || "").split(" ")[0] || "",
      recipient_name: nome || "",
    };
    const finalHtml = render(templateHtml, { invite_link: actionLink, ".ConfirmationURL": actionLink, company_name: empresa || "", role: perfil || "", app_url: baseAppUrl, ...nameVars });

    try {
      await admin.from('invitations').update({ last_invite_at: new Date().toISOString() }).eq('email', email as string)
    } catch (_) {}

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: true, sent_by: "no_resend_api_key", link_type: linkType, invite_link: actionLink, hashed_token: hashedToken || null }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: /</.test(RESEND_FROM) ? RESEND_FROM : `${RESEND_FROM_NAME} <${RESEND_FROM}>`, to: email, subject: RESEND_SUBJECT, html: finalHtml }),
    });
    if (!emailRes.ok) {
      const txt = await emailRes.text();
      return new Response(JSON.stringify({ stage: "resend_failed", link_type: linkType, status: emailRes.status, error: txt, fallback_link: actionLink }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_by: "resend", link_type: linkType, invite_link: actionLink, hashed_token: hashedToken || null }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-user-invite: exception", e);
    return new Response(JSON.stringify({ stage: "invite_exception", error: String(e), stack: e?.stack ?? null }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
