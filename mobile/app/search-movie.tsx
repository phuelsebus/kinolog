import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { tmdbMovieProvider } from '../src/services/MovieProvider';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';
import type { MovieSearchResult } from '../src/types/models';

// Manuelle Filmsuche UI (idee.md: "Film-Suche über TMDB"). Ersetzt den
// urspruenglich geplanten Ticket-Foto-Flow (siehe ticket-scanner Todo) -
// Nutzerentscheidung 2026-08-13: Hauptflow ist manuelle Filmsuche.
export default function SearchMovieScreen() {
  const router = useRouter();
  const { editVisitId } = useLocalSearchParams<{ editVisitId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const found = await tmdbMovieProvider.searchMovies(trimmed);
      setResults(found);
    } catch {
      setError('Filmsuche fehlgeschlagen. Bitte versuche es erneut.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(result: MovieSearchResult) {
    setSelectingId(result.providerId);
    setError(null);
    try {
      const movie = await tmdbMovieProvider.getMovie(result.providerId);
      if (editVisitId) {
        // Rueckkehr zu einer bereits offenen edit-visit-Instanz (siehe
        // edit-visit.tsx "Film ändern") statt eines neuen Stack-Eintrags.
        router.dismissTo({
          pathname: '/edit-visit',
          params: {
            visitId: editVisitId,
            movieId: movie.id,
            movieTitle: movie.title,
            moviePosterUrl: movie.posterUrl ?? '',
          },
        });
      } else {
        router.push({
          pathname: '/new-visit',
          params: { movieId: movie.id, movieTitle: movie.title, moviePosterUrl: movie.posterUrl ?? '' },
        });
      }
    } catch {
      setError('Filmdaten konnten nicht geladen werden. Bitte versuche es erneut.');
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Filmtitel eingeben..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.searchButtonText}>Suchen</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {hasSearched && !searching && results.length === 0 && !error ? (
        <Text style={styles.emptyText}>Kein Film gefunden. Versuche einen anderen Suchbegriff.</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.providerId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
            onPress={() => handleSelect(item)}
            disabled={selectingId !== null}
          >
            {item.posterUrl ? (
              <Image source={{ uri: item.posterUrl }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]} />
            )}
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              {item.releaseDate ? (
                <Text style={styles.resultYear}>{item.releaseDate.slice(0, 4)}</Text>
              ) : null}
            </View>
            {selectingId === item.providerId ? <ActivityIndicator color={colors.accent} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
    searchRow: { flexDirection: 'row', gap: spacing.sm },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      fontSize: 16,
      color: colors.textPrimary,
    },
    searchButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    searchButtonPressed: { opacity: 0.85 },
    searchButtonText: { color: colors.accentText, fontWeight: '600' },
    error: { color: colors.error },
    emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
    list: { gap: spacing.sm },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultRowPressed: { opacity: 0.75 },
    poster: { width: 46, height: 69, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
    posterPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
    resultYear: { color: colors.textSecondary, marginTop: 2 },
  });
}
