import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import MovieDetails from '../../src/components/MovieDetails';
import { mapMovieRow, type MovieRow } from '../../src/lib/mappers';
import { supabase } from '../../src/lib/supabase';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';
import type { Movie } from '../../src/types/models';

// Reine Filmdetails ohne Kinobesuch-Kontext - Einstieg z.B. von der Watchlist
// (watchlist.tsx "Details ansehen"), wo noch kein Kinobesuch existiert.
// movies ist geteilte Referenzdaten (RLS erlaubt select fuer authenticated),
// daher direkte Tabellenabfrage ohne Edge-Function-Umweg.
export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: queryError } = await supabase.from('movies').select('*').eq('id', id).maybeSingle();
        if (queryError) throw queryError;
        if (!cancelled) setMovie(data ? mapMovieRow(data as MovieRow) : null);
      } catch {
        if (!cancelled) setError('Filmdaten konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Film nicht gefunden.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MovieDetails movie={movie} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingBottom: spacing.xxl, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    error: { color: colors.error, textAlign: 'center' },
  });
}
