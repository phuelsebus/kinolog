import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

// TODO (confirm-flow-ui Todo): Vollstaendiges Formular - Kino (Suche/Neuanlage),
// Datum, Uhrzeit, optional Saal/Reihe/Sitz/Preis, Bewertung, Kommentar.
// Speichert ueber CinemaVisitService.createVisit.
export default function NewVisitScreen() {
  const { movieId, movieTitle, moviePosterUrl } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    moviePosterUrl?: string;
  }>();

  return (
    <View style={styles.container}>
      {moviePosterUrl ? <Image source={{ uri: moviePosterUrl }} style={styles.poster} /> : null}
      <Text style={styles.title}>{movieTitle}</Text>
      <Text style={styles.hint}>Kinobesuch-Formular folgt (Platzhalter). movieId: {movieId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  poster: { width: 120, height: 180, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  hint: { color: '#666', textAlign: 'center' },
});
