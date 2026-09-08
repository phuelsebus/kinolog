import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AccentPalette } from './colors';
import { useTheme } from './ThemeContext';

interface Props {
  palette: AccentPalette;
  selected: boolean;
  onPress: () => void;
  /** Aussendurchmesser (Touch-Target) in px - siehe getMarbleSize() in profile.tsx, das die Groesse an die Bildschirmbreite anpasst. */
  size?: number;
}

const DEFAULT_SIZE = 44;
// Anteile am hitArea-Durchmesser, gleiches Verhaeltnis wie die urspruenglich
// fest verdrahteten 44/40/32px (Ring 4px kleiner als hitArea, Murmel 8px
// kleiner als Ring), nur jetzt proportional statt fix.
const RING_INSET = 4;
const MARBLE_INSET = 8;

// Die "Murmel": ein rundes Farb-Swatch fuer die Akzentfarben-Auswahl im
// Profil. Der helle Glanzpunkt oben links simuliert eine Kugel-Oberflaeche
// (zwei uebereinanderliegende Kreise, ohne zusaetzliche Blur-Library), der
// Aussenring markiert die aktuell aktive Auswahl. size ist bewusst ein Prop
// statt einer festen Konstante, damit die Murmeln sich an unterschiedliche
// Bildschirmbreiten anpassen koennen, statt bei vielen Paletten unschoen in
// eine ungleichmaessige zweite Reihe umzubrechen.
export function PaletteMarble({ palette, selected, onPress, size = DEFAULT_SIZE }: Props) {
  const { mode } = useTheme();
  const accent = mode === 'dark' ? palette.dark.accent : palette.light.accent;
  const accentText = mode === 'dark' ? palette.dark.accentText : palette.light.accentText;

  const ringSize = size - RING_INSET;
  const marbleSize = ringSize - MARBLE_INSET;
  // Effektive Tapflaeche bleibt bei kleinen Bildschirmen trotzdem nahe an
  // den empfohlenen 44pt (Apple HIG), auch wenn die sichtbare Murmel kleiner ist.
  const hitSlop = Math.max(0, Math.round((44 - size) / 2));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Farbpalette ${palette.name}`}
      accessibilityState={{ selected }}
      hitSlop={hitSlop}
      style={[styles.hitArea, { width: size, height: size }]}
    >
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: selected ? accent : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.marble,
            { width: marbleSize, height: marbleSize, borderRadius: marbleSize / 2, backgroundColor: accent },
          ]}
        >
          <View
            style={[
              styles.gloss,
              {
                width: marbleSize * 0.38,
                height: marbleSize * 0.25,
                borderRadius: marbleSize * 0.2,
                top: marbleSize * 0.12,
                left: marbleSize * 0.16,
              },
            ]}
          />
          {selected ? (
            <Ionicons name="checkmark" size={Math.max(10, Math.round(marbleSize * 0.42))} color={accentText} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  marble: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gloss: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ rotate: '-20deg' }] },
});
