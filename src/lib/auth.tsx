import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from './supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, bio?: string) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  pendingVerificationEmail: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load profile:', error.message);
    }
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  async function signUp(email: string, password: string, displayName: string, bio?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          bio: bio || '',
        },
      },
    });
    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: 'Bu e-posta ile zaten bir hesap var.' };
      }
      return { error: translateError(error.message) };
    }

    // If email confirmation is required, user won't have a session yet
    if (data.user && !data.session) {
      setPendingVerificationEmail(email);
      return { error: null, needsVerification: true };
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
        email,
        bio: bio || null,
      }, { onConflict: 'id' });
      await loadProfile(data.user.id);
    }
    return { error: null };
  }

  async function verifyOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) return { error: translateError(error.message) };
    setPendingVerificationEmail(null);
    return { error: null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: translateError(error.message) };
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setPendingVerificationEmail(email);
        return { error: null, needsVerification: true };
      }
      return { error: translateError(error.message) };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) return { error: translateError(error.message) };
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signUp, signIn, signInWithGoogle, verifyOtp, pendingVerificationEmail, signOut, refreshProfile, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (msg.includes('User already registered')) return 'Bu e-posta ile zaten bir hesap var.';
  if (msg.includes('Password should be at least')) return 'Şifre en az 6 karakter olmalı.';
  if (msg.includes('Unable to validate email')) return 'Geçerli bir e-posta adresi girin.';
  return 'Bir şeyler ters gitti. Tekrar deneyin.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
