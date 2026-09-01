import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import VisitForm from '../src/components/VisitForm';
import { cinemaVisitService } from '../src/services/CinemaVisitService';
import { saveTicketExtraction, type ScanHandoff } from '../src/services/TicketScanner';
import { watchlistService } from '../src/services/WatchlistService';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function parseScanHandoff(raw: string | undefined): ScanHandoff | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScanHandoff;
  } catch {
    return null;
  }
}

// Kinobesuch-Formular UI (idee.md: manuelle Eingabe der Kinobesuch-Details).
// Wird sowohl fuer die manuelle Filmsuche als auch fuer den Ticket-Scan-Flow
// verwendet (siehe scan-ticket.tsx -> search-movie.tsx -> hier): im Scan-Fall
// sind Kino-Suche und mehrere Felder ueber den "scan"-Param vorbefuellt,
// der Nutzer bestaetigt/korrigiert wie im manuellen Flow (idee.md Abschnitt 7).
export default function NewVisitScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { movieId, movieTitle, moviePosterUrl, scan, watchlistItemId } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    moviePosterUrl?: string;
    scan?: string;
    watchlistItemId?: string;
  }>();

  const scanHandoff = useMemo(() => parseScanHandoff(scan), [scan]);

  return (
    <VisitForm
      header={
        <View style={styles.movieRow}>
          {moviePosterUrl ? <Image source={{ uri: moviePosterUrl }} style={styles.poster} /> : null}
          <Text style={styles.movieTitle}>{movieTitle}</Text>
        </View>
      }
      initialCinemaQuery={scanHandoff?.data.cinema}
      initialValues={
        scanHandoff
          ? {
              watchedAt: scanHandoff.data.date && ISO_DATE_REGEX.test(scanHandoff.data.date) ? scanHandoff.data.date : undefined,
              showTime: scanHandoff.data.time && TIME_REGEX.test(scanHandoff.data.time) ? scanHandoff.data.time : undefined,
              hall: scanHandoff.data.hall,
              row: scanHandoff.data.row,
              seat: scanHandoff.data.seat,
              ticketPrice: scanHandoff.data.price,
            }
          : undefined
      }
      submitLabel="Speichern"
      submitErrorMessage="Kinobesuch konnte nicht gespeichert werden. Bitte versuche es erneut."
      onSubmit={async (values) => {
        const visit = await cinemaVisitService.createVisit({
          movieId,
          ticketImageUrl: scanHandoff?.imagePath,
          ...values,
        });
        if (scanHandoff) {
          saveTicketExtraction(visit.id, scanHandoff);
        }
        if (watchlistItemId) {
          // Best-effort wie saveTicketExtraction - der Kinobesuch ist bereits
          // gespeichert, ein Fehler hier soll das nicht als Fehler anzeigen.
          watchlistService.remove(watchlistItemId).catch((err) => {
            console.error('Watchlist-Eintrag konnte nicht entfernt werden:', err);
          });
        }
        router.replace('/(tabs)');
      }}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    movieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    poster: { width: 60, height: 90, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
    movieTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1, color: colors.textPrimary },
  });
}
