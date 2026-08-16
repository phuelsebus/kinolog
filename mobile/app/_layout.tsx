import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="visit/[id]" options={{ title: 'Kinobesuch' }} />
        <Stack.Screen name="search-movie" options={{ title: 'Film suchen', presentation: 'modal' }} />
        <Stack.Screen name="new-visit" options={{ title: 'Kinobesuch erfassen', presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
