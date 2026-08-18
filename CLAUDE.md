# CLAUDE.md

Einstiegspunkt für Coding-Agenten in diesem Repo. Beschreibt den **tatsächlichen** Stand
des Codes (Stand: 2026-08-18), nicht den ursprünglichen Plan.

## Verbindliche Spezifikation

[idee.md](./idee.md) ist die ursprüngliche Produkt-/Technical-Spec und weiterhin die
Grundlage für Datenmodell und Architekturprinzipien. **Eine Abweichung wurde bewusst
beschlossen (2026-08-13):** Der Ticket-Foto/OCR-Flow ist NICHT der aktive MVP-Flow.
Stattdessen ist der Hauptflow: **Film manuell suchen (TMDB) → Kino suchen/anlegen →
Kinobesuch-Details manuell eintragen → speichern.** Die Ticket-Scan-Komponente
(Storage-Bucket, `ticket-scan` Edge Function, OpenAI-Anbindung) ist vollständig
implementiert und getestet, aber **nirgends im UI verdrahtet** (dormant/ungenutzt) –
für eine mögliche spätere Reaktivierung.

## Projektstruktur (Monorepo, kein Root-`package.json`)

```
FilmApp/
├── idee.md                  # Produkt-/Technical-Spec (mit obiger Abweichung)
├── README.md                 # ⚠️ veraltet: erwähnt noch capture.tsx/confirm.tsx (existieren nicht mehr)
├── mobile/                   # Expo React Native App (eigenständiges npm-Projekt)
└── supabase/                 # Supabase-Projekt (Migrationen + Edge Functions)
```

Es gibt zwei getrennte Node-Projekte (`mobile/` mit eigener `package.json`;
`supabase/functions/*` sind Deno-Module ohne eigenes `package.json`, Imports via
JSR/npm-Specifier direkt im Code).

## Tech-Stack

- **Frontend:** Expo SDK 57, React Native 0.86, React 19, TypeScript (strict),
  Navigation via `expo-router` (file-based). Web-Support (`react-dom`,
  `react-native-web`) ist installiert, nur zum lokalen Testen im Browser.
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions/Deno).
  Edge Functions nutzen `@supabase/server` (`withSupabase({ auth: ... })`).
- **Externe APIs:** TMDB (Filmdaten), OpenAI Responses API/`gpt-4o-mini` Vision
  (Ticket-Scan, aktuell ungenutzt).
- Supabase-Projekt: `kinolog`, Ref `htnuvcdolvnnrbxmrryf`, Region West EU (Paris).
  GitHub-Repo: `phuelsebus/kinolog` (privat).

## Mobile App (`mobile/`)

### Routen (`mobile/app/`, expo-router file-based)

| Datei | Zweck |
|---|---|
| `_layout.tsx` | Root-Stack, wrapt alles in `AuthProvider` |
| `index.tsx` | Redirect zu `/(tabs)` oder `/(auth)/login` je nach Session |
| `(auth)/login.tsx`, `(auth)/register.tsx` | Login/Registrierung (Supabase Auth) |
| `(tabs)/_layout.tsx` | Tab-Navigator, schützt Tabs (Redirect zu Login ohne Session) |
| `(tabs)/index.tsx` | **Bibliothek**: chronologische Liste aller Kinobesuche, Pull-to-Refresh, lädt bei Focus neu, FAB "+ Kinobesuch" |
| `(tabs)/profile.tsx` | Profilanzeige (E-Mail, Anzeigename), Logout |
| `search-movie.tsx` | Manuelle Filmsuche über TMDB (`tmdbMovieProvider.searchMovies`), Auswahl ruft `getMovie` (Upsert in DB) und navigiert zu `new-visit` |
| `new-visit.tsx` | Vollständiges Formular für Kinobesuch-Details: Kino suchen/anlegen, Datum/Zeit (**Text-Input, kein Date-Picker** – siehe Known Issues), Saal/Reihe/Sitz/Preis, Tickettyp-Chips, 1–5-Sterne, Notiz. Speichert via `cinemaVisitService.createVisit` |
| `visit/[id].tsx` | **Detailseite**: vollständige Filmdaten, Kino, Ticketinfos, editierbare Sterne-Bewertung, Trailer-Link, Originalticket-Bild (nur falls `ticketImageUrl` gesetzt – aktuell nie, da Scan-Flow inaktiv), Notiz |

### Business-Logik (`mobile/src/`)

- `lib/supabase.ts` – Supabase-Client (Anon-Key, AsyncStorage-Session-Persistenz).
  Wirft beim Start einen Fehler, falls `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` fehlen.
- `lib/mappers.ts` – zentrale snake_case (DB) ↔ camelCase (App) Mapper für
  `Movie`, `Cinema`, `CinemaVisit`, `CinemaVisitWithDetails`.
