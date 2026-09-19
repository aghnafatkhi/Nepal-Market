'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { DbProfile } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: DbProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: AuthError | Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isConfigured: false,
  signInWithGoogle: async () => ({ error: new Error('Supabase belum dikonfigurasi') }),
  signInWithEmail: async () => ({ error: new Error('Supabase belum dikonfigurasi') }),
  signUpWithEmail: async () => ({ error: new Error('Supabase belum dikonfigurasi') }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getSupabaseClient()));
  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, phone, instagram, role, created_at')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Gagal memuat profil Supabase:', error.message);
      }

      if (data) {
        setProfile({ ...(data as Omit<DbProfile, 'email'>), email: currentUser?.email ?? null });
      } else if (currentUser) {
        // Fallback profile dari user auth metadata jika trigger belum selesai
        const fallbackProfile: DbProfile = {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Warga Nepal',
          username: (currentUser.user_metadata?.user_name || currentUser.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, ''),
          email: currentUser.email || null,
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          phone: currentUser.user_metadata?.phone || null,
          instagram: null,
          role: 'user',
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);

        // Trigger auth.users membuat profil. Jangan membuat profil langsung dari browser.
      }
    } catch (err) {
      console.error('Error saat fetchProfile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    // Cek session aktif saat pertama kali load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Pasang listener perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = async (redirectTo?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Supabase belum terhubung di .env.local') };
    }

    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTarget = redirectTo 
        ? `${redirectOrigin}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`
        : `${redirectOrigin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget,
        },
      });
      return { error };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Supabase belum terhubung di .env.local') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user);
      }
      return { error };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Supabase belum terhubung di .env.local') };
    }

    try {
      const trimmedEmail = email.trim();
      const baseUsername = trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: name.trim() || 'Warga Nepal',
            user_name: baseUsername,
          },
          emailRedirectTo: `${redirectOrigin}/`,
        },
      });

      if (error) {
        return { error };
      }

      // Jika user langsung terkonfirmasi (Confirm Email nonaktif di Supabase)
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user);
        return { error: null, needsEmailConfirmation: false };
      }

      // Jika membutuhkan konfirmasi email
      return { error: null, needsEmailConfirmation: true };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error saat signOut:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: configured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
