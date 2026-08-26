# KinoLiebe

KinoLiebe ist eine mobile App zum persönlichen Archivieren von Kinobesuchen:
**Ticket → Film → Kinobesuch → Erinnerung**.

## App installieren (Android)

Aktuelle Builds gibt es auf der KinoLiebe-Projektseite auf Expo (technischer
Projekt-Slug bleibt intern "kinolog", siehe CLAUDE.md):
https://expo.dev/accounts/phuelsebusxx/projects/kinolog

Dort unter "Builds" den neuesten Android-Build öffnen und den QR-Code mit dem
Gerät scannen bzw. den Link direkt öffnen – installiert die App als APK, ganz
ohne Play Store.

iOS ist aktuell nicht verfügbar (benötigt einen Apple Developer Account für TestFlight).

## Features

- Anmeldung/Registrierung (Supabase Auth)
- Kinobesuch anlegen: manuelle Filmsuche (TMDB) **oder** Ticket per Kamera/Foto scannen –
  eine KI (OpenAI Vision) erkennt Film, Kino, Datum, Uhrzeit, Saal/Reihe/Sitz und Preis
  automatisch und befüllt das Formular vor, der Nutzer bestätigt/korrigiert
- Kino-Suche über bereits erfasste Kinos, mit OpenStreetMap-Vorschlägen als Fallback
- Kinobesuch bearbeiten (inkl. Filmwechsel) und löschen
- Persönliche Bibliothek mit Bewertung, Trailer, Originalticket-Foto
- Helles/dunkles Design, umschaltbar über den Header

## Tech-Stack

- **Frontend:** React Native + Expo (SDK 57) + TypeScript, Navigation über `expo-router`
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Movie API:** [TMDB](https://developer.themoviedb.org/docs/getting-started)
- **Ticket-Erkennung:** OpenAI GPT-4o Vision (austauschbar über `TicketScanner`-Interface)
- **Kino-Suche:** OpenStreetMap (Nominatim + Overpass API)

Externe Services werden **ausschließlich serverseitig** über Supabase Edge Functions
aufgerufen. API-Keys (TMDB, OpenAI) liegen nur als Supabase Secrets, nie im Client.

## Projektstruktur

```
FilmApp/
├── idee.md                  # ursprüngliche Produkt-/Technical-Spec
├── mobile/                  # Expo React Native App
│   ├── app/                 # Routen (expo-router)
│   │   ├── (auth)/          # Login/Registrierung
│   │   ├── (tabs)/          # Bibliothek, Profil
│   │   ├── visit/[id].tsx   # Detailseite Kinobesuch
│   │   ├── search-movie.tsx # Manuelle Filmsuche (TMDB)
│   │   ├── scan-ticket.tsx  # Ticket per Kamera/Foto scannen
│   │   ├── new-visit.tsx    # Kinobesuch-Formular (Anlegen)
│   │   └── edit-visit.tsx   # Kinobesuch-Formular (Bearbeiten)
│   └── src/
│       ├── lib/supabase.ts  # Supabase Client
│       ├── theme/           # Farbtoken, Light/Dark-ThemeProvider
│       ├── types/models.ts  # Datenmodell (User, Movie, Cinema, CinemaVisit, TicketExtraction)
│       └── services/        # MovieProvider, TicketScanner, CinemaVisitService, CinemaService (Abstraktionen)
└── supabase/                # Supabase Projekt
    ├── config.toml
    ├── migrations/           # DB-Schema (Postgres)
    └── functions/            # Edge Functions (movie-search, ticket-scan, cinema-search, ...)
```

## Setup

### Mobile App

```powershell
cd mobile
npm install
Copy-Item .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY eintragen
npx expo start --web          # schnellster Test-Loop im Browser
```

### Supabase

```powershell
cd supabase
$env:SUPABASE_ACCESS_TOKEN = "<personal access token>"
npx supabase link --project-ref htnuvcdolvnnrbxmrryf
npx supabase secrets set --env-file .env.local   # TMDB_API_KEY, TMDB_READ_ACCESS_TOKEN, OPENAI_API_KEY
npx supabase db push          # Migrationen anwenden
```

Docker/`supabase start` (lokale Instanz) ist in manchen Entwicklungsumgebungen nicht
verfügbar – Migrationen/Functions werden dann direkt gegen das verlinkte Remote-Projekt
gepusht/deployed.
