import { supabase } from '../lib/supabase';
import { mapWatchlistItemWithMovieRow, type WatchlistItemWithMovieRow } from '../lib/mappers';
import type { WatchlistItemWithMovie } from '../types/models';

const WITH_MOVIE_SELECT = '*, movie:movies(*)';

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht angemeldet.');
  return user.id;
}

// Filme, die der Nutzer noch sehen moechte - getrennt von cinema_visits
// (bereits geloggte Kinobesuche). Siehe supabase/migrations/20260901000000_watchlist.sql.
export interface WatchlistService {
  list(): Promise<WatchlistItemWithMovie[]>;
  add(movieId: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export const watchlistService: WatchlistService = {
  async list(): Promise<WatchlistItemWithMovie[]> {
    // RLS beschraenkt automatisch auf watchlist_items.user_id = auth.uid().
    const { data, error } = await supabase
      .from('watchlist_items')
      .select(WITH_MOVIE_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as WatchlistItemWithMovieRow[]).map(mapWatchlistItemWithMovieRow);
  },

  async add(movieId: string): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('watchlist_items').insert({ user_id: userId, movie_id: movieId });

    if (!error) return;
    // unique(user_id, movie_id) - Film ist schon in der Watchlist, kein Fehler
    // (gleiches Muster wie CinemaService.createCinema bei Duplikaten).
    if (error.code === '23505') return;
    throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('watchlist_items').delete().eq('id', id);
    if (error) throw error;
  },
};
