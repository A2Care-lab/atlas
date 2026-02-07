import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureClaims = async (p: any) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const currentRole = (session?.user?.user_metadata as any)?.role || null;
      const currentCompany = (session?.user?.user_metadata as any)?.company_id || null;
      const nextRole = p?.role || null;
      const nextCompany = p?.company_id || null;
      if (nextRole !== currentRole || (nextCompany || null) !== (currentCompany || null)) {
        await supabase.auth.updateUser({ data: { role: nextRole, company_id: nextCompany || null } } as any);
        await supabase.auth.refreshSession();
      }
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      try {
        const withTimeout = <T>(p: Promise<T>, ms = 3000): Promise<T> => {
          return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('auth-timeout')), ms)
            p.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
          })
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession());
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          loadProfile(session.user.id);
        }
      } catch (err) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;
      const baseEmail = session?.user?.email || '';
      const metaRole = (session?.user?.user_metadata as any)?.role || null;
      const metaCompany = (session?.user?.user_metadata as any)?.company_id || null;
      const fallbackProfile: any = {
        id: userId,
        email: baseEmail,
        role: metaRole || 'user',
        company_id: metaCompany || null,
        is_active: true,
      };
      const sel = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!sel.error && sel.data) {
        setProfile(sel.data as any);
        await ensureClaims(sel.data as any);
        return;
      }

      const email = baseEmail;
      const inv = await supabase
        .from('invitations')
        .select('id, role, company_id, full_name, expires_at, accepted_at, created_at')
        .eq('email', email)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const invited = (!inv.error && inv.data) ? (inv.data as any) : null;
      const payload: any = {
        id: userId,
        email,
        role: invited?.role || 'user',
        is_active: true,
      };
      if (invited?.company_id) payload.company_id = invited.company_id;
      if (invited?.full_name) payload.full_name = invited.full_name;
      const up = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'id', ignoreDuplicates: true })
        .select('*')
        .maybeSingle();

      if (up.error && !up.data) {
        // Fallback duro: usar dados da sessão para não deixar a UI em branco
        setProfile(fallbackProfile);
        await ensureClaims(fallbackProfile);
        return;
      }
      const profileData = up.data || (await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()).data;
      if (profileData) {
        setProfile(profileData as any);
        await ensureClaims(profileData as any);
      }
      try {
        await supabase.auth.updateUser({ data: { role: payload.role, company_id: payload.company_id || null } } as any)
      } catch (_) {}
      if (invited?.id) {
        try {
          await supabase
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invited.id)
        } catch (_) {}
      }
    } catch (error) {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const baseEmail = session?.user?.email || '';
        const metaRole = (session?.user?.user_metadata as any)?.role || 'user';
        const metaCompany = (session?.user?.user_metadata as any)?.company_id || null;
        const fallbackProfile: any = { id: userId, email: baseEmail, role: metaRole, company_id: metaCompany, is_active: true };
        setProfile(fallbackProfile);
        await ensureClaims(fallbackProfile);
      } catch (_) {}
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    try {
      if (!error && data?.user) {
        const uid = data.user.id;
        const sel = await supabase
          .from('user_profiles')
          .select('id, role, company_id, full_name')
          .eq('id', uid)
          .maybeSingle();
        const p = (!sel.error && sel.data) ? (sel.data as any) : null;
        const nextRole = p?.role || (data.user.user_metadata as any)?.role || 'user';
        const nextCompany = p?.company_id || (data.user.user_metadata as any)?.company_id || null;
        await supabase.auth.updateUser({ data: { role: nextRole, company_id: nextCompany } } as any);
        await supabase.auth.refreshSession();
      }
    } catch {}
    return { data, error };
  };

  const signOut = async () => {
    let error: any = null
    try {
      const res = await supabase.auth.signOut();
      error = res?.error || null
    } catch (e) {
      error = e
    }
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage : undefined
      const ss = typeof window !== 'undefined' ? window.sessionStorage : undefined
      if (ls) {
        const keys = Object.keys(ls)
        for (const k of keys) {
          if (/^sb-/.test(k) || /supabase/i.test(k) || /atlas/i.test(k)) {
            ls.removeItem(k)
          }
        }
      }
      if (ss) ss.clear()
    } catch {}
    try {
      await supabase.auth.getSession()
    } catch {}
    return { error };
  };

  const resetPassword = async (email: string) => {
    try {
      const appUrl = (import.meta as any)?.env?.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : undefined)
      const base = String(appUrl || '').replace(/\/+$/, '')
      const redirectTo = `${base}/#/onboarding?type=recovery`
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      return { data, error } as any
    } catch (err) {
      return { data: null, error: err } as any
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const updateProfile = async (changes: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'department' | 'avatar_url'>>) => {
    if (!user?.id) {
      return { data: null, error: new Error('no-user') as any };
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .update(changes)
      .eq('id', user.id)
      .select('*')
      .single();
    if (!error && data) {
      setProfile(data);
    }
    return { data, error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}
