import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { profileService } from '../../src/services/ProfileService';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const email = session?.user.email ?? 'Unbekannt';
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    profileService
      .getDisplayName(session.user.id)
      .then(setDisplayName)
      .catch(() => setDisplayName(null));
  }, [session?.user.id]);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.accent} />
        </View>
        {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Rechtliches</Text>

        <Pressable style={({ pressed }) => [styles.legalRow, pressed && styles.legalRowPressed]} onPress={() => router.push('/legal/imprint')}>
          <Text style={styles.legalRowText}>Impressum</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.legalRow, pressed && styles.legalRowPressed]} onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.legalRowText}>Datenschutz</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.tmdbNotice}>
          Filmdaten von TMDB. Dieses Produkt verwendet die TMDB API, wird aber nicht von TMDB gebilligt oder
          zertifiziert.{' '}
          <Text style={styles.tmdbLink} onPress={() => Linking.openURL('https://www.themoviedb.org/')}>
            themoviedb.org
          </Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.signOutText}>Abmelden</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background },
    card: {
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xl,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    name: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    email: { color: colors.textSecondary },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    sectionLabel: { fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    legalRowPressed: { opacity: 0.6 },
    legalRowText: { color: colors.textPrimary, fontSize: 15 },
    tmdbNotice: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
    tmdbLink: { color: colors.accent },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      marginTop: 'auto',
    },
    signOutButtonPressed: { opacity: 0.75 },
    signOutText: { color: colors.error, fontWeight: '600' },
  });
}
