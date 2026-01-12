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

      const session = (await supabase.auth.getSession()).data.session;
      const email = session?.user?.email || '';
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

      if (up.error && !up.data) throw up.error;
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
      console.error('Error loading profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
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
