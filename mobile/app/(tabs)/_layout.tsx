import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Image, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { ThemeToggleButton } from '../../src/theme/ThemeToggleButton';

// Schuetzt die Bibliothek/Profil-Tabs: ohne gueltige Session geht es zurueck zum Login.
export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        // Ohne dies faellt React Navigation beim Tab-Wechsel kurz auf einen
        // weissen Default-Hintergrund zurueck, bevor der Screen-Inhalt
        // rendert - auf langsameren Geraeten sichtbar als weisses Aufblitzen.
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bibliothek',
          headerLeft: () => (
            <Image
              source={require('../../assets/android-icon-foreground.png')}
              style={{ width: 40, height: 40, marginLeft: 10 }}
            />
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'film' : 'film-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
