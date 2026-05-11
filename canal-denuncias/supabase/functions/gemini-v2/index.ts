import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { message, history, companyId } = await req.json().catch(() => ({ message: null, history: [], companyId: null }));
    if (!message || !companyId) {
      return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });

    const assinaturaRes = await supabase
      .from("assinaturas")
      .select("ai_monthly_limit, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const aiLimit = Number(assinaturaRes.data?.ai_monthly_limit ?? 0);
    const aiStatus = String(assinaturaRes.data?.status ?? "Cancelada");
    const isActive = aiStatus === "Ativa";
    if (!isActive || aiLimit === 0) {
      return new Response(JSON.stringify({ error: "ai_unavailable", text: "O uso de IA está desabilitado para sua assinatura." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const usageCountRes = await supabase.rpc("_ai_usage_count_month", { p_company_id: companyId }).then(async (r) => {
      if (!r.error && typeof r.data === "number") return r.data as number;
      const c = await supabase
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      return Number(c.count ?? 0);
    });

    if (usageCountRes >= aiLimit) {
      return new Response(JSON.stringify({ error: "ai_limit_reached", text: "Limite mensal de IA atingido." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "no_gemini_key" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const body = {
      contents: [
        ...Array.isArray(history) ? history.map((h: any) => ({ role: h.role || "user", parts: [{ text: String(h.parts ?? "") }] })) : [],
        { role: "user", parts: [{ text: String(message) }] },
      ],
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "gemini_error", status: resp.status }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    await supabase
      .from("ai_usage")
      .insert([{ company_id: companyId, source: "support_chatbot", model: "gemini-1.5-flash", tokens_in: 0, tokens_out: 0 }]);

    return new Response(JSON.stringify({ text }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", details: String(e && (e as any).message || e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});

