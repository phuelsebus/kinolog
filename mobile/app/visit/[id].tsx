import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getTicketImageSignedUrl } from '../../src/lib/ticketImages';
import { cinemaVisitService } from '../../src/services/CinemaVisitService';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';
import type { CinemaVisitWithDetails, TicketType } from '../../src/types/models';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  // Postgres liefert "HH:MM:SS" - fuer die Anzeige reicht "HH:MM".
  return time.slice(0, 5);
}

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  original: 'Originalticket',
  online: 'Online-Ticket',
  unknown: 'Unbekannt',
};

// Detailseite eines Kinobesuchs (idee.md Abschnitt 8): vollstaendige
// Filmdaten, Kinodaten, Ticketinformationen, Originalticket, Trailer,
// Bewertung und persoenliche Notiz.
export default function CinemaVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [visit, setVisit] = useState<CinemaVisitWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);
  const [updatingRating, setUpdatingRating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cinemaVisitService.getVisit(id);
      setVisit(data);
      if (data?.ticketImageUrl) {
        getTicketImageSignedUrl(data.ticketImageUrl)
          .then(setTicketImageUrl)
          .catch(() => setTicketImageUrl(null));
      }
    } catch {
      setError('Kinobesuch konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Neu laden bei Fokus, damit Aenderungen aus /edit-visit (Kino, Datum, ...)
  // nach der Rueckkehr sichtbar sind (gleiches Muster wie (tabs)/index.tsx).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDelete() {
    if (!visit) return;
    setDeleting(true);
    try {
      await cinemaVisitService.deleteVisit(visit.id);
      router.replace('/(tabs)');
    } catch {
      setError('Kinobesuch konnte nicht gelöscht werden.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function handleRatingChange(newRating: number) {
    if (!visit) return;
    const rating = visit.rating === newRating ? 0 : newRating;
    setUpdatingRating(true);
    try {
      const updated = await cinemaVisitService.updateRating(visit.id, rating);
      setVisit({ ...visit, rating: updated.rating });
    } catch {
      setError('Bewertung konnte nicht gespeichert werden.');
    } finally {
      setUpdatingRating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !visit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Kinobesuch nicht gefunden.'}</Text>
      </View>
    );
  }

  const { movie, cinema } = visit;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {movie.backdropUrl ? <Image source={{ uri: movie.backdropUrl }} style={styles.backdrop} /> : null}

      <View style={styles.headerRow}>
        {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.poster} /> : null}
        <View style={styles.headerInfo}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          {movie.originalTitle && movie.originalTitle !== movie.title ? (
            <Text style={styles.originalTitle}>{movie.originalTitle}</Text>
          ) : null}
          <Text style={styles.metaText}>
            {[movie.releaseDate?.slice(0, 4), movie.runtime ? `${movie.runtime} min` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {movie.genres.length > 0 ? <Text style={styles.metaText}>{movie.genres.join(', ')}</Text> : null}
        </View>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => handleRatingChange(n)} disabled={updatingRating}>
            <Text style={styles.star}>{visit.rating && n <= visit.rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>

      {movie.trailerUrl ? (
        <Pressable
          style={({ pressed }) => [styles.trailerButton, pressed && styles.trailerButtonPressed]}
          onPress={() => Linking.openURL(movie.trailerUrl!)}
        >
          <Ionicons name="play-circle" size={20} color={colors.accentText} />
          <Text style={styles.trailerButtonText}>Trailer ansehen</Text>
        </Pressable>
      ) : null}

      {movie.overview ? (
        <>
          <Text style={styles.sectionTitle}>Handlung</Text>
          <Text style={styles.overview}>{movie.overview}</Text>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Kino</Text>
      <Text style={styles.bodyText}>{cinema.name}</Text>
      {cinema.address || cinema.city ? (
        <Text style={styles.sectionMetaText}>{[cinema.address, cinema.city, cinema.country].filter(Boolean).join(', ')}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Ticketinformationen</Text>
      <Text style={styles.bodyText}>
        {formatDate(visit.watchedAt)}
        {formatTime(visit.showTime) ? ` · ${formatTime(visit.showTime)} Uhr` : ''}
      </Text>
      {visit.hall || visit.row || visit.seat ? (
        <Text style={styles.sectionMetaText}>
          {[visit.hall ? `Saal ${visit.hall}` : null, visit.row ? `Reihe ${visit.row}` : null, visit.seat ? `Sitz ${visit.seat}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
      {visit.ticketPrice !== null ? (
        <Text style={styles.sectionMetaText}>{visit.ticketPrice.toFixed(2)} €</Text>
      ) : null}
      {visit.ticketType ? (
        <Text style={styles.sectionMetaText}>{TICKET_TYPE_LABELS[visit.ticketType]}</Text>
      ) : null}

      {ticketImageUrl ? (
        <>
          <Text style={styles.sectionTitle}>Originalticket</Text>
          <Image source={{ uri: ticketImageUrl }} style={styles.ticketImage} resizeMode="contain" />
        </>
      ) : null}

      {visit.comment ? (
        <>
          <Text style={styles.sectionTitle}>Notiz</Text>
          <Text style={styles.bodyText}>{visit.comment}</Text>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
          onPress={() => router.push({ pathname: '/edit-visit', params: { visitId: visit.id } })}
        >
          <Ionicons name="create-outline" size={18} color={colors.accent} />
          <Text style={styles.editButtonText}>Bearbeiten</Text>
        </Pressable>

        {confirmingDelete ? (
          <View style={styles.confirmDeleteRow}>
            <Text style={styles.confirmDeleteText}>Wirklich löschen?</Text>
            <Pressable
              style={({ pressed }) => [styles.deleteConfirmButton, pressed && styles.deleteConfirmButtonPressed]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Ja, löschen</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setConfirmingDelete(false)} disabled={deleting}>
              <Text style={styles.cancelDeleteText}>Abbrechen</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.deleteButton} onPress={() => setConfirmingDelete(true)}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.deleteButtonText}>Löschen</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingBottom: spacing.xxl + spacing.lg, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    error: { color: colors.error, textAlign: 'center' },
    backdrop: { width: '100%', height: 180, backgroundColor: colors.surfaceAlt },
    headerRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
    poster: { width: 90, height: 135, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    headerInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
    movieTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    originalTitle: { color: colors.textSecondary, fontStyle: 'italic' },
    metaText: { color: colors.textSecondary },
    sectionMetaText: { color: colors.textSecondary, marginHorizontal: spacing.lg },
    starsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    star: { fontSize: 28, color: colors.rating },
    trailerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    trailerButtonPressed: { opacity: 0.85 },
    trailerButtonText: { color: colors.accentText, fontWeight: '600' },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      color: colors.textPrimary,
    },
    bodyText: { marginHorizontal: spacing.lg, fontSize: 15, color: colors.textPrimary },
    overview: { marginHorizontal: spacing.lg, color: colors.textSecondary, lineHeight: 20 },
    ticketImage: { width: '100%', height: 300, marginTop: spacing.sm, backgroundColor: colors.surfaceAlt },
    actions: { marginHorizontal: spacing.lg, marginTop: spacing.xxl, gap: spacing.md },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    editButtonPressed: { opacity: 0.75 },
    editButtonText: { fontWeight: '600', color: colors.accent },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
    deleteButtonText: { color: colors.error, fontWeight: '600' },
    confirmDeleteRow: { alignItems: 'center', gap: spacing.sm },
    confirmDeleteText: { color: colors.error },
    deleteConfirmButton: {
      backgroundColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      minWidth: 160,
    },
    deleteConfirmButtonPressed: { opacity: 0.85 },
    deleteConfirmButtonText: { color: colors.accentText, fontWeight: '600' },
    cancelDeleteText: { color: colors.textSecondary },
  });
}
