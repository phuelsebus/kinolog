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
