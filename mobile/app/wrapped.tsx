import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cinemaVisitService } from '../src/services/CinemaVisitService';
import { computeWrappedStats, yearsWithVisits, type WrappedStats } from '../src/services/WrappedStats';
import { radius, spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';
import type { CinemaVisitWithDetails } from '../src/types/models';

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

// Kino-Jahresrückblick ("Wrapped"): reine Aggregation der bereits geloggten
// Kinobesuche (siehe WrappedStats.ts), kein eigener Datenbestand.
export default function WrappedScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visits, setVisits] = useState<CinemaVisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    cinemaVisitService
      .listVisits()
      .then((data) => {
        setVisits(data);
        const years = yearsWithVisits(data);
        if (years.length > 0 && !years.includes(year)) setYear(years[0]);
      })
      .catch(() => setError('Kinobesuche konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableYears = useMemo(() => yearsWithVisits(visits), [visits]);
  const stats = useMemo<WrappedStats | null>(() => computeWrappedStats(visits, year), [visits, year]);

  const yearIndex = availableYears.indexOf(year);
  const canGoNewer = yearIndex > 0;
  const canGoOlder = yearIndex >= 0 && yearIndex < availableYears.length - 1;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (availableYears.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="sparkles-outline" size={40} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
        <Text style={styles.emptyTitle}>Noch keine Kinobesuche</Text>
        <Text style={styles.emptyHint}>Trag deinen ersten Kinobesuch ein, um hier deinen Rückblick zu sehen.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.yearRow}>
        <Pressable
          hitSlop={8}
          onPress={() => canGoOlder && setYear(availableYears[yearIndex + 1])}
          disabled={!canGoOlder}
        >
          <Ionicons name="chevron-back" size={24} color={canGoOlder ? colors.textPrimary : colors.border} />
        </Pressable>
        <Text style={styles.yearText}>{year}</Text>
        <Pressable
          hitSlop={8}
          onPress={() => canGoNewer && setYear(availableYears[yearIndex - 1])}
          disabled={!canGoNewer}
        >
          <Ionicons name="chevron-forward" size={24} color={canGoNewer ? colors.textPrimary : colors.border} />
        </Pressable>
      </View>

      {stats ? (
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.totalVisits}</Text>
            <Text style={styles.cardLabel}>Kinobesuche</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>{formatHours(stats.totalRuntimeMinutes)}</Text>
            <Text style={styles.cardLabel}>Im Kinosaal verbracht</Text>
          </View>

          {stats.favoriteGenre ? (
            <View style={styles.card}>
              <Text style={styles.cardValue}>{stats.favoriteGenre.name}</Text>
              <Text style={styles.cardLabel}>Lieblingsgenre ({stats.favoriteGenre.count}×)</Text>
            </View>
          ) : null}

          {stats.favoriteCinema ? (
            <View style={styles.card}>
              <Text style={styles.cardValue}>{stats.favoriteCinema.name}</Text>
              <Text style={styles.cardLabel}>Lieblingskino ({stats.favoriteCinema.count}×)</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.totalSpent.toFixed(2)} €</Text>
            <Text style={styles.cardLabel}>Ausgegeben für Tickets</Text>
          </View>

          {stats.averageRating !== null ? (
            <View style={styles.card}>
              <Text style={styles.cardValue}>{stats.averageRating.toFixed(1)} / 5 ★</Text>
              <Text style={styles.cardLabel}>Durchschnittsbewertung</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyHint}>Keine Kinobesuche in {year}.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    error: { color: colors.error, textAlign: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm, color: colors.textPrimary },
    emptyHint: { color: colors.textSecondary, textAlign: 'center' },
    yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
    yearText: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, minWidth: 90, textAlign: 'center' },
    cards: { gap: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    cardValue: { fontSize: 24, fontWeight: '700', color: colors.accent, textAlign: 'center' },
    cardLabel: { color: colors.textSecondary, textAlign: 'center' },
  });
}
