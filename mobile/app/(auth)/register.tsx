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
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  // Button sitzt unten - ohne manuelles Scrollen faehrt die Tastatur sonst
  // einfach darueber (gleiches Muster wie im Kinobesuch-Formular/Login).
  function scrollToEnd() {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: signUpError } = await signUp(email.trim(), password, displayName.trim());
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Account erstellen</Text>

      <TextInput
        style={styles.input}
        placeholder="Anzeigename (optional)"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort (mind. 8 Zeichen)"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
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
          <Text style={styles.buttonText}>Registrieren</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Schon einen Account? Jetzt anmelden
      </Link>
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
      paddingBottom: spacing.xxl * 3,
      gap: spacing.md,
    },
    title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm, color: colors.textPrimary, letterSpacing: -0.5 },
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
