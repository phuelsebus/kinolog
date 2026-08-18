import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
        <ActivityIndicator />
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
        <Pressable style={styles.trailerButton} onPress={() => Linking.openURL(movie.trailerUrl!)}>
          <Text style={styles.trailerButtonText}>▶ Trailer ansehen</Text>
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
        <Text style={styles.metaText}>{[cinema.address, cinema.city, cinema.country].filter(Boolean).join(', ')}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Ticketinformationen</Text>
      <Text style={styles.bodyText}>
        {formatDate(visit.watchedAt)}
        {formatTime(visit.showTime) ? ` · ${formatTime(visit.showTime)} Uhr` : ''}
      </Text>
      {visit.hall || visit.row || visit.seat ? (
        <Text style={styles.metaText}>
          {[visit.hall ? `Saal ${visit.hall}` : null, visit.row ? `Reihe ${visit.row}` : null, visit.seat ? `Sitz ${visit.seat}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
      {visit.ticketPrice !== null ? (
        <Text style={styles.metaText}>{visit.ticketPrice.toFixed(2)} €</Text>
      ) : null}
      {visit.ticketType ? (
        <Text style={styles.metaText}>{TICKET_TYPE_LABELS[visit.ticketType]}</Text>
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
          style={styles.editButton}
          onPress={() => router.push({ pathname: '/edit-visit', params: { visitId: visit.id } })}
        >
          <Text style={styles.editButtonText}>Bearbeiten</Text>
        </Pressable>

        {confirmingDelete ? (
          <View style={styles.confirmDeleteRow}>
            <Text style={styles.confirmDeleteText}>Wirklich löschen?</Text>
            <Pressable style={styles.deleteConfirmButton} onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteConfirmButtonText}>Ja, löschen</Text>}
            </Pressable>
            <Pressable onPress={() => setConfirmingDelete(false)} disabled={deleting}>
              <Text style={styles.cancelDeleteText}>Abbrechen</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.deleteButton} onPress={() => setConfirmingDelete(true)}>
            <Text style={styles.deleteButtonText}>Löschen</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#c0392b', textAlign: 'center' },
  backdrop: { width: '100%', height: 180, backgroundColor: '#eee' },
  headerRow: { flexDirection: 'row', gap: 12, padding: 16 },
  poster: { width: 90, height: 135, borderRadius: 8, backgroundColor: '#eee' },
  headerInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  movieTitle: { fontSize: 20, fontWeight: '700' },
  originalTitle: { color: '#666', fontStyle: 'italic' },
  metaText: { color: '#666' },
  starsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  star: { fontSize: 28, color: '#f5a623' },
  trailerButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trailerButtonText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginHorizontal: 16, marginBottom: 4 },
  bodyText: { marginHorizontal: 16, fontSize: 15 },
  overview: { marginHorizontal: 16, color: '#333', lineHeight: 20 },
  ticketImage: { width: '100%', height: 300, marginTop: 8, backgroundColor: '#f2f2f2' },
  actions: { marginHorizontal: 16, marginTop: 32, gap: 12 },
  editButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: { fontWeight: '600' },
  deleteButton: { alignItems: 'center', paddingVertical: 8 },
  deleteButtonText: { color: '#c0392b', fontWeight: '600' },
  confirmDeleteRow: { alignItems: 'center', gap: 8 },
  confirmDeleteText: { color: '#c0392b' },
  deleteConfirmButton: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 160,
  },
  deleteConfirmButtonText: { color: '#fff', fontWeight: '600' },
  cancelDeleteText: { color: '#666' },
});

