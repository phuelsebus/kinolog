import { Link, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

// react-native-web zeigt sonst einen blauen Browser-Standard-Fokusring auf
// TextInputs, den native iOS/Android nie anzeigen - hier fuer den Web-Test
// unterdrueckt, damit die Vorschau dem echten App-Look entspricht.
const webNoOutline = Platform.OS === 'web' ? { outlineWidth: 0 } : null;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;

  // Kino-Projektor-Intro: Logo + Titel flackern kurz auf (wie eine
  // Projektorlampe, die hochfaehrt), bevor sie mit sanftem Ueberschwung einrasten.
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 0.5, duration: 180, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 0.8, duration: 180, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 0.1, duration: 130, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 28, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoOpacity, logoScale]);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View
          style={[styles.titleRow, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        >
          <Text style={styles.title}>KinoLiebe</Text>
          <Image
            source={require('../../assets/android-icon-foreground.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.subtitle}>Melde dich an, um deine Kinobesuche zu sehen.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, webNoOutline]}
          placeholder="E-Mail"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, webNoOutline]}
          placeholder="Passwort"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
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
            <Text style={styles.buttonText}>Anmelden</Text>
          )}
        </Pressable>
      </View>

      <Link href="/(auth)/register" style={styles.link}>
        Noch keinen Account? Jetzt registrieren
      </Link>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    logo: { width: 46, height: 46 },
    title: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: colors.textPrimary, letterSpacing: -0.5 },
    subtitle: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xs, fontSize: 15 },
    form: { gap: spacing.md },
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
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    buttonPressed: { opacity: 0.85 },
    buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '600' },
    error: { color: colors.error, textAlign: 'center' },
    link: { textAlign: 'center', marginTop: spacing.lg, color: colors.accent, fontWeight: '500' },
  });
}
