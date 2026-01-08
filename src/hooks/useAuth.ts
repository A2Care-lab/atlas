import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Se não existir perfil, cria o próprio perfil do usuário
        const session = (await supabase.auth.getSession()).data.session;
        const email = session?.user?.email || '';
        if (error.code === 'PGRST116' || (error.message || '').toLowerCase().includes('no rows')) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({ id: userId, email, role: 'user', is_active: true });
          if (insertError) throw insertError;
          // Tenta buscar novamente
          const { data: data2, error: error2 } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (error2) throw error2;
          setProfile(data2);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
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
      const first = await supabase.functions.invoke('send-password-reset', { body: { email } });
      if (!first.error) return first as any;
      const second = await supabase.functions.invoke('email-password-reset', { body: { email } });
      return second as any;
    } catch (error) {
      try {
        const second = await supabase.functions.invoke('email-password-reset', { body: { email } });
        return second as any;
      } catch (err) {
        return { data: null, error: err } as any;
      }
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
