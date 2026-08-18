import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import VisitForm from '../src/components/VisitForm';
import { cinemaVisitService } from '../src/services/CinemaVisitService';

// Kinobesuch-Formular UI (idee.md: manuelle Eingabe der Kinobesuch-Details).
// Ersetzt den urspruenglich geplanten OCR-Bestaetigungsflow - Nutzerentscheidung
// 2026-08-13: Hauptflow ist manuelle Filmsuche + manuelle Detaileingabe.
export default function NewVisitScreen() {
  const router = useRouter();
  const { movieId, movieTitle, moviePosterUrl } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    moviePosterUrl?: string;
  }>();

  return (
    <VisitForm
      header={
        <View style={styles.movieRow}>
          {moviePosterUrl ? <Image source={{ uri: moviePosterUrl }} style={styles.poster} /> : null}
          <Text style={styles.movieTitle}>{movieTitle}</Text>
        </View>
      }
      submitLabel="Speichern"
      submitErrorMessage="Kinobesuch konnte nicht gespeichert werden. Bitte versuche es erneut."
      onSubmit={async (values) => {
        await cinemaVisitService.createVisit({ movieId, ...values });
        router.replace('/(tabs)');
      }}
    />
  );
}

const styles = StyleSheet.create({
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  poster: { width: 60, height: 90, borderRadius: 6 },
  movieTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
});
