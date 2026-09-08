import { useState } from 'preact/hooks';
import { ACCENT_PALETTES } from '../../lib/palettes';

// Interaktive Vorschau der echten Akzentfarben-Auswahl aus der App (Profil
// -> "Design"). Zeigt kein 1:1-Rebuild der App-UI, sondern eine kleine
// eigene Beispielkarte, deren Akzent live mit der gewaehlten Murmel wechselt.
export default function PaletteDemo() {
  const [selected, setSelected] = useState(ACCENT_PALETTES[6]); // "Kinosaal" als Default, wie in der App

  return (
    <div class="mt-8">
      <div class="grid grid-cols-5 justify-items-center gap-y-3">
        {ACCENT_PALETTES.map((palette) => {
          const isSelected = palette.id === selected.id;
          return (
            <button
              key={palette.id}
              type="button"
              aria-label={`Farbpalette ${palette.name}`}
              aria-pressed={isSelected}
              onClick={() => setSelected(palette)}
              class="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:scale-105"
              style={{ borderColor: isSelected ? palette.dark.accent : 'transparent' }}
            >
              <span
                class="relative block h-8 w-8 overflow-hidden rounded-full shadow-inner"
                style={{ backgroundColor: palette.dark.accent }}
              >
                <span class="absolute left-1.5 top-1 h-2 w-3 -rotate-[20deg] rounded-full bg-white/40" />
                {isSelected && (
                  <svg
                    class="absolute inset-0 m-auto h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={palette.dark.accentText}
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div
        class="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors"
        style={{ borderColor: `${selected.dark.accent}55` }}
      >
        <div>
          <p class="text-sm font-semibold text-cream">{selected.name}</p>
          <p class="mt-1 text-xs text-mist">So sieht dein Akzent in der App aus</p>
        </div>
        <span
          class="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          style={{ backgroundColor: selected.dark.accent, color: selected.dark.accentText }}
        >
          Kinobesuch
        </span>
      </div>
    </div>
  );
}
