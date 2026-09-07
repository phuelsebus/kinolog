import { Link, router } from 'expo-router';
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
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

// Passwort-vergessen-Einstieg: schickt den Reset-Link per E-Mail (siehe
// AuthContext.sendPasswordReset). Der eigentliche Link fuehrt zurueck in die
// App und landet ueber den Linking-Listener in AuthContext.tsx auf
// reset-password.tsx, wo das neue Passwort gesetzt wird.
export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Einziges Feld vor dem Submit-Button - ohne manuelles Scrollen faehrt die
  // Tastatur sonst darueber (gleiches Muster wie Login/Registrierung).
  function scrollToEnd() {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
  }

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Bitte E-Mail eingeben.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: resetError } = await sendPasswordReset(email.trim());
    setSubmitting(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Passwort vergessen?</Text>
        <Text style={styles.subtitle}>
          Gib deine E-Mail-Adresse ein, wir schicken dir einen Link zum Zurücksetzen.
        </Text>

        {sent ? (
          <>
            <Text style={styles.sentText}>
              Falls ein Konto mit dieser E-Mail existiert, wurde gerade ein Link zum Zurücksetzen
              verschickt. Prüfe dein Postfach (auch den Spam-Ordner).
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.buttonText}>Zurück zur Anmeldung</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="E-Mail"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onFocus={scrollToEnd}
              autoFocus
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
                <Text style={styles.buttonText}>Link senden</Text>
              )}
            </Pressable>

            <Link href="/(auth)/login" style={styles.link}>
              Zurück zur Anmeldung
            </Link>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
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
    sentText: {
      textAlign: 'center',
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: spacing.md,
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
    link: { textAlign: 'center', marginTop: spacing.lg, color: colors.accent, fontWeight: '500' },
  });
}
