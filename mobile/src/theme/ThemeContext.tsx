import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  ACCENT_PALETTES,
  darkColors,
  DEFAULT_PALETTE_ID,
  lightColors,
  type AccentPalette,
  type ThemeColors,
} from './colors';

type ThemeMode = 'light' | 'dark';

const MODE_STORAGE_KEY = 'kinolog:theme-preference';
const PALETTE_STORAGE_KEY = 'kinolog:accent-palette';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
  palettes: AccentPalette[];
  paletteId: string;
  setPaletteId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Stellt das aktuelle Farbschema app-weit bereit. Ohne expliziten Nutzer-
 * Override folgt der Modus live der Systemeinstellung (useColorScheme).
 * Der Hell/Dunkel-Override sowie die gewaehlte Akzentfarben-Palette werden
 * in AsyncStorage persistiert (gleiches Pattern wie die Supabase-Session in
 * lib/supabase.ts) und ueberleben einen App-Neustart.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const [paletteId, setPaletteIdState] = useState(DEFAULT_PALETTE_ID);

  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setOverride(stored);
    });
    AsyncStorage.getItem(PALETTE_STORAGE_KEY).then((stored) => {
      if (stored && ACCENT_PALETTES.some((p) => p.id === stored)) setPaletteIdState(stored);
    });
  }, []);

  const mode: ThemeMode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(() => {
    const base = mode === 'dark' ? darkColors : lightColors;
    const palette = ACCENT_PALETTES.find((p) => p.id === paletteId) ?? ACCENT_PALETTES[0];
    const accentOverride = mode === 'dark' ? palette.dark : palette.light;

    return {
      colors: { ...base, ...accentOverride },
      mode,
      toggleTheme: () => {
        const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
        setOverride(next);
        AsyncStorage.setItem(MODE_STORAGE_KEY, next);
      },
      palettes: ACCENT_PALETTES,
      paletteId: palette.id,
      setPaletteId: (id: string) => {
        setPaletteIdState(id);
        AsyncStorage.setItem(PALETTE_STORAGE_KEY, id);
      },
    };
  }, [mode, paletteId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme muss innerhalb von <ThemeProvider> verwendet werden.');
  return ctx;
}
