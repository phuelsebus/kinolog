// Edge Function: movie-get
// Laedt vollstaendige Filmdaten von TMDB (MovieProvider.getMovie, idee.md
// Abschnitt 3) und cached sie per Upsert in public.movies. Der Upsert laeuft
// ueber ctx.supabaseAdmin (bypasst RLS), da movies bewusst keine Insert-Policy
// fuer normale Nutzer hat - Schreibzugriff nur ueber diese Edge Function.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { getMovie } from "../_shared/tmdb.ts";
import { mapMovieRow, type MovieRow } from "../_shared/movie-mapper.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let providerId: string | undefined;
    try {
      ({ providerId } = await req.json());
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!providerId || typeof providerId !== "string") {
      return Response.json({ error: "'providerId' ist erforderlich." }, { status: 400 });
    }

    try {
      const movie = await getMovie(providerId);

      const { data, error } = await ctx.supabaseAdmin
        .from("movies")
        .upsert(
          {
            provider: "tmdb",
            provider_id: movie.providerId,
            title: movie.title,
            original_title: movie.originalTitle,
            overview: movie.overview,
            poster_url: movie.posterUrl,
            backdrop_url: movie.backdropUrl,
            release_date: movie.releaseDate,
            runtime: movie.runtime,
            genres: movie.genres,
            trailer_url: movie.trailerUrl,
          },
          { onConflict: "provider,provider_id" },
        )
        .select()
        .single();

      if (error) throw error;

      return Response.json({ movie: mapMovieRow(data as MovieRow) });
    } catch (error) {
      console.error("movie-get failed:", error);
      return Response.json({ error: "Filmdaten konnten nicht geladen werden." }, { status: 502 });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/movie-get' \
    --header 'Authorization: Bearer <USER_JWT>' \
    --header 'Content-Type: application/json' \
    --data '{"providerId":"438631"}'

*/
