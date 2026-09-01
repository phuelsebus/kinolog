-- Watchlist: Filme, die der Nutzer noch sehen will, getrennt von den
-- bereits geloggten Kinobesuchen (cinema_visits). Gleiches RLS-Muster wie
-- cinema_visits - strikt user-scoped.
create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

comment on table public.watchlist_items is 'Filme, die der Nutzer noch sehen moechte (getrennt von cinema_visits).';

create index watchlist_items_user_id_created_at_idx
  on public.watchlist_items (user_id, created_at desc);

alter table public.watchlist_items enable row level security;

create policy "watchlist_items_select_own"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "watchlist_items_insert_own"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "watchlist_items_delete_own"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);
