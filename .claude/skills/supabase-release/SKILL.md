---
name: supabase-release
description: Pusht ausstehende Supabase-Migrationen und deployt die davon betroffenen Edge Functions. Nutzen, wenn Migrationen/Functions lokal fertig sind und live gehen sollen.
disable-model-invocation: true
---

Bringt lokale Aenderungen an `supabase/migrations/` und `supabase/functions/` sicher
auf das verlinkte Remote-Projekt (`htnuvcdolvnnrbxmrryf`).

## Ablauf

1. **Migrationen pruefen**: `cd supabase && npx supabase db push --dry-run`
   zeigt, welche Migrationen noch nicht angewendet sind. `SUPABASE_ACCESS_TOKEN`
   muss gesetzt sein (Personal Access Token, nicht der service_role Key).

2. **Migrationen pushen**: bei Uneindeutigkeit oder wenn eine neue Tabelle/Policy
   betroffen ist, kurz mit dem Nutzer abstimmen, dann `npx supabase db push`
   (ohne `--dry-run`). Migrationen werden nie nachtraeglich veraendert, nur
   durch neue ergaenzt (siehe `CLAUDE.md`).

3. **Betroffene Edge Functions ermitteln**: `git status --short supabase/functions/`
   bzw. `git diff --name-only <letzter-deploy-commit> -- supabase/functions/`
   fuer bereits committete Aenderungen.

4. **Jede betroffene Function deployen**:
   `npx supabase functions deploy <name> --project-ref htnuvcdolvnnrbxmrryf`

5. **Verifizieren**: bei einer neuen oeffentlichen HTTP-Function (z.B. `legal-*`,
   `account-deletion`) die URL per `curl -s -o /dev/null -w "HTTP %{http_code}\n"`
   auf 200 pruefen. Bei einer `auth: "user"`-Function reicht ein Blick auf die
   Deploy-Bestaetigung, ein echter Aufruf braucht einen User-JWT.

## Hinweise

- `supabase start` (lokale Instanz) funktioniert in dieser Umgebung nicht
  (kein Docker) - alles laeuft direkt gegen das Remote-Projekt.
- Migrationen sind datumspraefixiert (`YYYYMMDDHHMMSS_beschreibung.sql`).
- Nach dem Deploy `CLAUDE.md` aktualisieren, falls sich Schema/Functions-Liste
  geaendert haben.
