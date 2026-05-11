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

  <div style="display:none; font-size:1px; color:#f3f5f7; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Ative sua conta no ATLAS - Integridade Corporativa.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f5f7;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table width="640" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border:1px solid #e6eaee; border-radius:8px; overflow:hidden; max-width:640px;">
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

          <tr>
            <td style="padding:34px 48px 24px 48px;">
              <h1 style="font-family:Arial, Helvetica, sans-serif; font-size:28px; font-weight:800; color:#0c1b1b; margin:0 0 18px 0;">
                Ativacao de Conta no ATLAS
              </h1>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Ola, {{full_name}}!
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Voce foi convidado(a) pela A2CARE C T C LTDA a se cadastrar e acessar o sistema
                ATLAS - Integridade Corporativa.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; color:#0c1b1b; margin-top:24px;">
                Importante:
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Crie uma <strong>senha pessoal, intransferivel e forte</strong>. Evite
                <strong>datas de nascimento, nome</strong> ou <strong>outros dados comuns</strong>.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Voce podera <strong>alterar sua senha a qualquer momento</strong> e
                <strong>ajustar seus dados</strong> apos concluir o cadastro.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b;">
                Clique no botao abaixo para iniciar seu cadastro.
              </p>

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
                Se voce nao reconhece este convite, ignore este e-mail.
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b; margin-top:32px; margin-bottom:6px;">
                Atenciosamente,
              </p>

              <p style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#0c1b1b; margin-top:16px;">
                Equipe ATLAS - Integridade Corporativa.
              </p>

              <hr style="border:none; border-top:1px solid #e6eaee; margin-top:28px;">
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb; padding:16px 24px; text-align:center;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#667085;">
                (c) ATLAS - Integridade Corporativa
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

const renderTemplate = (html: string, vars: Record<string, string>) =>
  html.replace(/\{\{\s*([\.\w-]+)\s*\}\}/g, (_, key) => vars[key] ?? "");

const normalizeTemplateTitle = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const getInviteTemplateHtml = async (admin: ReturnType<typeof createClient>) => {
  try {
    const { data, error } = await admin
      .from("system_templates")
      .select("title, html, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const template = ((data as Array<{ title?: string; html?: string }> | null) || []).find((item) =>
      normalizeTemplateTitle(item?.title || "") === "CONVITE USUARIO"
    );

    return String(template?.html || "").trim() || INVITE_TEMPLATE_HTML;
  } catch (error) {
    console.error("send-user-invite: template lookup fallback", error);
    return INVITE_TEMPLATE_HTML;
  }
};

const getBaseAppUrl = () => {
  const environmentRaw = Deno.env.get("ENVIRONMENT") || Deno.env.get("ENV") || "";
  const environment = environmentRaw.toLowerCase().trim();
  const isProd = ["production", "prod", "prd", "main"].includes(environment);
  return isProd ? (APP_URL || "https://atlas.a2care.com.br") : (APP_URL || "http://localhost:5173");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo nao permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ stage: "env", error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body: { email?: string; nome?: string; empresa?: string; perfil?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ stage: "parse_json", error: "JSON invalido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const nome = String(body.nome || "").trim();
  const empresa = String(body.empresa || "").trim();
  const perfil = String(body.perfil || "").trim();

  if (!email) {
    return new Response(JSON.stringify({ stage: "validation", error: "Campo obrigatorio: email" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const baseAppUrl = getBaseAppUrl().replace(/\/+$/, "");

  try {
    const { data: invite, error: inviteError } = await admin
      .from("invitations")
      .select("id, token, expires_at, full_name")
      .eq("email", email)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteError) {
      console.error("send-user-invite: invitation lookup error", inviteError);
      return new Response(JSON.stringify({ stage: "invite_lookup_failed", error: String(inviteError.message || inviteError) }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (!invite?.token) {
      return new Response(JSON.stringify({ stage: "invite_not_found", error: "Nenhum convite pendente encontrado para este e-mail." }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("invitations")
      .update({ last_invite_at: now.toISOString(), expires_at: expiresAt })
      .eq("id", invite.id);

    const actionLink = `${baseAppUrl}/#/invite?invite_token=${encodeURIComponent(invite.token)}`;
    const templateHtml = await getInviteTemplateHtml(admin);
    const safeName = nome || String(invite.full_name || "").trim();
    const finalHtml = renderTemplate(templateHtml, {
      invite_link: escapeHtml(actionLink),
      ".ConfirmationURL": escapeHtml(actionLink),
      company_name: escapeHtml(empresa),
      role: escapeHtml(perfil),
      app_url: escapeHtml(baseAppUrl),
      full_name: escapeHtml(safeName),
      nome: escapeHtml(safeName),
      name: escapeHtml(safeName),
      first_name: escapeHtml(safeName.split(" ")[0] || ""),
      recipient_name: escapeHtml(safeName),
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const RESEND_FROM = Deno.env.get("RESEND_FROM") || "noreply@atlas.a2care.com.br";
    const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "ATLAS - Integridade Corporativa";
    const RESEND_SUBJECT = Deno.env.get("RESEND_SUBJECT") || "Convite para acessar o ATLAS";

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: true, sent_by: "no_resend_api_key", invite_link: actionLink, invite_token: invite.token }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: /</.test(RESEND_FROM) ? RESEND_FROM : `${RESEND_FROM_NAME} <${RESEND_FROM}>`,
        to: email,
        subject: RESEND_SUBJECT,
        html: finalHtml,
      }),
    });

    if (!emailRes.ok) {
      const txt = await emailRes.text();
      return new Response(JSON.stringify({ stage: "resend_failed", status: emailRes.status, error: txt, fallback_link: actionLink }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_by: "resend", invite_link: actionLink, invite_token: invite.token }), {
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