- `lib/ticketImages.ts` – `uploadTicketImage`/`getTicketImageSignedUrl` für den
  privaten `ticket-images` Storage-Bucket. **Aktuell von keinem UI-Code aufgerufen.**
- `context/AuthContext.tsx` – `AuthProvider`/`useAuth()`, kapselt Supabase-Auth-Session
  (`signIn`, `signUp`, `signOut`), lauscht auf `onAuthStateChange`.
- `services/MovieProvider.ts` – Interface `MovieProvider` + Implementierung
  `tmdbMovieProvider` (ruft Edge Functions `movie-search`/`movie-get` via
  `supabase.functions.invoke`).
- `services/CinemaService.ts` – `searchCinemas`/`createCinema` direkt gegen die
  `cinemas`-Tabelle (kein Edge-Function-Umweg, da keine externe API nötig).
  Behandelt Unique-Constraint-Konflikte (`23505`) durch Fallback-Lookup statt Fehler.
- `services/CinemaVisitService.ts` – `createVisit`/`listVisits`/`getVisit`/
  `updateRating` gegen `cinema_visits`, inkl. gejointer Movie/Cinema-Daten
  (`select('*, movie:movies(*), cinema:cinemas(*)')`).
- `services/TicketScanner.ts` – **nur Interface + TODO-Kommentar, keine
  Client-Implementierung.** Die serverseitige Function existiert (`ticket-scan`),
  ist aber nicht angebunden.
- `types/models.ts` – zentrales Datenmodell (`User`, `Movie`, `Cinema`,
  `CinemaVisit`, `TicketExtraction`, `MovieSearchResult`, `CinemaVisitWithDetails`).

### Config

- `.env` (nicht versioniert) mit `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  – Vorlage in `.env.example`.
- `app.json` – Expo-Config; Kamera-/Fotobibliothek-Permissions sind konfiguriert
  (für den aktuell ungenutzten Ticket-Scan-Flow).
- `tsconfig.json` – `extends: expo/tsconfig.base`, `strict: true`.

## Supabase (`supabase/`)

### Migrationen (`supabase/migrations/`, chronologisch, bereits auf Remote angewendet)

1. `20260813000000_init_schema.sql` – Kernschema: `profiles` (1:1 zu `auth.users`,
   Trigger `handle_new_user` legt bei Signup automatisch ein Profil an), `movies`,
   `cinemas`, `cinema_visits` (Kernentität, Trigger `set_updated_at`),
   `ticket_extractions`. RLS überall aktiv: `cinema_visits`/`ticket_extractions`
   strikt user-scoped, `movies`/`cinemas` für `authenticated` lesbar (Schreiben
   ursprünglich nur via Edge Function/service_role vorgesehen).
2. `20260813120000_ticket_images_storage.sql` – privater Storage-Bucket
   `ticket-images`, RLS nach Pfadkonvention `<user_id>/<file>` (erstes Pfadsegment
   muss `auth.uid()` entsprechen).
3. `20260813130000_cinemas_insert_policy.sql` – erlaubt `authenticated`-Nutzern
   direktes Insert in `cinemas` (Nachtrag zur Scope-Änderung: Kinos haben keine
   externe Datenquelle wie TMDB, Nutzer legt sie manuell an).

### Edge Functions (`supabase/functions/`, Deno, deployed)

- `_shared/tmdb.ts` – TMDB-v3-API-Wrapper (Suche, Details inkl. `videos` für
  Trailer), nutzt Secret `TMDB_READ_ACCESS_TOKEN`.
- `_shared/movie-mapper.ts` – DB-Row→camelCase-Mapper (serverseitiges Gegenstück
  zu `mobile/src/lib/mappers.ts`).
- `_shared/openai.ts` – OpenAI-Responses-API-Wrapper mit `json_schema`
  Structured Output für Ticketextraktion, Secret `OPENAI_API_KEY`, Modell
  `gpt-4o-mini`.
- `movie-search/index.ts` – `auth: "user"`, ruft `searchMovies`.
- `movie-get/index.ts` – `auth: "user"`, ruft `getMovie`, upsert in `movies`
  via `ctx.supabaseAdmin` (bypasst RLS bewusst, da Client keine Insert-Policy hat).
- `ticket-scan/index.ts` – `auth: "user"`, prüft Pfad-Ownership
  (`imagePath.startsWith(userId/)`), erzeugt Signed-URL, ruft OpenAI Vision auf.
  **Implementiert und einzeln getestet, aber von keinem Client-Code aufgerufen.**

Alle drei Functions haben `verify_jwt = false` in `config.toml` (Auth wird von
`@supabase/server`/`withSupabase` selbst geprüft, nicht auf Gateway-Ebene).

### Secrets (nicht im Repo, via `.env.local` + `supabase secrets set`)

`TMDB_API_KEY`, `TMDB_READ_ACCESS_TOKEN`, `OPENAI_API_KEY` – Vorlage in
`supabase/.env.example`.

## Datenmodell (Kurzform)

`auth.users` —1:1→ `profiles` (display_name)
`movies` (TMDB-Referenzdaten, geteilt) ←FK— `cinema_visits` —FK→ `cinemas` (manuell, geteilt)
`cinema_visits` (user-scoped, Kernentität) —1:n→ `ticket_extractions` (aktuell nie befüllt)

`cinema_visits.ticket_type` ist ein Postgres-Check-Constraint (`'original' | 'online' | 'unknown'`),
gespiegelt als TS-Union-Type `TicketType`.

## Entwicklungsbefehle

```powershell
# Mobile App
cd mobile
npm install
Copy-Item .env.example .env      # EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY eintragen
npx tsc --noEmit                 # Type-Check (einziger vorhandener Check – kein Lint/Test-Setup)
npx expo start --web             # Web-Preview im Browser (schnellster Test-Loop)
npx expo start                   # Metro Bundler, QR-Code für Expo Go
npx expo-doctor                  # Projekt-/Abhängigkeits-Validierung

