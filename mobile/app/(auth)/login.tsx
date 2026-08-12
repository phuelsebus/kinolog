import { StyleSheet, Text, View } from 'react-native';

// TODO (auth-flow Todo): Login-Formular mit Supabase Auth (signInWithPassword) implementieren.
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KinoLog</Text>
      <Text>Login (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '600' },
});
