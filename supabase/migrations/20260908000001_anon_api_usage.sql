-- Anonymes Gegenstueck zu public.api_usage (siehe
-- 20260903000002_api_usage.sql): dort ist user_id verpflichtend und
-- referenziert auth.users, was fuer anonyme Aufrufer (z.B. das
-- Warteliste-Formular auf der Marketing-Website ohne Login) nicht passt.
-- Gleiches Zaehl-Prinzip, nur ueber einen Identifier (gehashte IP) statt
-- einer echten user_id - siehe checkAnonRateLimit in
-- supabase/functions/_shared/rateLimit.ts.
create table public.anon_api_usage (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  endpoint text not null,
  created_at timestamptz not null default now()
);

comment on table public.anon_api_usage is 'Rate-Limit-Zaehlung fuer oeffentliche, unauthentifizierte Edge Functions (z.B. Warteliste-Signup).';

create index anon_api_usage_identifier_endpoint_created_at_idx
  on public.anon_api_usage (identifier, endpoint, created_at);

alter table public.anon_api_usage enable row level security;
-- Keine Policies: nur service_role (Edge Functions) liest/schreibt hier.
