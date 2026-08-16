import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// TODO (library-ui Todo): Chronologische Liste aller CinemaVisit-Eintraege
// (Poster, Filmtitel, Datum, Kino, Bewertung) ueber CinemaVisitService laden.
export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meine Kinobesuche</Text>
      <Text>Noch keine Eintraege (Platzhalter)</Text>

      <Pressable style={styles.fab} onPress={() => router.push('/search-movie')}>
        <Text style={styles.fabText}>+ Kinobesuch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  fab: {
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fabText: { color: '#fff', fontWeight: '600' },
});
