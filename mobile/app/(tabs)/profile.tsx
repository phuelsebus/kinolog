import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const email = session?.user.email ?? 'Unbekannt';
  const displayName = (session?.user.user_metadata?.display_name as string | undefined) || null;

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
      <Text style={styles.email}>{email}</Text>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Abmelden</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  name: { fontSize: 20, fontWeight: '600' },
  email: { color: '#666', marginBottom: 16 },
  button: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
