import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { tmdbMovieProvider } from '../src/services/MovieProvider';
import type { ScanHandoff } from '../src/services/TicketScanner';
import { watchlistService } from '../src/services/WatchlistService';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';
import type { MovieSearchResult } from '../src/types/models';

function parseScanHandoff(raw: string | undefined): ScanHandoff | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScanHandoff;
  } catch {
    return null;
  }
}

// Ab 2 Zeichen wird gesucht (1 Zeichen liefert fast nur Rauschen), mit
// Debounce statt bei jedem Tastendruck - sonst geht bei jedem Buchstaben ein
// TMDB-Request raus (unnoetig viele Anfragen, Rate-Limit-Risiko).
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

interface SearchResultRowProps {
  item: MovieSearchResult;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  disabled: boolean;
  selecting: boolean;
  onSelect: (item: MovieSearchResult) => void;
}

// Als eigene, memoisierte Komponente ausgelagert - gleicher Grund wie
// VisitRow in (tabs)/index.tsx: ein inline renderItem wuerde bei jedem
// Tastendruck waehrend der Hotsearch-Eingabe alle sichtbaren Zeilen neu rendern.
const SearchResultRow = memo(function SearchResultRow({
  item,
  styles,
  colors,
  disabled,
  selecting,
  onSelect,
}: SearchResultRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
      onPress={() => onSelect(item)}
      disabled={disabled}
    >
      {item.posterUrl ? (
        <Image source={{ uri: item.posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]} />
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        {item.releaseDate ? <Text style={styles.resultYear}>{item.releaseDate.slice(0, 4)}</Text> : null}
      </View>
      {selecting ? <ActivityIndicator color={colors.accent} /> : null}
    </Pressable>
  );
});

// Manuelle Filmsuche UI (idee.md: "Film-Suche über TMDB"). Ist auch der
// gemeinsame zweite Schritt des Ticket-Scan-Flows (scan-ticket.tsx): kommt
// der "scan" Param mit erkanntem Filmtitel an, wird direkt automatisch
// vorgesucht - der Nutzer bestaetigt/korrigiert die Auswahl aber weiterhin
// manuell wie im normalen Flow (idee.md Abschnitt 7).
export default function SearchMovieScreen() {
  const router = useRouter();
  const { editVisitId, scan, mode } = useLocalSearchParams<{
    editVisitId?: string;
    scan?: string;
    mode?: 'visit' | 'watchlist';
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scanHandoff = useMemo(() => parseScanHandoff(scan), [scan]);
  const [query, setQuery] = useState(scanHandoff?.data.movieTitle ?? '');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestIdRef = useRef(0);
  const isFirstRun = useRef(true);

  async function handleSearch(searchQuery?: string) {
    const trimmed = (searchQuery ?? query).trim();
    if (!trimmed) return;

    // Falls waehrenddessen eine neuere Suche gestartet wurde, wird die
    // Antwort dieser (aelteren) Anfrage verworfen - verhindert, dass eine
    // langsame Antwort eine bereits neuere ueberschreibt.
    const requestId = ++requestIdRef.current;
    setSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const found = await tmdbMovieProvider.searchMovies(trimmed);
      if (requestId !== requestIdRef.current) return;
      setResults(found);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Filmsuche fehlgeschlagen. Bitte versuche es erneut.');
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) setSearching(false);
    }
  }

  // Hotsearch: sucht automatisch waehrend der Eingabe (ab MIN_QUERY_LENGTH
  // Zeichen, per Debounce). Bei einem aus dem Ticket-Scan vorbefuellten Titel
  // wird beim allerersten Aufruf ohne Verzoegerung gesucht.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasSearched(false);
      isFirstRun.current = false;
      return;
    }
    const delay = isFirstRun.current && scanHandoff?.data.movieTitle ? 0 : DEBOUNCE_MS;
    isFirstRun.current = false;
    const timeout = setTimeout(() => handleSearch(trimmed), delay);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = useCallback(
    async (result: MovieSearchResult) => {
      setSelectingId(result.providerId);
      setError(null);
      try {
        const movie = await tmdbMovieProvider.getMovie(result.providerId);
        if (mode === 'watchlist') {
          await watchlistService.add(movie.id);
          router.back();
          return;
        }
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
            params: {
              movieId: movie.id,
              movieTitle: movie.title,
              moviePosterUrl: movie.posterUrl ?? '',
              ...(scan ? { scan } : {}),
            },
          });
        }
      } catch {
        setError('Filmdaten konnten nicht geladen werden. Bitte versuche es erneut.');
      } finally {
        setSelectingId(null);
      }
    },
    [mode, editVisitId, scan, router]
  );

  const renderResultItem = useCallback(
    ({ item }: { item: MovieSearchResult }) => (
      <SearchResultRow
        item={item}
        styles={styles}
        colors={colors}
        disabled={selectingId !== null}
        selecting={selectingId === item.providerId}
        onSelect={handleSelect}
      />
    ),
    [styles, colors, selectingId, handleSelect]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Filmtitel eingeben..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          autoFocus
        />
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          onPress={() => handleSearch()}
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
        keyboardShouldPersistTaps="handled"
        renderItem={renderResultItem}
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
