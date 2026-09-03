-- Generische Nutzungs-Tabelle fuer serverseitiges Rate-Limiting auf
-- Edge Functions, die externe APIs kapseln (movie-search/movie-get: TMDB,
-- cinema-search: Overpass/Nominatim) - bisher hatte nur ticket-scan ein
-- eigenes Limit (ticket_scan_usage). Ein Eintrag pro tatsaechlich
-- durchgefuehrtem Aufruf, "endpoint" unterscheidet die Functions
-- voneinander in derselben Tabelle.
create table public.api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  created_at timestamptz not null default now()
);

comment on table public.api_usage is 'Ein Eintrag pro Aufruf einer rate-limitierten Edge Function, siehe _shared/rateLimit.ts.';

create index api_usage_user_endpoint_created_at_idx
  on public.api_usage (user_id, endpoint, created_at);

alter table public.api_usage enable row level security;

-- Nutzer darf die eigene Nutzung lesen, Schreiben passiert ausschliesslich
-- ueber die Edge Functions (service_role) - kein Insert fuer authenticated,
-- damit das Limit nicht vom Client umgangen werden kann (gleiches Muster
-- wie ticket_scan_usage).
create policy "api_usage_select_own"
  on public.api_usage for select
  using (auth.uid() = user_id);
