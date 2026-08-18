import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';

// Kompakter Hell/Dunkel-Switch fuer den App-Header (statt einer Einstellung
// im Profil-Screen) - ueberall dort eingehaengt, wo ein Stack/Tabs-Header
// sichtbar ist (siehe app/_layout.tsx und app/(tabs)/_layout.tsx).
export function ThemeToggleButton() {
  const { colors, mode, toggleTheme } = useTheme();

  return (
    <Pressable onPress={toggleTheme} hitSlop={8} style={styles.button}>
      <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 4 },
});
