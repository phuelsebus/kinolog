import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';
import type { CinemaVisitWithDetails } from '../../src/types/models';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

function StarRating({ rating, color }: { rating: number | null; color: string }) {
  if (rating === null) return null;
  return (
    <Text style={{ color, marginTop: 2 }}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </Text>
  );
}

// Bibliothek (idee.md Abschnitt 8): chronologische Liste aller Kinobesuche
// mit Poster, Filmtitel, Datum, Kino, Bewertung.
export default function LibraryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visits.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadVisits(true)} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="film-outline" size={40} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyTitle}>Noch keine Kinobesuche</Text>
            <Text style={styles.emptyHint}>
              Tippe unten auf "Kinobesuch", um deinen ersten Eintrag anzulegen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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
              <StarRating rating={item.rating} color={colors.rating} />
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={({ pressed }) => [styles.scanFab, pressed && styles.scanFabPressed]}
        onPress={() => router.push('/scan-ticket')}
      >
        <Ionicons name="camera" size={20} color={colors.accent} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/search-movie')}
      >
        <Ionicons name="add" size={20} color={colors.accentText} />
        <Text style={styles.fabText}>Kinobesuch</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    list: { padding: spacing.lg, gap: spacing.md },
    emptyList: { flexGrow: 1 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm, color: colors.textPrimary },
    emptyHint: { color: colors.textSecondary, textAlign: 'center' },
    error: { color: colors.error, textAlign: 'center', padding: spacing.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowPressed: { opacity: 0.75 },
    poster: { width: 56, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
    posterPlaceholder: {},
    info: { flex: 1, gap: 2 },
    movieTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    meta: { color: colors.textSecondary },
    fab: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      right: spacing.lg,
      bottom: spacing.lg,
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 3,
    },
    fabPressed: { opacity: 0.9 },
    fabText: { color: colors.accentText, fontWeight: '600' },
    scanFab: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      right: spacing.lg,
      bottom: spacing.lg + 64,
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 2,
    },
    scanFabPressed: { opacity: 0.8 },
  });
}
