# KinoLog

KinoLog ist eine mobile App zum persönlichen Archivieren von Kinobesuchen:
**Ticket → Film → Kinobesuch → Erinnerung**.

Die vollständige Produkt- und Technical Specification befindet sich in [idee.md](./idee.md)
und ist verbindlich für die Entwicklung.

## Tech-Stack

- **Frontend:** React Native + Expo (SDK 57) + TypeScript, Navigation über `expo-router`
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Movie API:** [TMDB](https://developer.themoviedb.org/docs/getting-started)
- **Ticket-Erkennung:** OpenAI GPT-4o Vision (austauschbar über `TicketScanner`-Interface)

Externe Services werden **ausschließlich serverseitig** über Supabase Edge Functions
aufgerufen. API-Keys (TMDB, OpenAI) liegen nur als Supabase Secrets, nie im Client.

## Projektstruktur

```
FilmApp/
├── idee.md                  # verbindliche Produkt-/Technical-Spec
├── mobile/                  # Expo React Native App
│   ├── app/                 # Routen (expo-router)
│   │   ├── (auth)/          # Login/Registrierung
│   │   ├── (tabs)/          # Bibliothek, Profil
│   │   ├── visit/[id].tsx   # Detailseite Kinobesuch
│   │   ├── capture.tsx      # Ticket fotografieren/importieren
│   │   └── confirm.tsx      # Erkannte Daten bestätigen/korrigieren
│   └── src/
│       ├── lib/supabase.ts  # Supabase Client
│       ├── types/models.ts  # Datenmodell (User, Movie, Cinema, CinemaVisit, TicketExtraction)
│       └── services/        # MovieProvider, TicketScanner, CinemaVisitService (Abstraktionen)
└── supabase/                # Supabase Projekt
    ├── config.toml
    ├── migrations/           # DB-Schema (Postgres)
    └── functions/            # Edge Functions (movie-search, ticket-scan, ...)
```

## Setup

### Mobile App

```powershell
cd mobile
npm install
Copy-Item .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY eintragen
npm run start
```

### Supabase

```powershell
cd supabase
npx supabase start            # lokale Supabase-Instanz (Docker erforderlich)
npx supabase secrets set --env-file .env.local   # TMDB_API_KEY, OPENAI_API_KEY
npx supabase db push          # Migrationen anwenden
```

## MVP-Scope

Siehe [idee.md](./idee.md) Abschnitt 2 und 10 (Definition of Done). Kein Feature-Scope
über den dort definierten MVP hinaus ohne ausdrückliche Freigabe.
