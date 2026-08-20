// Vorlage, keine Rechtsberatung. Platzhalter unten (in eckigen Klammern)
// durch echte Angaben ersetzen. Bei geplantem oeffentlichem Store-Release
// empfiehlt sich eine kurze rechtliche Pruefung, insbesondere ob fuer die
// konkrete Nutzung (privates Hobby-Projekt vs. spaeter evtl. geschaeftsmaessig)
// eine Impressumspflicht nach § 5 DDG greift.
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function ImprintScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Angaben gemäß § 5 DDG</Text>
      <Text style={styles.bodyText}>
        [DEIN VOLLSTÄNDIGER NAME]{'\n'}
        [STRASSE UND HAUSNUMMER]{'\n'}
        [PLZ UND ORT]{'\n'}
        Deutschland
      </Text>

      <Text style={styles.sectionTitle}>Kontakt</Text>
      <Text style={styles.bodyText}>E-Mail: [DEINE E-MAIL-ADRESSE]</Text>

      <Text style={styles.sectionTitle}>Hinweis</Text>
      <Text style={styles.bodyText}>
        KinoLog ist ein privates, nicht-kommerzielles Hobby-Projekt zum persönlichen Archivieren von Kinobesuchen.
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
