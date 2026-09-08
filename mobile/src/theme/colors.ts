export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  rating: string;
  error: string;
}

// accent ist bewusst eine andere Farbe als rating (Sterne) und error
// (Fehler/Löschen), damit "Aktion", "Bewertung" und "Fehler/Gefahr" visuell
// nie verwechselt werden.
export const lightColors: ThemeColors = {
  background: '#F7F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F5',
  border: '#E3E3E9',
  textPrimary: '#16161D',
  textSecondary: '#6B6B76',
  accent: '#6D5EF5',
  accentText: '#FFFFFF',
  rating: '#F5A623',
  error: '#E5484D',
};

export const darkColors: ThemeColors = {
  background: '#0F0F13',
  surface: '#1A1A21',
  surfaceAlt: '#222229',
  border: '#2E2E38',
  textPrimary: '#F2F2F5',
  textSecondary: '#9A9AA6',
  accent: '#8B7FFF',
  accentText: '#14121F',
  rating: '#FFC24B',
  error: '#FF6369',
};

export interface AccentPalette {
  id: string;
  name: string;
  light: { accent: string; accentText: string };
  dark: { accent: string; accentText: string };
}

// Waehlbare Akzentfarben (Profil-Seite, "Murmeln"). Ueberschreiben zur
// Laufzeit nur accent/accentText von lightColors/darkColors (siehe
// ThemeContext.tsx) - Hintergrund, Text, rating und error bleiben fuer jede
// Palette identisch. "Kinosaal" ist die bisherige, unveraenderte
// Standardfarbe; die Dark-Variante jeder Palette ist bewusst die hellere/
// desaturiertere Variante der Light-Farbe (gleiches Muster wie beim
// bisherigen Violet), damit sie auf dunklem Grund kontrastreich bleibt.
// Bewusst 10 Paletten (5+5 in der UI) mit gleichmaessig ueber den Farbkreis
// verteilten, klar unterscheidbaren Farbtoenen.
export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'samtvorhang',
    name: 'Samtvorhang',
    light: { accent: '#E11D48', accentText: '#FFFFFF' },
    dark: { accent: '#FB7185', accentText: '#14121F' },
  },
  {
    id: 'popcorn',
    name: 'Popcorn',
    light: { accent: '#C2410C', accentText: '#FFFFFF' },
    dark: { accent: '#FB923C', accentText: '#14121F' },
  },
  {
    id: 'scheinwerfer',
    name: 'Scheinwerfer',
    light: { accent: '#B45309', accentText: '#FFFFFF' },
    dark: { accent: '#FBBF24', accentText: '#14121F' },
  },
  {
    id: 'filmrolle',
    name: 'Filmrolle',
    light: { accent: '#047857', accentText: '#FFFFFF' },
    dark: { accent: '#34D399', accentText: '#14121F' },
  },
  {
    id: 'leinwand',
    name: 'Leinwand',
    light: { accent: '#0E7490', accentText: '#FFFFFF' },
    dark: { accent: '#22D3EE', accentText: '#14121F' },
  },
  {
    id: 'nachtvorstellung',
    name: 'Nachtvorstellung',
    light: { accent: '#2563EB', accentText: '#FFFFFF' },
    dark: { accent: '#60A5FA', accentText: '#14121F' },
  },
  {
    id: 'kinosaal',
    name: 'Kinosaal',
    light: { accent: '#6D5EF5', accentText: '#FFFFFF' },
    dark: { accent: '#8B7FFF', accentText: '#14121F' },
  },
  {
    id: 'abspann',
    name: 'Abspann',
    light: { accent: '#7E22CE', accentText: '#FFFFFF' },
    dark: { accent: '#C084FC', accentText: '#14121F' },
  },
  {
    id: 'kinoliebe',
    name: 'Kinoliebe',
    light: { accent: '#DB2777', accentText: '#FFFFFF' },
    dark: { accent: '#F472B6', accentText: '#14121F' },
  },
  {
    id: 'schwarzweissfilm',
    name: 'Schwarzweißfilm',
    light: { accent: '#3F3F46', accentText: '#FFFFFF' },
    dark: { accent: '#A1A1AA', accentText: '#14121F' },
  },
];

// "kinosaal" bleibt explizit die Standardfarbe (bisherige App-Farbe) -
// unabhaengig von der Reihenfolge in ACCENT_PALETTES oben.
export const DEFAULT_PALETTE_ID = 'kinosaal';
