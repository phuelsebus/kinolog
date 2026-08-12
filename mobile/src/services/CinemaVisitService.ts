import type { CinemaVisit } from '../types/models';

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
  listVisits(): Promise<CinemaVisit[]>;
  getVisit(id: string): Promise<CinemaVisit | null>;
  updateRating(id: string, rating: number): Promise<CinemaVisit>;
}

// TODO (cinema-visit-service Todo): Implementierung ueber supabase-js Client
// (Tabelle cinema_visits, RLS auf user_id = auth.uid()).
