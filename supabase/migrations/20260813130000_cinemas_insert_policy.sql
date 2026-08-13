-- Ermoeglicht Nutzern, neue Kinos manuell anzulegen (Cinema hat anders als
-- Movie keine externe Datenquelle wie TMDB - der Nutzer traegt Kino-Infos
-- selbst ein, z.B. beim manuellen Erfassen eines Kinobesuchs).
-- Kontext: Nutzerentscheidung 2026-08-13, Hauptflow ist manuelle Filmsuche
-- statt automatischer Ticket-Erkennung (siehe idee.md Abweichung).
create policy "cinemas_insert_authenticated"
  on public.cinemas for insert
  to authenticated
  with check (true);
