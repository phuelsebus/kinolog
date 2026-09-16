import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { ThemeToggleButton } from '../src/theme/ThemeToggleButton';

// Fehler-/Absturz-Tracking (siehe Code-Audit: bisher landeten Fehler nur in
// console.error, ohne jede Sichtbarkeit auf echte Nutzer-Abstuerze). Bewusst
// minimal gehalten - nur Error Monitoring, kein Tracing/Session
// Replay/Metrics (unnoetiges Kontingent fuer diese Projektgroesse). In der
// lokalen Entwicklung deaktiviert (enabled: !__DEV__), damit Test-/Debug-
// Sessions nicht das Sentry-Dashboard mit Rauschen fuellen.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0,
});

function ThemedStack() {
  const { colors, mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerRight: () => <ThemeToggleButton />,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="visit/[id]" options={{ title: 'Kinobesuch' }} />
        <Stack.Screen name="movie/[id]" options={{ title: 'Film' }} />
        <Stack.Screen name="scan-ticket" options={{ title: 'Ticket scannen', presentation: 'modal' }} />
        <Stack.Screen name="search-movie" options={{ title: 'Film suchen', presentation: 'modal' }} />
        <Stack.Screen name="new-visit" options={{ title: 'Kinobesuch erfassen', presentation: 'modal' }} />
        <Stack.Screen name="edit-visit" options={{ title: 'Kinobesuch bearbeiten', presentation: 'modal' }} />
        <Stack.Screen name="wrapped" options={{ title: 'Kino-Jahresrückblick', presentation: 'modal' }} />
        <Stack.Screen name="legal/imprint" options={{ title: 'Impressum' }} />
        <Stack.Screen name="legal/privacy" options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Nutzungsbedingungen' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function RootLayout() {
  return (
    // Noetig fuer Swipe-Gesten (Wisch-zum-Loeschen in Bibliothek/Watchlist,
    // siehe SwipeableRow.tsx) - ohne diesen Wrapper funktionieren
    // react-native-gesture-handler-Gesten auf Android nicht zuverlaessig.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStack />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap faengt Render-Fehler ab, die sonst unbemerkt zum weissen
// Bildschirm fuehren wuerden, und haengt automatisch Touch-Breadcrumbs an.
export default Sentry.wrap(RootLayout);
