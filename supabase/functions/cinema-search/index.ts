// Edge Function: cinema-search
// Kapselt die OpenStreetMap Overpass API als Datenquelle fuer deutsche Kinos
// (idee.md: Cinema hat anders als Movie keine offizielle externe API - siehe
// _shared/overpass.ts). Nur eingeloggte KinoLog-Nutzer duerfen suchen
// (auth: 'user'). Die Ergebnisse werden NICHT hier persistiert - der Client
// legt ein ausgewaehltes Ergebnis ueber die bestehende cinemaService.createCinema()
// an (cinemas hat bereits eine authenticated-Insert-Policy).
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { searchCinemasOverpass } from "../_shared/overpass.ts";
import { bboxAround, geocodeCity } from "../_shared/geocoding.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

// Wird ueber einen expliziten Button-Klick ausgeloest (nicht per Tastendruck-
// Debounce wie movie-search) - normale Nutzung braucht nur eine Handvoll
// Aufrufe pro Sitzung, das Limit ist trotzdem grosszuegig gegen falsch-positive Sperren.
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MINUTES = 5;

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    let query: string | undefined;
    let city: string | undefined;
    try {
      ({ query, city } = await req.json());
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return Response.json({ error: "'query' ist erforderlich." }, { status: 400 });
    }
    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return Response.json({ error: "'city' ist erforderlich." }, { status: 400 });
    }

    const allowed = await checkRateLimit(ctx.supabaseAdmin, userId, "cinema-search", RATE_LIMIT, RATE_LIMIT_WINDOW_MINUTES);
    if (!allowed) return rateLimitResponse();

    try {
      // Erst die Stadt geocoden, um eine kleine (schnelle) Bounding Box fuer
      // die Overpass-Suche zu bekommen - eine deutschlandweite Suche ist auf
      // dem kostenlosen Public-Dienst unzuverlaessig, siehe _shared/overpass.ts.
      const place = await geocodeCity(city.trim());
      if (!place) {
        return Response.json({ results: [] });
      }

      const results = await searchCinemasOverpass(query.trim(), bboxAround(place));
      return Response.json({ results });
    } catch (error) {
      console.error("cinema-search failed:", error);
      return Response.json({ error: "Kino-Suche fehlgeschlagen." }, { status: 502 });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cinema-search' \
    --header 'Authorization: Bearer <USER_JWT>' \
    --header 'Content-Type: application/json' \
    --data '{"query":"CinemaxX","city":"Hamburg"}'

*/
