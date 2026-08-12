import { StyleSheet, Text, View } from 'react-native';

// TODO (auth-flow Todo): Registrierungs-Formular mit Supabase Auth (signUp) implementieren.
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text>Registrierung (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
