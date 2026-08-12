import { StyleSheet, Text, View } from 'react-native';

// TODO (auth-flow Todo): Nutzerprofil (displayName, email) + Logout anzeigen.
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Profil (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
