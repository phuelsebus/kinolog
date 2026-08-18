import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'kinolog:theme-preference';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Stellt das aktuelle Farbschema app-weit bereit. Ohne expliziten Nutzer-
 * Override folgt der Modus live der Systemeinstellung (useColorScheme).
 * Der Override wird in AsyncStorage persistiert (gleiches Pattern wie die
 * Supabase-Session in lib/supabase.ts) und ueberlebt einen App-Neustart.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setOverride(stored);
    });
  }, []);

  const mode: ThemeMode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === 'dark' ? darkColors : lightColors,
      mode,
      toggleTheme: () => {
        const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
        setOverride(next);
        AsyncStorage.setItem(STORAGE_KEY, next);
      },
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme muss innerhalb von <ThemeProvider> verwendet werden.');
  return ctx;
}
