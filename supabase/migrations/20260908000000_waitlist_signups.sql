-- Warteliste fuer die Marketing-Website (kinoliebeapp.de) - sammelt
-- E-Mail-Adressen, bis die App im Play Store gelistet ist. Bewusst KEINE
-- RLS-Policy fuer anon/authenticated: Inserts laufen ausschliesslich ueber
-- die waitlist-signup Edge Function (service_role, umgeht RLS), damit der
-- oeffentliche Anon-Key kein direktes, unlimitiertes Insert erlaubt.
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups
  add constraint waitlist_signups_email_not_blank
  check (btrim(email) <> '' and char_length(email) <= 254);

comment on table public.waitlist_signups is 'E-Mail-Warteliste von der Marketing-Website, bis die App im Play Store gelistet ist.';

create unique index waitlist_signups_email_idx on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
