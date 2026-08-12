import { StyleSheet, Text, View } from 'react-native';

// TODO (ticket-capture-ui Todo): Kamera (expo-camera) / Bildimport (expo-image-picker),
// Upload zu Supabase Storage, danach TicketScanner Edge Function aufrufen und zu /confirm navigieren.
export default function CaptureScreen() {
  return (
    <View style={styles.container}>
      <Text>Ticket fotografieren/importieren (Platzhalter)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
