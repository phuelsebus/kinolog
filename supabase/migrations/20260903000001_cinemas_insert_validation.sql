-- cinemas_insert_authenticated (siehe 20260813130000_cinemas_insert_policy.sql)
-- erlaubt jedem eingeloggten Nutzer with check(true) - ohne jede Validierung.
-- Da cinemas geteilte Referenzdaten sind (fuer alle Nutzer sichtbar), koennte
-- ein einzelner Account beliebigen Muell eintragen. Einfache CHECK-Constraints
-- als Mindestschutz - ersetzen keine serverseitige Rate-Limitierung, machen
-- Spam aber zumindest muehsamer/offensichtlicher fehlschlagend.
alter table public.cinemas
  add constraint cinemas_name_not_blank check (btrim(name) <> '' and char_length(name) <= 200),
  add constraint cinemas_city_length check (city is null or char_length(city) <= 100),
  add constraint cinemas_address_length check (address is null or char_length(address) <= 200),
  add constraint cinemas_country_length check (country is null or char_length(country) <= 100),
  add constraint cinemas_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint cinemas_longitude_range check (longitude is null or longitude between -180 and 180);
