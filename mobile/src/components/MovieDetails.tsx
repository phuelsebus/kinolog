import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import type { Movie } from '../types/models';

export interface MovieDetailsProps {
  movie: Movie;
  // Wird zwischen Kopfbereich und Trailer-Button gerendert - z.B. die
  // Sterne-Bewertung in visit/[id].tsx, die es fuer einen reinen
  // Watchlist-Eintrag (movie/[id].tsx) noch nicht gibt.
  children?: ReactNode;
}

// Reine Filmdaten-Ansicht (Backdrop, Poster, Titel, Meta, Trailer,
// Handlung) - extrahiert aus visit/[id].tsx, damit movie/[id].tsx (Watchlist
// "Details ansehen") dieselbe Darstellung ohne Kinobesuch-Kontext nutzen kann.
export default function MovieDetails({ movie, children }: MovieDetailsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
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

      {children}

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
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { width: '100%', height: 180, backgroundColor: colors.surfaceAlt },
    headerRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
    poster: { width: 90, height: 135, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    headerInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
    movieTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    originalTitle: { color: colors.textSecondary, fontStyle: 'italic' },
    metaText: { color: colors.textSecondary },
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
    overview: { marginHorizontal: spacing.lg, color: colors.textSecondary, lineHeight: 20 },
  });
}
