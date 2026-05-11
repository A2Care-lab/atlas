import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

type InviteAction = "resolve" | "accept";

type InviteRecord = {
  id: string;
  email: string;
  company_id: string | null;
  role: string;
  full_name: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
};

const normalizeEmail = (value: string | null | undefined) => String(value || "").trim().toLowerCase();

const isStrongPassword = (password: string) => {
  if (!password || password.length < 6) return false;
  return /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
};

const formatJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const listUsersPage = async (admin: any, page: number, perPage: number) => {
  try {
    return await admin.auth.admin.listUsers({ page, perPage });
  } catch {
    return await admin.auth.admin.listUsers(page, perPage);
  }
};

const updateAuthUser = async (admin: any, userId: string, payload: Record<string, unknown>) => {
  try {
    return await admin.auth.admin.updateUserById(userId, payload);
  } catch (error) {
    return { data: null, error };
  }
};

const findAuthUserByEmail = async (admin: any, email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const response = await listUsersPage(admin, page, perPage);
    if (response?.error) {
      throw response.error;
    }

    const users = (response?.data?.users || response?.users || []) as Array<any>;
    const found = users.find((user) => normalizeEmail(user?.email) === normalizedEmail);
    if (found) return found;
    if (users.length < perPage) break;
  }

  return null;
};

const getInviteByToken = async (admin: any, token: string): Promise<InviteRecord | null> => {
  const { data, error } = await admin
    .from("invitations")
    .select("id, email, company_id, role, full_name, token, expires_at, accepted_at")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as InviteRecord | null) ?? null;
};

const getCompanyName = async (admin: any, companyId: string | null) => {
  if (!companyId) return "";

  const { data, error } = await admin
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return String((data as { name?: string } | null)?.name || "");
};

const ensureInviteIsUsable = (invite: InviteRecord | null) => {
  if (!invite) {
    return { ok: false, status: 404, error: "Convite nao encontrado." };
  }

  if (invite.accepted_at) {
    return { ok: false, status: 410, error: "Este convite ja foi utilizado." };
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 410, error: "Este convite expirou. Solicite um novo convite." };
  }

  return { ok: true as const };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return formatJson({ error: "Metodo nao permitido" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return formatJson({ error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados" }, 500);
  }

  let body: {
    action?: InviteAction;
    token?: string;
    password?: string;
    agree?: boolean;
    privacyVersion?: string;
    termsVersion?: string;
    nonRetaliationVersion?: string;
  };

  try {
    body = await req.json();
  } catch {
    return formatJson({ error: "JSON invalido" }, 400);
  }

  const action = body.action;
  const token = String(body.token || "").trim();

  if (!action || !["resolve", "accept"].includes(action)) {
    return formatJson({ error: "Acao invalida" }, 400);
  }

  if (!token) {
    return formatJson({ error: "Campo obrigatorio: token" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const invite = await getInviteByToken(admin, token);
    const inviteStatus = ensureInviteIsUsable(invite);
    if (!inviteStatus.ok) {
      return formatJson({ error: inviteStatus.error }, inviteStatus.status);
    }

    const companyName = await getCompanyName(admin, invite.company_id);

    if (action === "resolve") {
      return formatJson({
        ok: true,
        invite: {
          email: invite.email,
          full_name: invite.full_name,
          role: invite.role,
          company_id: invite.company_id,
          company_name: companyName,
          expires_at: invite.expires_at,
        },
      });
    }

    const password = String(body.password || "");
    const agree = Boolean(body.agree);

    if (!isStrongPassword(password)) {
      return formatJson({ error: "A senha deve ter no minimo 6 caracteres, com letras maiusculas, minusculas, numeros e simbolos." }, 400);
    }

    if (!agree) {
      return formatJson({ error: "E necessario aceitar as politicas e termos para concluir o cadastro." }, 400);
    }

    const metadata = {
      full_name: invite.full_name || "",
      role: invite.role,
      company_id: invite.company_id,
    };

    let authUser = await findAuthUserByEmail(admin, invite.email);
    if (authUser?.id) {
      const updateRes = await updateAuthUser(admin, authUser.id, {
        email_confirm: true,
        password,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          ...metadata,
        },
      });

      if (updateRes?.error) {
        throw updateRes.error;
      }

      authUser = updateRes?.data?.user || authUser;
    } else {
      const createRes = await admin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      } as any);

      if (createRes.error) {
        throw createRes.error;
      }

      authUser = createRes.data.user;
    }

    if (!authUser?.id) {
      throw new Error("Nao foi possivel criar ou localizar o usuario no Auth.");
    }

    const now = new Date().toISOString();
    const profilePayload = {
      id: authUser.id,
      email: invite.email,
      full_name: invite.full_name || null,
      role: invite.role,
      company_id: invite.company_id,
      is_active: true,
      accepted_terms: true,
      terms_accepted_at: now,
    };

    const { error: profileError } = await admin
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      throw profileError;
    }

    const { error: inviteUpdateError } = await admin
      .from("invitations")
      .update({ accepted_at: now })
      .eq("id", invite.id);

    if (inviteUpdateError) {
      throw inviteUpdateError;
    }

    const { error: acceptanceError } = await admin
      .from("terms_acceptances")
      .insert({
        user_id: authUser.id,
        full_name: invite.full_name || "",
        email: invite.email,
        accepted_at: now,
        company_name: companyName || "",
        privacy_version: String(body.privacyVersion || ""),
        terms_version: String(body.termsVersion || ""),
        non_retaliation_version: String(body.nonRetaliationVersion || ""),
      });

    if (acceptanceError) {
      throw acceptanceError;
    }

    return formatJson({
      ok: true,
      email: invite.email,
      user_id: authUser.id,
    });
  } catch (error: any) {
    console.error("user-invite: exception", error);
    return formatJson({
      error: String(error?.message || error || "Falha ao processar convite."),
    }, 500);
  }
});
