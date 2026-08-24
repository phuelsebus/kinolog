-- Nutzungslimit fuer den Ticket-Scan (OpenAI Vision), um Kosten bei
-- wachsender Nutzerzahl zu begrenzen. Ein Eintrag pro tatsaechlichem
-- OpenAI-Aufruf (nicht pro gespeichertem Kinobesuch - ticket_extractions
-- wird nur bei erfolgreichem Speichern befuellt, waehrend hier bereits der
-- Analyse-Versuch selbst gezaehlt wird, da dieser die Kosten verursacht).
create table public.ticket_scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.ticket_scan_usage is 'Ein Eintrag pro Ticket-Scan-Versuch, Grundlage fuer das monatliche Limit in der ticket-scan Edge Function.';

create index ticket_scan_usage_user_id_created_at_idx
  on public.ticket_scan_usage (user_id, created_at);

alter table public.ticket_scan_usage enable row level security;

-- Nutzer darf die eigene Nutzung lesen (z.B. um verbleibendes Kontingent
-- in der App anzuzeigen). Schreiben passiert ausschliesslich ueber die
-- Edge Function (service_role) - kein Insert-Policy fuer authenticated,
-- damit das Limit nicht vom Client umgangen werden kann.
create policy "ticket_scan_usage_select_own"
  on public.ticket_scan_usage for select
  using (auth.uid() = user_id);