# Supabase
cd supabase
$env:SUPABASE_ACCESS_TOKEN = "<personal access token>"   # npx supabase login funktioniert nicht in Non-TTY-Umgebungen
npx supabase link --project-ref htnuvcdolvnnrbxmrryf
npx supabase db push                      # neue Migrationen anwenden
npx supabase db push --dry-run            # Vorschau ohne Anwendung
npx supabase functions deploy <name>      # einzelne Function deployen
npx supabase secrets set --env-file .env.local
npx supabase config push --project-ref htnuvcdolvnnrbxmrryf --yes   # config.toml-Änderungen (z.B. Auth-Settings) syncen
```

**Kein Test-Framework vorhanden.** `npx tsc --noEmit` ist der einzige automatisierte
Check im Projekt. Validierung erfolgte bisher durch manuelles End-to-End-Testen
(Browser via `expo start --web` + Playwright-Tools, sowie direkte REST-Calls gegen
die Supabase-API zur Verifikation von RLS/Constraints).

**Docker ist nicht verfügbar** in dieser Umgebung – `supabase start` (lokale Instanz)
funktioniert nicht; alle Migrationen/Functions werden direkt gegen das verlinkte
Remote-Projekt gepusht/deployed (`db push` zeigt deshalb eine harmlose
Docker-Warnung, die den eigentlichen Push nicht verhindert).

## Bekannte Probleme / offene Punkte

- **`README.md` ist veraltet**: nennt noch `capture.tsx`/`confirm.tsx`, die zu
  `search-movie.tsx`/`new-visit.tsx` umbenannt wurden.
- **Kein Date-/Time-Picker**: `@react-native-community/datetimepicker` wurde
  installiert und wieder entfernt, da es kein Web-Build-Target hat (Testumgebung
  ist browserbasiert). `new-visit.tsx` verwendet stattdessen validierte
  Text-Eingaben (Regex `JJJJ-MM-TT` / `HH:MM`). Für native Builds könnte ein
  echter Picker nachgerüstet werden.
- **`TicketScanner`/Ticket-Foto-Flow ist tot im UI**: Interface, Storage-Bucket
  und Edge Function existieren und sind getestet, aber kein Screen ruft sie auf.
  Kamera-Permissions in `app.json` sind dafür bereits gesetzt.
- **`ticket_extractions`-Tabelle wird nie beschrieben** (Folge des obigen Punkts).
- Chip-Auswahl für `ticketType`/Sterne-Bewertung: State-Management ist einfach
  gehalten (kein Formular-Library wie `react-hook-form`), rein lokaler
  `useState` pro Feld in `new-visit.tsx`.

## Konventionen

- **Kommentare auf Deutsch**, Code (Bezeichner) auf Englisch – so im gesamten
  Repo durchgehend gehalten.
- **snake_case in Postgres, camelCase in TypeScript** – Übersetzung ausschließlich
  über `mappers.ts` (Client) bzw. `_shared/movie-mapper.ts` (Server), nie ad-hoc.
- **Externe APIs (TMDB, OpenAI) nur serverseitig** über Edge Functions, niemals
  direkt vom Client. API-Keys ausschließlich als Supabase Secrets.
- **RLS ist die primäre Zugriffskontrolle** – Client-Code verlässt sich darauf
  (z.B. `listVisits()` filtert nicht manuell nach `user_id`, das übernimmt RLS).
- **Referenzdaten (`movies`, `cinemas`) sind zwischen allen Nutzern geteilt**,
  nur `cinema_visits`/`ticket_extractions` sind strikt privat.
- Migrationen sind **datumspräfixiert** (`YYYYMMDDHHMMSS_beschreibung.sql`) und
  werden nie nachträglich verändert, sondern durch neue Migrationen ergänzt.
- Git-Commit-Messages sind ausführlich (Mehrzeiler mit Kontext/Testnachweis),
  Trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
