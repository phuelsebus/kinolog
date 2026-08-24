// Edge Function: ticket-scan
// Kapselt die AI/Vision-Ticketanalyse gemaess dem TicketScanner Interface
// (idee.md Abschnitt 3 "Ticket Recognition" und Abschnitt 4 "Ticket Extraction").
// Nur eingeloggte KinoLog-Nutzer duerfen scannen (auth: 'user'). Der
// OPENAI_API_KEY bleibt serverseitig. Das Ticketbild wird ausschliesslich als
// privater Storage-Pfad im eigenen "Ordner" des Nutzers referenziert - der
// Server erzeugt daraus eine kurzlebige signierte URL fuer die Vision-API.
//
// Monatliches Nutzungslimit (siehe ticket_scan_usage Migration): schuetzt vor
// unbegrenzten OpenAI-Kosten bei wachsender Nutzerzahl. Serverseitig
// durchgesetzt (nicht nur im Client), da sonst leicht umgehbar.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { extractTicketDataFromImage } from "../_shared/openai.ts";

const SIGNED_URL_TTL_SECONDS = 300;
const MONTHLY_SCAN_LIMIT = 10;

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let imagePath: string | undefined;
    try {
      ({ imagePath } = await req.json());
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!imagePath || typeof imagePath !== "string") {
      return Response.json({ error: "'imagePath' ist erforderlich." }, { status: 400 });
    }

    // Sicherheitscheck: der Pfad muss im eigenen "Ordner" des Nutzers liegen,
    // da supabaseAdmin RLS umgeht (vgl. supabase/migrations/*_ticket_images_storage.sql).
    const userId = ctx.userClaims?.id;
    if (!userId || !imagePath.startsWith(`${userId}/`)) {
      return Response.json({ error: "Kein Zugriff auf dieses Bild." }, { status: 403 });
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: usageThisMonth, error: usageError } = await ctx.supabaseAdmin
      .from("ticket_scan_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (usageError) {
      console.error("ticket-scan usage check failed:", usageError);
    } else if ((usageThisMonth ?? 0) >= MONTHLY_SCAN_LIMIT) {
      return Response.json(
        {
          code: "limit_reached",
          error: `Monatliches Scan-Limit erreicht (${MONTHLY_SCAN_LIMIT}/Monat). Bitte trage den Kinobesuch manuell ein oder versuche es nächsten Monat erneut.`,
        },
        { status: 429 },
      );
    }

    try {
      const { data: signed, error: signError } = await ctx.supabaseAdmin.storage
        .from("ticket-images")
        .createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS);

      if (signError || !signed) {
        throw signError ?? new Error("Signed URL konnte nicht erstellt werden.");
      }

      // Vor dem eigentlichen OpenAI-Aufruf zaehlen, da ab hier Kosten anfallen -
      // unabhaengig davon, ob die Extraktion danach inhaltlich gelingt.
      await ctx.supabaseAdmin.from("ticket_scan_usage").insert({ user_id: userId });

      const extraction = await extractTicketDataFromImage(signed.signedUrl);

      const { confidence, rawText, ...fields } = extraction;
      // Nur tatsaechlich erkannte (nicht-null) Felder zurueckgeben - alle
      // Felder sind laut idee.md Abschnitt 4 optional.
      const data = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== null),
      );

      return Response.json({ data, rawText, confidence });
    } catch (error) {
      console.error("ticket-scan failed:", error);
      return Response.json({ error: "Ticketanalyse fehlgeschlagen." }, { status: 502 });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ticket-scan' \
    --header 'Authorization: Bearer <USER_JWT>' \
    --header 'Content-Type: application/json' \
    --data '{"imagePath":"<user_id>/<uuid>.jpg"}'

*/
