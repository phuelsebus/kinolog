// Datenmodell gemaess idee.md Abschnitt 5. Wird in mobile Client und
// Supabase Edge Functions (supabase/functions/_shared) gleichermassen verwendet.

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null; // privater Storage-Pfad, siehe lib/avatarImages.ts
  createdAt: string;
}

export interface Movie {
  id: string;
  provider: string; // z.B. "tmdb"
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

export interface Cinema {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type TicketType = 'original' | 'online' | 'unknown';

export interface CinemaVisit {
  id: string;
  userId: string;
  movieId: string;
  cinemaId: string;

  watchedAt: string; // Datum des Kinobesuchs (ISO date)
  showTime: string | null; // Uhrzeit der Vorstellung, z.B. "20:15"

  hall: string | null;
  row: string | null;
  seat: string | null;

  ticketPrice: number | null;
  ticketType: TicketType | null;

  ticketImageUrl: string | null; // private Storage-URL/-Pfad

  rating: number | null; // 1-5
  comment: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface TicketExtraction {
  id: string;
  cinemaVisitId: string;
  rawText: string | null;
  extractedData: TicketExtractionData;
  confidence: number | null;
  provider: string; // z.B. "openai-gpt-4o-vision"
  createdAt: string;
}

// Ergebnis der Ticketanalyse gemaess idee.md Abschnitt 4. Alle Felder optional -
// unsichere Daten muessen vom Nutzer bestaetigt/korrigiert werden.
export interface TicketExtractionData {
  movieTitle?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  cinema?: string;
  hall?: string;
  row?: string;
  seat?: string;
  price?: number;
}

export interface MovieSearchResult {
  providerId: string;
  title: string;
  originalTitle: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
}

// Kinobesuch inkl. der zugehoerigen Film- und Kinodaten - wird fuer die
// Bibliothek (library-ui) und die Detailseite (detail-ui) verwendet, damit
// dort nicht separat nachgeladen werden muss.
export interface CinemaVisitWithDetails extends CinemaVisit {
  movie: Movie;
  cinema: Cinema;
}

// Film, den der Nutzer noch sehen moechte - getrennt von CinemaVisit
// (bereits geloggte Besuche).
export interface WatchlistItem {
  id: string;
  movieId: string;
  createdAt: string;
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: Movie;
}
