-- KinoLog initial schema
-- Datenmodell gemaess idee.md Abschnitt 5.
-- Alle Tabellen verwenden snake_case Spaltennamen (Postgres-Konvention);
-- die Mapping-Schicht zu den camelCase TS-Typen erfolgt im CinemaVisitService.

create extension if not exists "pgcrypto";

-- =========================================================================
-- profiles: Erweiterung von auth.users um App-spezifische Felder (User.displayName)
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'App-Profil je Supabase Auth User (User Entitaet aus idee.md).';

-- Automatisch ein Profil anlegen, sobald sich ein Nutzer registriert.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- movies: von TMDB geladene Filmdaten (Referenzdaten, von allen Nutzern lesbar)
-- =========================================================================
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'tmdb',
  provider_id text not null,
  title text not null,
  original_title text,
  overview text,
  poster_url text,
  backdrop_url text,
  release_date date,
  runtime integer,
  genres text[] not null default '{}',
  trailer_url text,
  created_at timestamptz not null default now(),
  unique (provider, provider_id)
);

comment on table public.movies is 'Filmdaten aus MovieProvider (TMDB). Referenzdaten, geteilt zwischen Nutzern.';

-- =========================================================================
-- cinemas: Kino-Stammdaten (Referenzdaten, von allen Nutzern lesbar)
-- =========================================================================
create table public.cinemas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (name, city)
);

comment on table public.cinemas is 'Kino-Stammdaten. Referenzdaten, geteilt zwischen Nutzern.';

-- =========================================================================
-- cinema_visits: persoenlicher Kinobesuch (Kernentitaet)
-- =========================================================================
create table public.cinema_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete restrict,
  cinema_id uuid not null references public.cinemas (id) on delete restrict,

  watched_at date not null,
  show_time time,

  hall text,
  row text,
  seat text,

  ticket_price numeric(10, 2),
  ticket_type text check (ticket_type in ('original', 'online', 'unknown')),

  ticket_image_url text,

  rating smallint check (rating between 1 and 5),
  comment text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cinema_visits is 'Persoenlicher Kinobesuch eines Nutzers (Kernentitaet aus idee.md).';

create index cinema_visits_user_id_watched_at_idx
  on public.cinema_visits (user_id, watched_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cinema_visits_set_updated_at
  before update on public.cinema_visits
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- ticket_extractions: Rohergebnis der Ticketanalyse (AI/OCR)
-- =========================================================================
create table public.ticket_extractions (
  id uuid primary key default gen_random_uuid(),
  cinema_visit_id uuid not null references public.cinema_visits (id) on delete cascade,
  raw_text text,
  extracted_data jsonb not null default '{}'::jsonb,
  confidence real,
  provider text not null,
  created_at timestamptz not null default now()
);

comment on table public.ticket_extractions is 'Rohergebnis der TicketScanner-Analyse (AI/OCR), gemaess idee.md Abschnitt 4.';

create index ticket_extractions_cinema_visit_id_idx
  on public.ticket_extractions (cinema_visit_id);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.cinemas enable row level security;
alter table public.cinema_visits enable row level security;
alter table public.ticket_extractions enable row level security;

-- profiles: Nutzer sieht/aendert nur das eigene Profil.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- movies / cinemas: Referenzdaten, fuer alle eingeloggten Nutzer lesbar.
-- Schreibzugriff nur ueber Edge Functions (service_role), nicht direkt vom Client.
create policy "movies_select_authenticated"
  on public.movies for select
  to authenticated
  using (true);

create policy "cinemas_select_authenticated"
  on public.cinemas for select
  to authenticated
  using (true);

-- cinema_visits: strikt privat, nur der jeweilige Besitzer hat Zugriff.
create policy "cinema_visits_select_own"
  on public.cinema_visits for select
  using (auth.uid() = user_id);

create policy "cinema_visits_insert_own"
  on public.cinema_visits for insert
  with check (auth.uid() = user_id);

create policy "cinema_visits_update_own"
  on public.cinema_visits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cinema_visits_delete_own"
  on public.cinema_visits for delete
  using (auth.uid() = user_id);

-- ticket_extractions: Zugriff nur, wenn der zugehoerige cinema_visit dem Nutzer gehoert.
create policy "ticket_extractions_select_own"
  on public.ticket_extractions for select
  using (
    exists (
      select 1 from public.cinema_visits v
      where v.id = ticket_extractions.cinema_visit_id
        and v.user_id = auth.uid()
    )
  );

create policy "ticket_extractions_insert_own"
  on public.ticket_extractions for insert
  with check (
    exists (
      select 1 from public.cinema_visits v
      where v.id = ticket_extractions.cinema_visit_id
        and v.user_id = auth.uid()
    )
  );
