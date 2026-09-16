import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';

// Eigener Fallback fuer nicht existierende/ungueltige Routen (z.B. ein
// kaputter oder veralteter Deep-Link) - ohne diese Datei zeigt expo-router
// seinen eigenen, unbranded "Unmatched Route"-Screen.
export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name="film-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.title}>Seite nicht gefunden</Text>
      <Text style={styles.subtitle}>
        Diese Seite gibt es nicht (mehr) - vielleicht über einen alten Link geöffnet?
      </Text>
      <Link href="/" style={styles.link}>
        Zurück zur Bibliothek
      </Link>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
    },
    link: {
      marginTop: spacing.lg,
      color: colors.accent,
      fontWeight: '600',
      fontSize: 16,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
    },
  });
}
