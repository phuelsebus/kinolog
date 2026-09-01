// Mapper: Postgres-Zeilen (snake_case) -> camelCase Domain-Typen des mobile
// Clients (siehe src/types/models.ts). Supabase-js gibt Spalten 1:1 so
// zurueck, wie sie in der DB heissen, daher zentral an einer Stelle mappen.

import type {
  Cinema,
  CinemaVisit,
  CinemaVisitWithDetails,
  Movie,
  TicketType,
  WatchlistItemWithMovie,
} from '../types/models';

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

export function mapMovieRow(row: MovieRow): Movie {
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

export interface CinemaRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function mapCinemaRow(row: CinemaRow): Cinema {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export interface CinemaVisitRow {
  id: string;
  user_id: string;
  movie_id: string;
  cinema_id: string;
  watched_at: string;
  show_time: string | null;
  hall: string | null;
  row: string | null;
  seat: string | null;
  ticket_price: number | string | null;
  ticket_type: TicketType | null;
  ticket_image_url: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export function mapCinemaVisitRow(row: CinemaVisitRow): CinemaVisit {
  return {
    id: row.id,
    userId: row.user_id,
    movieId: row.movie_id,
    cinemaId: row.cinema_id,
    watchedAt: row.watched_at,
    showTime: row.show_time,
    hall: row.hall,
    row: row.row,
    seat: row.seat,
    ticketPrice: row.ticket_price === null ? null : Number(row.ticket_price),
    ticketType: row.ticket_type,
    ticketImageUrl: row.ticket_image_url,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CinemaVisitWithDetailsRow extends CinemaVisitRow {
  movie: MovieRow;
  cinema: CinemaRow;
}

export function mapCinemaVisitWithDetailsRow(row: CinemaVisitWithDetailsRow): CinemaVisitWithDetails {
  return {
    ...mapCinemaVisitRow(row),
    movie: mapMovieRow(row.movie),
    cinema: mapCinemaRow(row.cinema),
  };
}

export interface WatchlistItemWithMovieRow {
  id: string;
  movie_id: string;
  created_at: string;
  movie: MovieRow;
}

export function mapWatchlistItemWithMovieRow(row: WatchlistItemWithMovieRow): WatchlistItemWithMovie {
  return {
    id: row.id,
    movieId: row.movie_id,
    createdAt: row.created_at,
    movie: mapMovieRow(row.movie),
  };
}
