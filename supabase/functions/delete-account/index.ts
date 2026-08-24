// Edge Function: delete-account
// Setzt die Play-Store-Pflicht zur Konto-Loeschung um (Google-Play-Richtlinie,
// seit 2026-04-15 verbindlich fuer Apps mit Kontoerstellung): der Nutzer kann
// sein Konto samt aller Daten selbst loeschen.
//
// Loescht zunaechst die eigenen Ticketbilder aus dem privaten "ticket-images"
// Storage-Bucket (werden durch keine DB-Fremdschluessel-Kaskade erfasst), dann
// den auth.users-Eintrag - das kaskadiert per "on delete cascade" automatisch
// zu profiles, cinema_visits und ticket_extractions (siehe
// supabase/migrations/20260813000000_init_schema.sql).
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

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
      const { data: files } = await ctx.supabaseAdmin.storage
        .from("ticket-images")
        .list(userId);

      if (files && files.length > 0) {
        await ctx.supabaseAdmin.storage
          .from("ticket-images")
          .remove(files.map((file) => `${userId}/${file.name}`));
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
