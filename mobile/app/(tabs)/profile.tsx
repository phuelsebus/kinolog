import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const email = session?.user.email ?? 'Unbekannt';
  const displayName = (session?.user.user_metadata?.display_name as string | undefined) || null;

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
