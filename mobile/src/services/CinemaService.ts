import { supabase } from '../lib/supabase';
import { mapCinemaRow, type CinemaRow } from '../lib/mappers';
import type { Cinema } from '../types/models';

export interface CreateCinemaInput {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// Anders als Movie (TMDB) gibt es fuer Cinema keine externe Datenquelle -
// Nutzer suchen in bereits erfassten Kinos oder legen ein neues an
// (idee.md: Kino wird beim Kinobesuch erfasst). Schreibzugriff ist durch
// die RLS-Policy cinemas_insert_authenticated erlaubt (siehe
// supabase/migrations/20260813130000_cinemas_insert_policy.sql).
export interface CinemaService {
  searchCinemas(query: string): Promise<Cinema[]>;
  createCinema(input: CreateCinemaInput): Promise<Cinema>;
}

export const cinemaService: CinemaService = {
  async searchCinemas(query: string): Promise<Cinema[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await supabase
      .from('cinemas')
      .select('*')
      .ilike('name', `%${trimmed}%`)
      .order('name')
      .limit(20);

    if (error) throw error;
    return (data as CinemaRow[]).map(mapCinemaRow);
  },

  async createCinema(input: CreateCinemaInput): Promise<Cinema> {
    const cinema = {
      name: input.name,
      address: input.address ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    };

    const { data, error } = await supabase.from('cinemas').insert(cinema).select().single();

    if (!error) return mapCinemaRow(data as CinemaRow);

    // cinemas hat einen unique(name, city) Constraint (siehe
    // supabase/migrations/20260813000000_init_schema.sql). Bei einem
    // Duplikat existiert das Kino bereits - das bestehende laden statt
    // einen Fehler an den Nutzer durchzureichen. Ein direktes upsert wuerde
    // bei Konflikt ein UPDATE ausloesen, fuer das normale Nutzer keine RLS-
    // Berechtigung haben.
    if (error.code === '23505') {
      let query = supabase.from('cinemas').select('*').eq('name', cinema.name);
      query = cinema.city === null ? query.is('city', null) : query.eq('city', cinema.city);

      const { data: existing, error: selectError } = await query.maybeSingle();

      if (selectError) throw selectError;
      if (existing) return mapCinemaRow(existing as CinemaRow);
    }

    throw error;
  },
};
