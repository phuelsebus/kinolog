// Vorlage, keine Rechtsberatung. Vor oeffentlichem Store-Release empfiehlt
// sich eine kurze rechtliche Pruefung dieses Textes.
import { Link } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme/ThemeContext";
import type { ThemeColors } from "../../src/theme/colors";

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>1. Geltungsbereich</Text>
      <Text style={styles.bodyText}>
        Diese Nutzungsbedingungen gelten für die Nutzung der App KinoLiebe
        durch dich als Nutzer. Mit der Registrierung akzeptierst du diese
        Bedingungen.
      </Text>

      <Text style={styles.sectionTitle}>2. Beschreibung des Dienstes</Text>
      <Text style={styles.bodyText}>
        KinoLiebe ist ein kostenloses, privates Hobby-Projekt zum
        persönlichen Archivieren von Kinobesuchen (Filme, Kinos, Bewertungen,
        Ticketfotos). Es besteht kein Anspruch auf ununterbrochene
        Verfügbarkeit oder Weiterentwicklung der App.
      </Text>

      <Text style={styles.sectionTitle}>3. Nutzerkonto</Text>
      <Text style={styles.bodyText}>
        Für die Nutzung ist ein Konto erforderlich (E-Mail/Passwort oder
        Anmeldung über Google/Discord). Du bist für die Sicherheit deiner
        Zugangsdaten selbst verantwortlich und trägst dafür Sorge, dass
        Dritte keinen Zugriff auf dein Konto erhalten.
      </Text>

      <Text style={styles.sectionTitle}>4. Deine Inhalte</Text>
      <Text style={styles.bodyText}>
        Alle von dir eingetragenen Daten (Kinobesuche, Notizen, Ticketfotos,
        Profilbild) bleiben dein Eigentum. Wir nutzen sie ausschließlich zur
        Bereitstellung der App-Funktionen, nicht für eigene Zwecke Dritter.
        Details dazu in der{" "}
        <Link href="/legal/privacy" style={styles.link}>
          Datenschutzerklärung
        </Link>
        .
      </Text>

      <Text style={styles.sectionTitle}>5. Haftungsausschluss</Text>
      <Text style={styles.bodyText}>
        Die App wird "wie besehen" ohne Garantie auf Fehlerfreiheit oder
        ständige Verfügbarkeit bereitgestellt. Für Datenverlust wird nur im
        gesetzlich vorgeschriebenen Umfang gehaftet. Filmdaten stammen von
        TMDB und werden ohne Gewähr für Richtigkeit übernommen.
      </Text>

      <Text style={styles.sectionTitle}>6. Änderungen</Text>
      <Text style={styles.bodyText}>
        Diese Bedingungen können bei Bedarf angepasst werden, z.B. wenn neue
        Funktionen hinzukommen. Wesentliche Änderungen werden in der App
        kommuniziert.
      </Text>

      <Text style={styles.sectionTitle}>7. Kündigung / Konto löschen</Text>
      <Text style={styles.bodyText}>
        Du kannst dein Konto jederzeit selbst löschen (Profil → "Konto
        löschen"). Damit werden auch alle zugehörigen Daten unwiderruflich
        entfernt.
      </Text>

      <Text style={styles.sectionTitle}>8. Anwendbares Recht</Text>
      <Text style={styles.bodyText}>
        Es gilt deutsches Recht.
      </Text>

      <Text style={styles.sectionTitle}>9. Kontakt</Text>
      <Text style={styles.bodyText}>
        Fragen zu diesen Bedingungen: phuelsebusxx@gmail.com
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.xs,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
      color: colors.textPrimary,
    },
    bodyText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
    link: { color: colors.accent },
  });
}
