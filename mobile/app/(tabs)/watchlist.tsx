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
import { watchlistService } from '../../src/services/WatchlistService';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';
import type { WatchlistItemWithMovie } from '../../src/types/models';

// Watchlist (getrennt von der Bibliothek/cinema_visits): Filme, die der
// Nutzer noch sehen moechte. Antippen -> Kinobesuch dafuer eintragen
// (new-visit.tsx entfernt den Eintrag danach automatisch), Papierkorb ->
// direkt entfernen.
export default function WatchlistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<WatchlistItemWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadItems = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await watchlistService.list();
      setItems(data);
    } catch {
      setError('Watchlist konnte nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems(false);
    }, [loadItems])
  );

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await watchlistService.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('Eintrag konnte nicht entfernt werden.');
    } finally {
      setRemovingId(null);
    }
  }

  function handleSelect(item: WatchlistItemWithMovie) {
    router.push({
      pathname: '/new-visit',
      params: {
        movieId: item.movie.id,
        movieTitle: item.movie.title,
        moviePosterUrl: item.movie.posterUrl ?? '',
        watchlistItemId: item.id,
      },
    });
  }

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
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadItems(true)} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="bookmark-outline" size={40} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyTitle}>Noch nichts gemerkt</Text>
            <Text style={styles.emptyHint}>
              Tippe unten auf "Film merken", um Filme für später vorzumerken.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => handleSelect(item)}>
            {item.movie.posterUrl ? (
              <Image source={{ uri: item.movie.posterUrl }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.movieTitle}>{item.movie.title}</Text>
              {item.movie.releaseDate ? (
                <Text style={styles.meta}>{item.movie.releaseDate.slice(0, 4)}</Text>
              ) : null}
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.movie.id } })}
              style={styles.iconButton}
            >
              <Ionicons name="film-outline" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              style={styles.iconButton}
            >
              {removingId === item.id ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push({ pathname: '/search-movie', params: { mode: 'watchlist' } })}
      >
        <Ionicons name="bookmark" size={20} color={colors.accentText} />
        <Text style={styles.fabText}>Film merken</Text>
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
    iconButton: { padding: spacing.xs },
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
  });
}
