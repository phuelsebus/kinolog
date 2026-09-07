---
name: play-store-release-notes
description: Erstellt deutsche Play-Store-Release-Notes (unter 500 Zeichen) aus den Commits seit dem letzten EAS-Android-Build. Nutzen, wenn ein neuer Build fuer den Play Store ansteht.
---

## Kontext sammeln

- Letzter fertiger Android-Build (Commit + Build-Nummer): `cd mobile && npx eas-cli build:list --platform android --limit 5 --non-interactive --json`
  - Den `gitCommitHash` des letzten `FINISHED`-Builds mit `status: "FINISHED"` nehmen (nicht `IN_PROGRESS`).
- Commits seit diesem Build: `git log --pretty=format:'%h %s' <letzter-build-commit>..HEAD`

## Release Notes schreiben

1. Commits nach Nutzer-Sichtbarkeit filtern (interne Refactorings, reine
   Perf-/Security-Haertung ohne UI-Aenderung, CI-Kram: weglassen).
2. Neue Features und sichtbare Verbesserungen in einfachen, kurzen Saetzen
   auf Deutsch zusammenfassen - keine Commit-Message-Fachsprache.
3. **Hartes Limit: unter 500 Zeichen** (Play Console lehnt laengere Texte
   fuer ein Sprachfeld ab). Lieber knapp als vollstaendig.
4. Ausgabe als Fließtext, bereit zum Einfuegen ins de-DE-Feld der Play
   Console (kein Markdown, keine Aufzaehlungszeichen - die Console
   rendert sie nicht).

## Beispiel-Ton

"Neu: Watchlist zum Merken von Filmen, Kino-Jahresrückblick mit persönlicher
Statistik, Login mit Google & Discord sowie Wisch-zum-Löschen für
Kinobesuche und Watchlist-Einträge. Außerdem: kleinere Fehlerbehebungen."
