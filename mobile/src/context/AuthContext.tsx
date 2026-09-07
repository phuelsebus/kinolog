import type { Session } from '@supabase/supabase-js';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { signInWithOAuth, redirectTo, type OAuthProvider } from '../lib/oauth';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Stellt die Supabase Auth Session app-weit bereit (idee.md: Authentication
 * als MVP-Feature). Lauscht auf Session-Aenderungen (Login/Logout/Token-Refresh)
 * und haelt sie synchron mit AsyncStorage (siehe lib/supabase.ts).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Faengt den Passwort-Reset-Link aus der E-Mail ab: Supabase leitet nach
  // Klick an dieselbe redirectTo-Adresse wie beim OAuth-Login zurueck, aber
  // mit "type=recovery" im Query-String. Anders als beim OAuth-Button-Tap
  // (der die Rueckkehr synchron ueber WebBrowser.openAuthSessionAsync
  // abfaengt) kann dieser Link jederzeit von außen (E-Mail-App) kommen,
  // auch bei kalt gestarteter App - daher ein app-weiter Linking-Listener
  // statt eines lokalen Callbacks in einem Screen.
  useEffect(() => {
    async function handleRecoveryUrl(url: string | null) {
      if (!url || !url.startsWith(redirectTo)) return;
      const { params, errorCode } = getQueryParams(url);
      if (errorCode || params.type !== 'recovery') return;

      const { access_token, refresh_token } = params;
      if (!access_token || !refresh_token) return;

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) router.push('/(auth)/reset-password');
    }

    Linking.getInitialURL().then(handleRecoveryUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleRecoveryUrl(url));
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signUp(email, password, displayName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || null } },
        });
        return { error: error?.message ?? null };
      },
      async signInWithProvider(provider) {
        return signInWithOAuth(provider);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async deleteAccount() {
        const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
        if (error) return { error: error.message };
        await supabase.auth.signOut();
        return { error: null };
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        // Supabase verraet bewusst nicht, ob die E-Mail einem Konto gehoert
        // (Schutz vor User-Enumeration) - error ist hier nur bei echten
        // Problemen gesetzt (z.B. Netzwerk), nicht bei "unbekannte E-Mail".
        return { error: error?.message ?? null };
      },
      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}
