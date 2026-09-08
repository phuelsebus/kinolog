// Gespiegelt aus mobile/src/theme/colors.ts (ACCENT_PALETTES) - die echten
// 10 Akzentfarben, die Nutzer im Profil der App waehlen koennen. Nur die
// Werte, kein Code-Teilen zwischen Astro/Website und Expo/App noetig fuer
// diese kleine Demo-Komponente.
export interface AccentPalette {
  id: string;
  name: string;
  dark: { accent: string; accentText: string };
}

export const ACCENT_PALETTES: AccentPalette[] = [
  { id: 'samtvorhang', name: 'Samtvorhang', dark: { accent: '#FB7185', accentText: '#14121F' } },
  { id: 'popcorn', name: 'Popcorn', dark: { accent: '#FB923C', accentText: '#14121F' } },
  { id: 'scheinwerfer', name: 'Scheinwerfer', dark: { accent: '#FBBF24', accentText: '#14121F' } },
  { id: 'filmrolle', name: 'Filmrolle', dark: { accent: '#34D399', accentText: '#14121F' } },
  { id: 'leinwand', name: 'Leinwand', dark: { accent: '#22D3EE', accentText: '#14121F' } },
  { id: 'nachtvorstellung', name: 'Nachtvorstellung', dark: { accent: '#60A5FA', accentText: '#14121F' } },
  { id: 'kinosaal', name: 'Kinosaal', dark: { accent: '#8B7FFF', accentText: '#14121F' } },
  { id: 'abspann', name: 'Abspann', dark: { accent: '#C084FC', accentText: '#14121F' } },
  { id: 'kinoliebe', name: 'Kinoliebe', dark: { accent: '#F472B6', accentText: '#14121F' } },
  { id: 'schwarzweissfilm', name: 'Schwarzweißfilm', dark: { accent: '#A1A1AA', accentText: '#14121F' } },
];
