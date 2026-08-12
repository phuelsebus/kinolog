import { StyleSheet, Text, View } from 'react-native';

// TODO (confirm-flow-ui Todo): Erkannte Ticketdaten (Film, Datum, Kino, ...) anzeigen,
// manuelle Korrektur ermoeglichen, Fehlerfaelle behandeln (nicht erkannt, mehrere Kandidaten),
// beim Bestaetigen CinemaVisitService.createVisit aufrufen.
export default function ConfirmScreen() {
  return (
    <View style={styles.container}>
      <Text>Erkannte Daten bestaetigen (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
