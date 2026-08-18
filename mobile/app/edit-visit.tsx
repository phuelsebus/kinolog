import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import VisitForm from '../src/components/VisitForm';
import { cinemaVisitService } from '../src/services/CinemaVisitService';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';
import type { CinemaVisitWithDetails } from '../src/types/models';

// Bearbeiten eines bestehenden Kinobesuchs. Laedt den Visit per getVisit und
// befuellt VisitForm (dasselbe Formular wie new-visit.tsx) damit vor. Der Film
// ist per "Film ändern" ebenfalls aenderbar - search-movie.tsx navigiert nach
// Auswahl (via editVisitId Param) mit den neuen Movie-Daten als Override-Params
// hierher zurueck (siehe search-movie.tsx handleSelect).
export default function EditVisitScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    visitId,
    movieId: overrideMovieId,
    movieTitle: overrideMovieTitle,
    moviePosterUrl: overrideMoviePosterUrl,
  } = useLocalSearchParams<{
    visitId: string;
    movieId?: string;
    movieTitle?: string;
    moviePosterUrl?: string;
  }>();

  const [visit, setVisit] = useState<CinemaVisitWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    cinemaVisitService
      .getVisit(visitId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setLoadError('Kinobesuch nicht gefunden.');
          return;
        }
        setVisit(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Kinobesuch konnte nicht geladen werden.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loadError || !visit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{loadError ?? 'Kinobesuch nicht gefunden.'}</Text>
      </View>
    );
  }

  const effectiveMovieId = overrideMovieId ?? visit.movieId;
  const effectiveMovieTitle = overrideMovieTitle ?? visit.movie.title;
  const effectiveMoviePosterUrl = overrideMoviePosterUrl ?? visit.movie.posterUrl ?? undefined;

  return (
    <VisitForm
      header={
        <View style={styles.movieRow}>
          {effectiveMoviePosterUrl ? (
            <Image source={{ uri: effectiveMoviePosterUrl }} style={styles.poster} />
          ) : null}
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{effectiveMovieTitle}</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/search-movie', params: { editVisitId: visitId } })
              }
            >
              <Text style={styles.changeLink}>Film ändern</Text>
            </Pressable>
          </View>
        </View>
      }
      initialCinema={visit.cinema}
      initialValues={{
        watchedAt: visit.watchedAt,
        showTime: visit.showTime ? visit.showTime.slice(0, 5) : undefined,
        hall: visit.hall ?? undefined,
        row: visit.row ?? undefined,
        seat: visit.seat ?? undefined,
        ticketPrice: visit.ticketPrice ?? undefined,
        ticketType: visit.ticketType ?? undefined,
        rating: visit.rating ?? undefined,
        comment: visit.comment ?? undefined,
      }}
      submitLabel="Änderungen speichern"
      submitErrorMessage="Kinobesuch konnte nicht aktualisiert werden. Bitte versuche es erneut."
      onSubmit={async (values) => {
        await cinemaVisitService.updateVisit(visit.id, { movieId: effectiveMovieId, ...values });
        router.back();
      }}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    error: { color: colors.error, textAlign: 'center' },
    movieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    poster: { width: 60, height: 90, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
    movieInfo: { flex: 1, gap: spacing.xs },
    movieTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1, color: colors.textPrimary },
    changeLink: { color: colors.accent, fontWeight: '500' },
  });
}
