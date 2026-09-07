# KinoLiebe

KinoLiebe ist eine App für alle, die sich merken wollen, welche Filme sie im Kino
gesehen haben und wo. Statt loser Kinokarten in der Schublade gibt es eine
durchsuchbare Bibliothek mit Bewertung, Notiz und Originalticket.

## Installation (Android)

Aktuelle Builds gibt es auf der Expo-Projektseite:
https://expo.dev/accounts/phuelsebusxx/projects/kinolog

Dort unter "Builds" den neuesten Android-Build öffnen und den QR-Code mit dem
Gerät scannen, oder den Link direkt öffnen. Die App installiert sich als APK,
ganz ohne Play Store.

iOS ist aktuell nicht verfügbar, dafür wäre ein Apple Developer Account nötig.

## Funktionen

- **Kinobesuch erfassen**: Ticket fotografieren, eine KI liest Film, Kino,
  Datum, Uhrzeit, Saal, Reihe, Sitz und Preis aus und befüllt das Formular vor
  (bis zu 10 Scans im Monat). Oder den Film direkt über die TMDB-Suche finden
  und die Details manuell eintragen.
- **Kino auswählen**: aus bereits erfassten Kinos, oder über eine
  OpenStreetMap-Suche, falls es noch nicht dabei ist.
- **Bibliothek**: chronologische Liste aller Besuche, durchsuchbar und nach
  Datum, Erscheinungsjahr oder Titel sortierbar. Einträge lassen sich nach
  links wischen, um sie zu löschen.
- **Watchlist**: Filme vormerken, die man noch sehen will. Aus einem Eintrag
  lässt sich direkt ein Kinobesuch anlegen, der Eintrag verschwindet dann
  automatisch aus der Liste.
- **Kino-Jahresrückblick**: Anzahl Besuche, verbrachte Zeit im Kinosaal,
  Lieblingsgenre, Lieblingskino, Ausgaben und Durchschnittsbewertung für ein
  gewähltes Jahr.
- **Bewertung und Notiz**: jeder Besuch lässt sich mit 1 bis 5 Sternen und
  einer persönlichen Notiz versehen, auch nachträglich.
- **Profil**: Anzeigename und Profilbild, Konto jederzeit selbst löschbar.
- **Anmeldung** per E-Mail/Passwort oder über Google und Discord.
- Helles und dunkles Design, umschaltbar über den Header.

## Nutzung

Nach der Anmeldung landest du in der Bibliothek. Über die beiden schwebenden
Buttons unten rechts startest du entweder den Ticket-Scan (Kamera-Symbol) oder
die manuelle Filmsuche ("+ Kinobesuch"). Ein Eintrag lässt sich antippen, um
Details zu sehen oder zu bearbeiten. In der Watchlist (Lesezeichen-Symbol in
der Tableiste) merkst du dir Filme für später, im Profil-Tab findest du den
Kino-Jahresrückblick und die Kontoeinstellungen.

## Technisch

Die App ist mit React Native und Expo gebaut, das Backend läuft auf Supabase
(Auth, Datenbank, Storage, Edge Functions). Filmdaten kommen von TMDB, die
Ticket-Erkennung läuft über OpenAI Vision, die Kino-Suche über OpenStreetMap.

## Lokale Entwicklung

```powershell
cd mobile
npm install
Copy-Item .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY eintragen
npx expo start --web          # schnellster Test-Loop im Browser
```
