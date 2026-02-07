import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Ambiente não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body: { company_id?: string; protocolo?: string; fromEmail?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const { company_id, protocolo, fromEmail } = body;
  if (!company_id || !protocolo) {
    return new Response(JSON.stringify({ error: "Campos obrigatórios: company_id e protocolo" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const ENVIRONMENT_RAW = Deno.env.get("ENVIRONMENT") || Deno.env.get("ENV") || "";
  const ENVIRONMENT = ENVIRONMENT_RAW.toLowerCase().trim();
  const isProd = ["production", "prod", "prd", "main"].includes(ENVIRONMENT);
  const baseAppUrl = isProd ? (APP_URL || "https://atlas.a2care.com.br") : (APP_URL || "http://localhost:5173");
  const corporateApprovalUrl = `${baseAppUrl}/#/corporate-approval?protocol=${encodeURIComponent(protocolo!)}`;
  const { data: recipientsData, error } = await admin
    .from("user_profiles")
    .select("email")
    .eq("company_id", company_id)
    .in("role", ["corporate_manager", "approver_manager"])
    .eq("is_active", true);
  if (error) {
    return new Response(JSON.stringify({ error: "Falha ao buscar destinatários", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const recipientsSet = new Set((recipientsData || []).map((r: any) => String(r.email)).filter(Boolean));
  const { data: invitesData } = await admin
    .from("invitations")
    .select("email")
    .eq("company_id", company_id)
    .in("role", ["corporate_manager", "approver_manager"])
    .is("accepted_at", null);
  for (const inv of invitesData || []) {
    const email = String((inv as any).email);
    if (email) recipientsSet.add(email);
  }
  const recipients = Array.from(recipientsSet);
  const { data: companyRow } = await admin.from("companies").select("name").eq("id", company_id).single();
  const companyName = companyRow?.name ? String(companyRow.name) : "Empresa";
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const subject = `Nova denúncia aberta – Protocolo ${protocolo}`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin:0; padding:0; background:#f5f6f8; }
    .wrapper { width:100%; background:#f5f6f8; padding:24px 0; }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(16,24,40,.06); }
    .header { padding:24px 28px; background:#006D77; color:#ffffff; }
    .brand { font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; letter-spacing:.02em; opacity:.9; }
    .subject { margin-top:6px; font:700 18px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    .content { padding:28px; color:#1f2937; font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
    h1 { margin:0 0 14px 0; font:700 20px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#0f172a; }
    p { margin:0 0 12px 0; }
    .footer { padding:18px 28px; color:#6b7280; font:400 13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#fafafa; }
    .btn { display:inline-block; background:#006D77; color:#ffffff; font:700 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; text-decoration:none; padding:10px 16px; border-radius:10px; margin-top:12px; }
  </style>
<head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">ATLAS - Integridade Corporativa</div>
        <div class="subject">${escapeHtml(subject)}</div>
      </div>
      <div class="content">
        <h1>Nova denúncia registrada no canal.</h1>
        <p>Empresa: <strong>${escapeHtml(companyName)}</strong></p>
        <p>Protocolo: <strong>${escapeHtml(protocolo)}</strong></p>
        <p>Acesse o ATLAS para analisar e acompanhar. O acesso requer login.</p>
        <p><a class="btn" href="${escapeHtml(corporateApprovalUrl)}" target="_blank" rel="noopener">Abrir denúncia no ATLAS</a></p>
      </div>
      <div class="footer" style="text-align:center">
        <a href="https://atlas.a2care.com.br" style="color:#334155; text-decoration:none">atlas.a2care.com.br</a>
        <span style="margin:0 6px; color:#94a3b8">|</span>
        <a href="https://a2care.com.br" style="color:#334155; text-decoration:none">a2care.com.br</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const from = fromEmail ?? "ATLAS - Integridade Corporativa <atlas@a2care.com.br>";
  const perRecipient: Array<{ to: string; ok: boolean; via: string }> = [];
  for (const to of recipients) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (resendRes.ok) {
        perRecipient.push({ to, ok: true, via: "resend" });
      } else {
        const r = await admin.rpc("send_email", { p_to: to, p_subject: subject, p_html: html, p_text: "" });
        const ok = !!(r.data as any)?.success;
        perRecipient.push({ to, ok, via: "rpc_fallback" });
      }
    } catch {
      try {
        const r = await admin.rpc("send_email", { p_to: to, p_subject: subject, p_html: html, p_text: "" });
        const ok = !!(r.data as any)?.success;
        perRecipient.push({ to, ok, via: "rpc_fallback" });
      } catch {
        perRecipient.push({ to, ok: false, via: "rpc_failed" });
      }
    }
  }
  const sentCount = perRecipient.filter((x) => x.ok).length;
  if (sentCount === 0) {
    return new Response(JSON.stringify({ error: "Falha ao enviar e-mail", recipient_count: recipients.length }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
