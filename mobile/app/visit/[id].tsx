import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// TODO (detail-ui Todo): Vollstaendige Filmdaten, Kinodaten, Ticketinfos,
// Originalticket-Bild (aus Supabase Storage), Trailer, Bewertung und Notiz anzeigen.
export default function CinemaVisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text>Detailseite fuer Kinobesuch {id} (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
