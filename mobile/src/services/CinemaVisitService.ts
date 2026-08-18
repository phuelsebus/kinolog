import { supabase } from '../lib/supabase';
import {
  mapCinemaVisitRow,
  mapCinemaVisitWithDetailsRow,
  type CinemaVisitRow,
  type CinemaVisitWithDetailsRow,
} from '../lib/mappers';
import type { CinemaVisit, CinemaVisitWithDetails } from '../types/models';

export interface CreateCinemaVisitInput {
  movieId: string;
  cinemaId: string;
  watchedAt: string;
  showTime?: string;
  hall?: string;
  row?: string;
  seat?: string;
  ticketPrice?: number;
  ticketType?: CinemaVisit['ticketType'];
  ticketImageUrl?: string;
  rating?: number;
  comment?: string;
}

// Kapselt das Anlegen/Aktualisieren von Kinobesuchen (Supabase Postgres Tabelle
// cinema_visits) inkl. Verknuepfung zu Movie/Cinema und TicketExtraction.
export interface CinemaVisitService {
  createVisit(input: CreateCinemaVisitInput): Promise<CinemaVisit>;
  updateVisit(id: string, input: CreateCinemaVisitInput): Promise<CinemaVisit>;
  deleteVisit(id: string): Promise<void>;
  listVisits(): Promise<CinemaVisitWithDetails[]>;
  getVisit(id: string): Promise<CinemaVisitWithDetails | null>;
  updateRating(id: string, rating: number): Promise<CinemaVisit>;
}

// select-Fragment fuer die mit Movie/Cinema angereicherte Sicht, verwendet
// von listVisits (Bibliothek) und getVisit (Detailseite).
const WITH_DETAILS_SELECT = '*, movie:movies(*), cinema:cinemas(*)';

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht angemeldet.');
  return user.id;
}

export const cinemaVisitService: CinemaVisitService = {
  async createVisit(input: CreateCinemaVisitInput): Promise<CinemaVisit> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('cinema_visits')
      .insert({
        user_id: userId,
        movie_id: input.movieId,
        cinema_id: input.cinemaId,
        watched_at: input.watchedAt,
        show_time: input.showTime ?? null,
        hall: input.hall ?? null,
        row: input.row ?? null,
        seat: input.seat ?? null,
        ticket_price: input.ticketPrice ?? null,
        ticket_type: input.ticketType ?? null,
        ticket_image_url: input.ticketImageUrl ?? null,
        rating: input.rating ?? null,
        comment: input.comment ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCinemaVisitRow(data as CinemaVisitRow);
  },

  async updateVisit(id: string, input: CreateCinemaVisitInput): Promise<CinemaVisit> {
    const { data, error } = await supabase
      .from('cinema_visits')
      .update({
        movie_id: input.movieId,
        cinema_id: input.cinemaId,
        watched_at: input.watchedAt,
        show_time: input.showTime ?? null,
        hall: input.hall ?? null,
        row: input.row ?? null,
        seat: input.seat ?? null,
        ticket_price: input.ticketPrice ?? null,
        ticket_type: input.ticketType ?? null,
        rating: input.rating ?? null,
        comment: input.comment ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCinemaVisitRow(data as CinemaVisitRow);
  },

  async deleteVisit(id: string): Promise<void> {
    const { error } = await supabase.from('cinema_visits').delete().eq('id', id);
    if (error) throw error;
  },

  async listVisits(): Promise<CinemaVisitWithDetails[]> {
    // RLS beschraenkt automatisch auf cinema_visits.user_id = auth.uid()
    // (siehe supabase/migrations/20260813000000_init_schema.sql), daher kein
    // zusaetzlicher .eq('user_id', ...) Filter noetig.
    const { data, error } = await supabase
      .from('cinema_visits')
      .select(WITH_DETAILS_SELECT)
      .order('watched_at', { ascending: false })
      .order('show_time', { ascending: false });

    if (error) throw error;
    return (data as unknown as CinemaVisitWithDetailsRow[]).map(mapCinemaVisitWithDetailsRow);
  },

  async getVisit(id: string): Promise<CinemaVisitWithDetails | null> {
    const { data, error } = await supabase
      .from('cinema_visits')
      .select(WITH_DETAILS_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapCinemaVisitWithDetailsRow(data as unknown as CinemaVisitWithDetailsRow);
  },

  async updateRating(id: string, rating: number): Promise<CinemaVisit> {
    const { data, error } = await supabase
      .from('cinema_visits')
      .update({ rating })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCinemaVisitRow(data as CinemaVisitRow);
  },
};

