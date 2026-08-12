KinoLog – App Specification

1. Produkt

KinoLog ist eine mobile App zum persönlichen Archivieren von Kinobesuchen.

Der Nutzer fotografiert oder importiert eine Kinokarte. Die App erkennt automatisch die relevanten Daten, findet den passenden Film und erstellt einen persönlichen Eintrag.

Kernidee

Nicht nur Filme tracken, sondern echte Kinobesuche als digitale Erinnerungen speichern.

Beispiel:

🎬 Dune: Part Two
📅 08.08.2026 · 20:15
📍 CinemaxX Hamburg
🎟️ Originalticket
★★★★★
▶ Trailer 2. MVP

Der MVP soll ausschließlich den zentralen Workflow perfekt lösen:

Ticket fotografieren/importieren
↓
Ticket per AI/OCR analysieren
↓
Film automatisch erkennen
↓
Filmdaten über Movie API laden
↓
Nutzer bestätigt/korrigiert
↓
Kinobesuch speichern
↓
In persönlicher Bibliothek anzeigen
MVP-Features
Authentication
Ticket-Foto aufnehmen/importieren
AI/OCR Ticketanalyse
automatische Erkennung von:
Film
Datum
Uhrzeit
Kino
optional Saal / Reihe / Sitz / Preis
Film-Suche über TMDB
Poster und Filmdaten
Trailer
manuelle Korrektur
persönliche Kinobibliothek
Detailseite eines Kinobesuchs
Originalticket speichern/anzeigen
persönliche Bewertung (1–5 Sterne)

Nicht im MVP:

Social Network
Freunde
Gamification
Ticketkauf
Kinoprogramm
komplexe Statistiken
E-Mail-Import
Apple-Wallet-Integration 3. External APIs
Movie Data

Primär TMDB API:

https://developer.themoviedb.org/docs/getting-started

Verwendet für:

Film-Suche
Poster
Beschreibung
Genres
Cast
Regisseur
Laufzeit
Trailer/Videos

Die Movie-API muss über eine eigene Abstraktion gekapselt werden:

interface MovieProvider {
searchMovies(query: string): Promise<MovieSearchResult[]>;
getMovie(id: string): Promise<Movie>;
}
Ticket Recognition

AI/Vision API verwenden.

Die Implementierung ebenfalls abstrahieren:

interface TicketScanner {
extractTicketData(image: Image): Promise<TicketExtractionResult>;
}

Die konkrete AI-Implementierung soll austauschbar sein.

4. Ticket Extraction

Beispielresultat:

{
"movieTitle": "Dune: Part Two",
"date": "2026-08-08",
"time": "20:15",
"cinema": "CinemaxX Hamburg",
"hall": "7",
"row": "7",
"seat": "12",
"price": 14.90
}

Alle Felder sind optional.

AI-Ergebnisse dürfen nicht blind gespeichert werden. Unsichere Daten müssen vom Nutzer bestätigt oder korrigiert werden können.

5. Datenmodell
   User
   id
   email
   displayName
   createdAt
   Movie
   id
   provider
   providerId
   title
   originalTitle
   overview
   posterUrl
   backdropUrl
   releaseDate
   runtime
   genres
   trailerUrl
   Cinema
   id
   name
   address
   city
   country
   latitude
   longitude
   CinemaVisit
   id
   userId
   movieId
   cinemaId

watchedAt
showTime

hall
row
seat

ticketPrice
ticketType

ticketImageUrl

rating
comment

createdAt
updatedAt
TicketExtraction
id
cinemaVisitId
rawText
extractedData
confidence
provider
createdAt 6. Architektur

Externe Services nicht direkt in UI-/Business-Code verwenden.

Mobile App
↓
Backend / Services
├── Auth
├── CinemaVisitService
├── TicketScanner
├── MovieService
└── Storage
↓
External Providers
├── AI / OCR
└── TMDB

Provider austauschbar halten.

API Keys niemals im Client speichern.

Ticketbilder privat speichern und nur für den jeweiligen Nutzer zugänglich machen.

7. UX

Der zentrale Flow soll möglichst wenige Schritte benötigen:

- ↓
  Foto
  ↓
  "Kinobesuch erkannt"
  ↓
  Daten bestätigen
  ↓
  Fertig

Manuelle Eingabe muss immer möglich sein.

Fehlerfälle müssen sauber behandelt werden:

Film nicht erkannt
Kino nicht erkannt
Datum nicht erkannt
mehrere mögliche Filme
unlesbares Ticket 8. Bibliothek

Die Startseite zeigt alle Kinobesuche chronologisch.

Jeder Eintrag enthält mindestens:

Poster
Filmtitel
Datum
Kino
Bewertung

Die Detailseite zeigt zusätzlich:

vollständige Filmdaten
Kinodaten
Ticketinformationen
Originalticket
Trailer
persönliche Notiz 9. Produktprinzipien
Der Kinobesuch ist wichtiger als der Film.
Automatisierung vor manueller Eingabe.
Originalticket als Erinnerungsstück erhalten.
Externe APIs abstrahieren.
MVP klein halten.
Datenschutz und private Ticketbilder berücksichtigen.
Keine unnötigen Features vor dem Kernworkflow. 10. Definition of Done

Der MVP ist fertig, wenn ein Nutzer:

einen Account erstellen kann
ein Ticket fotografieren/importieren kann
die Ticketdaten automatisch erkennen lassen kann
den erkannten Film bestätigen/korrigieren kann
Filmdaten automatisch laden kann
den Kinobesuch speichern kann
ihn in der Bibliothek sieht
die Details öffnen kann
das Originalticket ansehen kann
eine Bewertung vergeben kann
Wichtigstes Ziel

Ticket → Film → Kinobesuch → Erinnerung

Alles andere kommt später.
