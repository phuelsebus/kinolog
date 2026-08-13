// Mappt eine Zeile der public.movies Tabelle (snake_case) auf die camelCase
// Movie-Struktur, die der mobile Client erwartet (siehe mobile/src/types/models.ts).

export interface MovieRow {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: string[];
  trailer_url: string | null;
}

export function mapMovieRow(row: MovieRow) {
  return {
    id: row.id,
    provider: row.provider,
    providerId: row.provider_id,
    title: row.title,
    originalTitle: row.original_title,
    overview: row.overview,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    releaseDate: row.release_date,
    runtime: row.runtime,
    genres: row.genres,
    trailerUrl: row.trailer_url,
  };
}
