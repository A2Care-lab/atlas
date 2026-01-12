import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({})) as { type?: string; system_name?: string }
    const type = body.type || "Política de Privacidade"
    const systemName = body.system_name || "A2Care"

    const apiKey = Deno.env.get("LEGALDESK_API_POLITICAS_PRIVACIDADE") || Deno.env.get("LEGALDESK_API_POLÍTICAS_PRIVACIDADE") || ""
    const bearer = Deno.env.get("LEGALDESK_API_BEARER_TOKEN") || ""

    if (!apiKey || !bearer) {
      return new Response(JSON.stringify({ error: "Missing required secrets" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const url = `https://peuvnxfkzbewhuajdqhd.supabase.co/rest/v1/latest_documents?type=eq.${encodeURIComponent(type)}&system_name=eq.${encodeURIComponent(systemName)}&select=*`
    const res = await fetch(url, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${bearer}`,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: text || `Error ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
})

