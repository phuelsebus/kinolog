import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeContext';

// Reiner Platzhalter fuer expo-router: Ein Deep-Link wie
// "kinolog://auth-callback?..." (Passwort-Reset, siehe AuthContext.tsx)
// muss auf eine existierende Route zeigen, sonst zeigt expo-router beim
// Oeffnen "Unmatched Route" statt den Link zu verarbeiten. Die eigentliche
// Token-Verarbeitung + Weiterleitung zu reset-password passiert im
// app-weiten Linking-Listener in AuthContext.tsx, der auf dieselbe URL
// reagiert - dieser Screen ist nur die kurze Uebergangsanzeige, bis das
// passiert (in der Regel nur ein kurzes Aufblitzen).
export default function AuthCallbackScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
