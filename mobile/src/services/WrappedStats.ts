import type { CinemaVisitWithDetails } from '../types/models';

export interface WrappedStats {
  year: number;
  totalVisits: number;
  totalSpent: number;
  averageRating: number | null;
  favoriteCinema: { name: string; count: number } | null;
  favoriteGenre: { name: string; count: number } | null;
  totalRuntimeMinutes: number;
}

// Reine Aggregation der bereits geladenen Kinobesuche eines Jahres - kein
// eigener Query noetig, gleiches "client-seitig auswerten"-Prinzip wie schon
// bei Sortierung/Suche in der Bibliothek ((tabs)/index.tsx).
export function computeWrappedStats(visits: CinemaVisitWithDetails[], year: number): WrappedStats | null {
  const yearVisits = visits.filter((visit) => visit.watchedAt.startsWith(String(year)));
  if (yearVisits.length === 0) return null;

  const totalSpent = yearVisits.reduce((sum, visit) => sum + (visit.ticketPrice ?? 0), 0);

  const ratedVisits = yearVisits.filter((visit) => visit.rating !== null);
  const averageRating =
    ratedVisits.length > 0
      ? ratedVisits.reduce((sum, visit) => sum + (visit.rating ?? 0), 0) / ratedVisits.length
      : null;

  const cinemaCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  let totalRuntimeMinutes = 0;

  for (const visit of yearVisits) {
    cinemaCounts.set(visit.cinema.name, (cinemaCounts.get(visit.cinema.name) ?? 0) + 1);
    for (const genre of visit.movie.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
    totalRuntimeMinutes += visit.movie.runtime ?? 0;
  }

  return {
    year,
    totalVisits: yearVisits.length,
    totalSpent,
    averageRating,
    favoriteCinema: topEntry(cinemaCounts),
    favoriteGenre: topEntry(genreCounts),
    totalRuntimeMinutes,
  };
}

function topEntry(counts: Map<string, number>): { name: string; count: number } | null {
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

// Alle Jahre, in denen es mindestens einen Kinobesuch gibt, absteigend
// sortiert - begrenzt den Jahres-Umschalter in wrapped.tsx auf sinnvolle Werte.
export function yearsWithVisits(visits: CinemaVisitWithDetails[]): number[] {
  const years = new Set(visits.map((visit) => Number(visit.watchedAt.slice(0, 4))));
  return [...years].sort((a, b) => b - a);
}
