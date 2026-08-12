import type { Movie, MovieSearchResult } from '../types/models';

// Abstraktion gemaess idee.md Abschnitt 3 ("Movie Data").
// Die konkrete Implementierung (TMDB) laeuft serverseitig in einer Supabase
// Edge Function; der Client ruft ausschliesslich diese Funktionen auf, nie TMDB direkt.
export interface MovieProvider {
  searchMovies(query: string): Promise<MovieSearchResult[]>;
  getMovie(id: string): Promise<Movie>;
}

// TODO (movie-provider Todo): Implementierung, die die Supabase Edge Function
// "movie-search" / "movie-get" aufruft (supabase.functions.invoke(...)).
