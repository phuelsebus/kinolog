import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="visit/[id]" options={{ title: 'Kinobesuch' }} />
        <Stack.Screen name="capture" options={{ title: 'Ticket erfassen', presentation: 'modal' }} />
        <Stack.Screen name="confirm" options={{ title: 'Bestätigen', presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
