import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SwipeableRow from '../../src/components/SwipeableRow';
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

type SortMode = 'visited' | 'release' | 'added' | 'alphabetical';
type SortDirection = 'asc' | 'desc';

interface SortState {
  mode: SortMode;
  direction: SortDirection;
}

// Sinnvolle Standardrichtung je Kriterium beim Wechsel: bei Daten zuerst das
// Neueste, bei alphabetisch A-Z.
const DEFAULT_DIRECTION: Record<SortMode, SortDirection> = {
  visited: 'desc',
  release: 'desc',
  added: 'desc',
  alphabetical: 'asc',
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'visited', label: 'Kinobesuch' },
  { value: 'release', label: 'Erscheinungsdatum' },
  { value: 'added', label: 'Hinzugefügt' },
  { value: 'alphabetical', label: 'Alphabetisch' },
];

// Vergleicht zwei ISO-Datumsstrings (YYYY-MM-DD / Timestamps) aufsteigend -
// "null"/leer landet dabei immer am Ende, unabhaengig von der Richtung (wird
// erst nach diesem Nullcheck angewendet).
function compareDates(a: string | null, b: string | null, direction: SortDirection): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b);
  return direction === 'asc' ? cmp : -cmp;
}

function matchesQuery(visit: CinemaVisitWithDetails, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return visit.movie.title.toLowerCase().includes(q) || visit.cinema.name.toLowerCase().includes(q);
}

function sortVisits(visits: CinemaVisitWithDetails[], sort: SortState): CinemaVisitWithDetails[] {
  const sorted = [...visits];
  const { mode, direction } = sort;
  switch (mode) {
    case 'release':
      return sorted.sort((a, b) => compareDates(a.movie.releaseDate, b.movie.releaseDate, direction));
    case 'added':
      return sorted.sort((a, b) => compareDates(a.createdAt, b.createdAt, direction));
    case 'alphabetical':
      return sorted.sort((a, b) => {
        const cmp = a.movie.title.localeCompare(b.movie.title, 'de');
        return direction === 'asc' ? cmp : -cmp;
      });
    case 'visited':
    default:
      return sorted.sort(
        (a, b) =>
          compareDates(a.watchedAt, b.watchedAt, direction) || compareDates(a.showTime, b.showTime, direction)
      );
  }
}

interface VisitRowProps {
  item: CinemaVisitWithDetails;
  styles: ReturnType<typeof createStyles>;
  ratingColor: string;
  onPress: (item: CinemaVisitWithDetails) => void;
  onDelete: (item: CinemaVisitWithDetails) => void;
}

// Als eigene, memoisierte Komponente ausgelagert (statt eines inline
// renderItem): FlatList kann dadurch pro Zeile echtes React.memo-Bailout
// nutzen - ohne das wuerde jeder Tastendruck in der Suche/jeder Sortier-
// Wechsel (aendert nur searchQuery/sort, nicht die Zeilendaten selbst) alle
// sichtbaren Zeilen neu rendern, da ein inline renderItem bei jedem Render
// von LibraryScreen eine neue Funktionsreferenz erzeugt.
const VisitRow = memo(function VisitRow({ item, styles, ratingColor, onPress, onDelete }: VisitRowProps) {
  return (
    <SwipeableRow
      onDelete={() => onDelete(item)}
      confirmTitle="Kinobesuch löschen?"
      confirmMessage={`"${item.movie.title}" wird unwiderruflich aus deiner Bibliothek entfernt.`}
    >
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => onPress(item)}>
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
          <StarRating rating={item.rating} color={ratingColor} />
        </View>
      </Pressable>
    </SwipeableRow>
  );
});

// Bibliothek (idee.md Abschnitt 8): chronologische Liste aller Kinobesuche
// mit Poster, Filmtitel, Datum, Kino, Bewertung.
export default function LibraryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visits, setVisits] = useState<CinemaVisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ mode: 'visited', direction: 'desc' });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleVisits = useMemo(
    () => sortVisits(visits.filter((visit) => matchesQuery(visit, searchQuery)), sort),
    [visits, searchQuery, sort]
  );

  const handleDeleteVisit = useCallback(async (visit: CinemaVisitWithDetails) => {
    try {
      await cinemaVisitService.deleteVisit(visit.id, visit.ticketImageUrl);
      setVisits((current) => current.filter((v) => v.id !== visit.id));
    } catch {
      setError('Kinobesuch konnte nicht gelöscht werden.');
    }
  }, []);

  const handleOpenVisit = useCallback((visit: CinemaVisitWithDetails) => {
    router.push({ pathname: '/visit/[id]', params: { id: visit.id } });
  }, []);

  function handleSelectSort(mode: SortMode) {
    setSort((current) =>
      current.mode === mode
        ? { mode, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { mode, direction: DEFAULT_DIRECTION[mode] }
    );
  }

  const renderVisitItem = useCallback(
    ({ item }: { item: CinemaVisitWithDetails }) => (
      <VisitRow
        item={item}
        styles={styles}
        ratingColor={colors.rating}
        onPress={handleOpenVisit}
        onDelete={handleDeleteVisit}
      />
    ),
    [styles, colors.rating, handleOpenVisit, handleDeleteVisit]
  );

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

      {visits.length > 0 ? (
        <View style={styles.toolbarRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Film oder Kino suchen"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable style={styles.sortButton} onPress={() => setSortMenuOpen(true)}>
            <Ionicons name="swap-vertical" size={16} color={colors.textPrimary} />
            <Ionicons
              name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSortMenuOpen(false)}>
          <Pressable style={styles.sortMenu} onPress={() => {}}>
            <Text style={styles.sortMenuTitle}>Sortieren nach</Text>
            {SORT_OPTIONS.map((option) => {
              const isActive = sort.mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [styles.sortMenuRow, pressed && styles.sortMenuRowPressed]}
                  onPress={() => handleSelectSort(option.value)}
                >
                  <Text style={[styles.sortMenuRowText, isActive && styles.sortMenuRowTextActive]}>
                    {option.label}
                  </Text>
                  {isActive ? (
                    <Ionicons
                      name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color={colors.accent}
                    />
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable style={styles.sortMenuDoneButton} onPress={() => setSortMenuOpen(false)}>
              <Text style={styles.sortMenuDoneText}>Fertig</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={visibleVisits}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={visibleVisits.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadVisits(true)} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="film-outline" size={40} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
            {visits.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>Noch keine Kinobesuche</Text>
                <Text style={styles.emptyHint}>
                  Tippe unten auf "Kinobesuch", um deinen ersten Eintrag anzulegen.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>Keine Treffer</Text>
                <Text style={styles.emptyHint}>Für "{searchQuery}" wurde nichts gefunden.</Text>
              </>
            )}
          </View>
        }
        renderItem={renderVisitItem}
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    // paddingBottom grosszuegig, damit die letzten Zeilen ueber die zwei
    // schwebenden Buttons (FAB "Kinobesuch" + Scan-FAB) hinaus scrollbar
    // sind - sonst liegen deren Wisch-Aktionen dauerhaft unter den Buttons.
    list: { padding: spacing.lg, paddingBottom: spacing.xxl * 5, gap: spacing.md },
    toolbarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    searchInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, padding: 0 },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sortMenu: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xs,
    },
    sortMenuTitle: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sortMenuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortMenuRowPressed: { opacity: 0.6 },
    sortMenuRowText: { fontSize: 15, color: colors.textPrimary },
    sortMenuRowTextActive: { color: colors.accent, fontWeight: '600' },
    sortMenuDoneButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
    sortMenuDoneText: { color: colors.accent, fontWeight: '600' },
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
