// Edge Function: delete-account
// Setzt die Play-Store-Pflicht zur Konto-Loeschung um (Google-Play-Richtlinie,
// seit 2026-04-15 verbindlich fuer Apps mit Kontoerstellung): der Nutzer kann
// sein Konto samt aller Daten selbst loeschen.
//
// Loescht zunaechst die eigenen Dateien aus den privaten Storage-Buckets
// ("ticket-images", "avatars" - werden durch keine DB-Fremdschluessel-
// Kaskade erfasst), dann den auth.users-Eintrag - das kaskadiert per
// "on delete cascade" automatisch zu profiles, cinema_visits und
// ticket_extractions (siehe supabase/migrations/20260813000000_init_schema.sql).
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const USER_STORAGE_BUCKETS = ["ticket-images", "avatars"];
const LIST_PAGE_SIZE = 100;

// storage.list() liefert standardmaessig max. 100 Eintraege pro Aufruf -
// ohne Paginierung wuerden bei einem Nutzer mit mehr als 100 Ticketfotos
// nur die ersten 100 geloescht und der Rest verwaist im Bucket zurueckbleiben
// (widerspricht dem Vollstaendigkeits-Versprechen der Konto-Loeschung).
// deno-lint-ignore no-explicit-any
async function listAllFiles(storage: any, bucket: string, userId: string): Promise<string[]> {
  const names: string[] = [];
  let offset = 0;
  for (;;) {
    const { data: files, error } = await storage
      .from(bucket)
      .list(userId, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;
    if (!files || files.length === 0) break;
    names.push(...files.map((file: { name: string }) => `${userId}/${file.name}`));
    if (files.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }
  return names;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    try {
      for (const bucket of USER_STORAGE_BUCKETS) {
        const paths = await listAllFiles(ctx.supabaseAdmin.storage, bucket, userId);
        if (paths.length > 0) {
          await ctx.supabaseAdmin.storage.from(bucket).remove(paths);
        }
      }

      const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return Response.json({ success: true });
    } catch (error) {
      console.error("delete-account failed:", error);
      return Response.json({ error: "Konto konnte nicht geloescht werden." }, { status: 500 });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/delete-account' \
    --header 'Authorization: Bearer <USER_JWT>'

*/
