// Vorlage, keine Rechtsberatung. Platzhalter unten (in eckigen Klammern)
// durch echte Angaben ersetzen. Vor oeffentlichem Store-Release empfiehlt
// sich eine kurze rechtliche Pruefung dieses Textes.
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>1. Verantwortlicher</Text>
      <Text style={styles.bodyText}>
        [DEIN VOLLSTÄNDIGER NAME]{'\n'}
        [STRASSE UND HAUSNUMMER], [PLZ UND ORT]{'\n'}
        E-Mail: [DEINE E-MAIL-ADRESSE]{'\n'}
        (siehe auch Impressum)
      </Text>

      <Text style={styles.sectionTitle}>2. Welche Daten wir verarbeiten</Text>
      <Text style={styles.bodyText}>
        • Account: E-Mail-Adresse, Anzeigename, Passwort (verschlüsselt gespeichert){'\n'}
        • Kinobesuche: Filmdaten, Kino, Datum/Uhrzeit, Saal/Reihe/Sitz, Preis, Bewertung, Notizen{'\n'}
        • Ticketfotos: von dir freiwillig hochgeladene Bilder deiner Kinokarten{'\n'}
        • Kino-Standortdaten: Koordinaten von Kinos (keine Standort-/Bewegungsdaten von dir selbst)
      </Text>

      <Text style={styles.sectionTitle}>3. Zweck der Verarbeitung</Text>
      <Text style={styles.bodyText}>
        Bereitstellung der App-Funktionen: Anmeldung, Speichern und Anzeigen deiner persönlichen
        Kinobesuch-Bibliothek.
      </Text>

      <Text style={styles.sectionTitle}>4. Rechtsgrundlage</Text>
      <Text style={styles.bodyText}>Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags mit dir).</Text>

      <Text style={styles.sectionTitle}>5. Empfänger / Auftragsverarbeiter</Text>
      <Text style={styles.bodyText}>
        • Supabase Inc. – Hosting, Datenbank, Authentifizierung, Dateispeicher (Serverstandort EU/Paris){'\n'}
        • The Movie Database (TMDB) – Filmsuche und Filmdaten{'\n'}
        • OpenAI – nur wenn du den Ticket-Scan nutzt: Analyse deines Ticketfotos zur Texterkennung{'\n'}
        • OpenStreetMap (Nominatim/Overpass) – nur bei der Kino-Suche: deine Sucheingabe wird übermittelt
      </Text>

      <Text style={styles.sectionTitle}>6. Speicherdauer</Text>
      <Text style={styles.bodyText}>
        Deine Daten werden gespeichert, bis du deinen Account löschst oder uns zur Löschung aufforderst.
      </Text>

      <Text style={styles.sectionTitle}>7. Deine Rechte</Text>
      <Text style={styles.bodyText}>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde. Kontaktiere uns dafür unter [DEINE E-MAIL-ADRESSE].
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.xs, color: colors.textPrimary },
    bodyText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  });
}
