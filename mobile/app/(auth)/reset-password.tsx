import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

// Nur ueber den Recovery-Link erreichbar (siehe AuthContext.tsx,
// handleRecoveryUrl navigiert erst hierher, nachdem setSession mit den
// Tokens aus der E-Mail erfolgreich war) - ohne aktive Session gibt es
// nichts zu tun, updateUser wuerde ohnehin fehlschlagen.
export default function ResetPasswordScreen() {
  const { session, updatePassword } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Letztes Feld vor dem Submit-Button - ohne manuelles Scrollen faehrt die
  // Tastatur sonst darueber (gleiches Muster wie Login/Registrierung).
  function scrollToEnd() {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
  }

  async function handleSubmit() {
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    router.replace('/(tabs)');
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>
          Dieser Link ist nicht mehr gültig. Fordere einen neuen Passwort-Reset-Link an.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, { marginTop: spacing.lg }]}
          onPress={() => router.replace('/(auth)/forgot-password')}
        >
          <Text style={styles.buttonText}>Neuen Link anfordern</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Neues Passwort</Text>
        <Text style={styles.subtitle}>Vergib ein neues Passwort für dein Konto.</Text>

        <TextInput
          style={styles.input}
          placeholder="Neues Passwort (mind. 8 Zeichen)"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort bestätigen"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete="password-new"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onFocus={scrollToEnd}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.buttonText}>Passwort speichern</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 15,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonPressed: { opacity: 0.85 },
    buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '600' },
    error: { color: colors.error, textAlign: 'center' },
  });
}
