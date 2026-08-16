import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { cinemaVisitService } from '../../src/services/CinemaVisitService';
import type { CinemaVisitWithDetails } from '../../src/types/models';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <Text style={styles.rating}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </Text>
  );
}

// Bibliothek (idee.md Abschnitt 8): chronologische Liste aller Kinobesuche
// mit Poster, Filmtitel, Datum, Kino, Bewertung.
export default function LibraryScreen() {
  const [visits, setVisits] = useState<CinemaVisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVisits = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await cinemaVisitService.listVisits();
      setVisits(data);
    } catch {
      setError('Kinobesuche konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Neu laden, sobald der Screen fokussiert wird (z.B. nach dem Anlegen
  // eines neuen Kinobesuchs ueber /new-visit).
  useFocusEffect(
    useCallback(() => {
      loadVisits(false);
    }, [loadVisits])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visits.length === 0 ? styles.emptyList : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadVisits(true)} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Noch keine Kinobesuche</Text>
            <Text style={styles.emptyHint}>
              Tippe unten auf "+ Kinobesuch", um deinen ersten Eintrag anzulegen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/visit/[id]', params: { id: item.id } })}
          >
            {item.movie.posterUrl ? (
              <Image source={{ uri: item.movie.posterUrl }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.movieTitle}>{item.movie.title}</Text>
              <Text style={styles.meta}>
                {formatDate(item.watchedAt)} · {item.cinema.name}
              </Text>
              <StarRating rating={item.rating} />
            </View>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/search-movie')}>
        <Text style={styles.fabText}>+ Kinobesuch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyList: { flexGrow: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { color: '#666', textAlign: 'center' },
  error: { color: '#c0392b', textAlign: 'center', padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  poster: { width: 56, height: 84, borderRadius: 6, backgroundColor: '#eee' },
  posterPlaceholder: {},
  info: { flex: 1, gap: 2 },
  movieTitle: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666' },
  rating: { color: '#f5a623', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontWeight: '600' },
});
