-- CinemaService.searchCinemas() sucht per ilike('name', '%query%') - der
-- fuehrende Wildcard verhindert einen normalen B-Tree-Index-Scan, jede
-- Eingabe erzwingt einen Sequential Scan ueber public.cinemas. Nach dem
-- Bulk-Import aller deutschen Kinos (supabase/scripts/import-cinemas.mjs,
-- ~1850 Zeilen) waechst die Tabelle weiter, ein trigram-GIN-Index macht
-- Teilstring-Suche unabhaengig von der Tabellengroesse performant.
create extension if not exists pg_trgm;

create index cinemas_name_trgm_idx
  on public.cinemas using gin (name gin_trgm_ops);
