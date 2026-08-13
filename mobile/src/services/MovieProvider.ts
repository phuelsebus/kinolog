import { supabase } from '../lib/supabase';
import type { Movie, MovieSearchResult } from '../types/models';

// Abstraktion gemaess idee.md Abschnitt 3 ("Movie Data").
// Die konkrete Implementierung (TMDB) laeuft serverseitig in einer Supabase
// Edge Function; der Client ruft ausschliesslich diese Funktionen auf, nie TMDB direkt.
export interface MovieProvider {
  searchMovies(query: string): Promise<MovieSearchResult[]>;
  getMovie(id: string): Promise<Movie>;
}

// Ruft die Supabase Edge Functions "movie-search" / "movie-get" auf, die ihrerseits
// TMDB kapseln (supabase/functions/_shared/tmdb.ts). Erfordert eine eingeloggte
// Session, da die Functions mit auth: 'user' geschuetzt sind.
export const tmdbMovieProvider: MovieProvider = {
  async searchMovies(query: string): Promise<MovieSearchResult[]> {
    const { data, error } = await supabase.functions.invoke<{ results: MovieSearchResult[] }>(
      'movie-search',
      { body: { query } }
    );

    if (error) throw error;
    return data?.results ?? [];
  },

  async getMovie(id: string): Promise<Movie> {
    const { data, error } = await supabase.functions.invoke<{ movie: Movie }>('movie-get', {
      body: { providerId: id },
    });

    if (error) throw error;
    if (!data?.movie) throw new Error('Filmdaten konnten nicht geladen werden.');
    return data.movie;
  },
};

