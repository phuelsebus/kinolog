// Duenne Abstraktion um die TMDB v3 API. Wird ausschliesslich serverseitig
// (Supabase Edge Functions) verwendet - der TMDB_READ_ACCESS_TOKEN verlaesst
// nie den Server (vgl. idee.md Abschnitt 3 "Movie Data").

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

function getAuthHeader(): string {
  const token = Deno.env.get('TMDB_READ_ACCESS_TOKEN');
  if (!token) {
    throw new Error('TMDB_READ_ACCESS_TOKEN ist nicht als Supabase Secret gesetzt.');
  }
  return `Bearer ${token}`;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('language', 'de-DE');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TMDB request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export function posterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE_URL}/w500${path}` : null;
}

export function backdropUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE_URL}/w1280${path}` : null;
}

interface TmdbSearchResultItem {
  id: number;
  title: string;
  original_title: string | null;
  release_date: string | null;
  poster_path: string | null;
}

interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResultItem[];
}

export interface TmdbMovieSearchResult {
  providerId: string;
  title: string;
  originalTitle: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
}

export async function searchMovies(query: string): Promise<TmdbMovieSearchResult[]> {
  const data = await tmdbFetch<TmdbSearchResponse>('/search/movie', { query, include_adult: 'false' });

  return data.results.map((item) => ({
    providerId: String(item.id),
    title: item.title,
    originalTitle: item.original_title ?? null,
    releaseDate: item.release_date || null,
    posterUrl: posterUrl(item.poster_path),
  }));
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  videos?: { results: TmdbVideo[] };
}

export interface TmdbMovie {
  providerId: string;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  runtime: number | null;
  genres: string[];
  trailerUrl: string | null;
}

function pickTrailerUrl(videos: TmdbVideo[] | undefined): string | null {
  if (!videos || videos.length === 0) return null;

  const trailers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const best = trailers.find((v) => v.official) ?? trailers[0];
  return best ? `https://www.youtube.com/watch?v=${best.key}` : null;
}

export async function getMovie(providerId: string): Promise<TmdbMovie> {
  const data = await tmdbFetch<TmdbMovieDetails>(`/movie/${providerId}`, {
    append_to_response: 'videos',
  });

  return {
    providerId: String(data.id),
    title: data.title,
    originalTitle: data.original_title ?? null,
    overview: data.overview ?? null,
    posterUrl: posterUrl(data.poster_path),
    backdropUrl: backdropUrl(data.backdrop_path),
    releaseDate: data.release_date || null,
    runtime: data.runtime ?? null,
    genres: (data.genres ?? []).map((g) => g.name),
    trailerUrl: pickTrailerUrl(data.videos?.results),
  };
}
