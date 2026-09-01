import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { ThemeToggleButton } from '../src/theme/ThemeToggleButton';

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
