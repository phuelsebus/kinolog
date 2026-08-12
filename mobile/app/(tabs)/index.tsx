import { StyleSheet, Text, View } from 'react-native';

// TODO (library-ui Todo): Chronologische Liste aller CinemaVisit-Eintraege
// (Poster, Filmtitel, Datum, Kino, Bewertung) ueber CinemaVisitService laden.
export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meine Kinobesuche</Text>
      <Text>Noch keine Eintraege (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
