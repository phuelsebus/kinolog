import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import type { MovieSearchResult } from '../src/types/models';

// Manuelle Filmsuche UI (idee.md: "Film-Suche über TMDB"). Ersetzt den
// urspruenglich geplanten Ticket-Foto-Flow (siehe ticket-scanner Todo) -
// Nutzerentscheidung 2026-08-13: Hauptflow ist manuelle Filmsuche.
export default function SearchMovieScreen() {
  const router = useRouter();
  const { editVisitId } = useLocalSearchParams<{ editVisitId?: string }>();
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
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Suchen</Text>}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {hasSearched && !searching && results.length === 0 && !error ? (
        <Text style={styles.emptyText}>Kein Film gefunden. Versuche einen anderen Suchbegriff.</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.providerId}
        renderItem={({ item }) => (
          <Pressable
            style={styles.resultRow}
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
            {selectingId === item.providerId ? <ActivityIndicator /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c0392b' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 24 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  poster: { width: 46, height: 69, borderRadius: 4, backgroundColor: '#eee' },
  posterPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '500' },
  resultYear: { color: '#666', marginTop: 2 },
});
