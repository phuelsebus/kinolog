// Edge Function: movie-search
// Kapselt TMDB gemaess dem MovieProvider Interface (idee.md Abschnitt 3).
// Nur eingeloggte KinoLog-Nutzer duerfen suchen (auth: 'user' erzwingt ein
// gueltiges Supabase Auth JWT). Der TMDB_READ_ACCESS_TOKEN bleibt serverseitig.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { searchMovies } from "../_shared/tmdb.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let query: string | undefined;
    try {
      ({ query } = await req.json());
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return Response.json({ error: "'query' ist erforderlich." }, { status: 400 });
    }

    try {
      const results = await searchMovies(query.trim());
      return Response.json({ results });
    } catch (error) {
      console.error("movie-search failed:", error);
      return Response.json({ error: "Filmsuche fehlgeschlagen." }, { status: 502 });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/movie-search' \
    --header 'Authorization: Bearer <USER_JWT>' \
    --header 'Content-Type: application/json' \
    --data '{"query":"Dune"}'

*/
