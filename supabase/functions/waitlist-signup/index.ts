// Edge Function: waitlist-signup
// Oeffentlicher Endpunkt fuer das Warteliste-Formular der Marketing-Website
// (kinoliebeapp.de) - traegt eine E-Mail-Adresse in public.waitlist_signups
// ein, bis die App im Play Store gelistet ist. auth:"none" gibt trotzdem
// ctx.supabaseAdmin (service_role, umgeht RLS) - die Tabelle selbst hat
// bewusst keine RLS-Policy, dieser Endpunkt ist der einzige Schreibweg.
//
// Rate-Limiting ueber eine gehashte IP statt einer user_id (kein Login
// vorhanden), siehe checkAnonRateLimit in ../_shared/rateLimit.ts.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { checkAnonRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MINUTES = 60;
// Grobe, bewusst einfache Formvalidierung - die eigentliche Zustellbarkeit
// wird ohnehin erst beim tatsaechlichen Launch-Mailversand sichtbar.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hashIdentifier(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let email: string | undefined;
    try {
      ({ email } = await req.json());
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    email = email?.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email)) {
      return Response.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const identifier = await hashIdentifier(ip);

    const allowed = await checkAnonRateLimit(
      ctx.supabaseAdmin,
      identifier,
      "waitlist-signup",
      RATE_LIMIT,
      RATE_LIMIT_WINDOW_MINUTES,
    );
    if (!allowed) {
      return rateLimitResponse();
    }

    const { error } = await ctx.supabaseAdmin.from("waitlist_signups").insert({ email });
    // 23505 = Unique-Constraint-Konflikt (E-Mail schon eingetragen) - fuer die
    // Nutzerin kein Fehler, gleiches Muster wie CinemaService.createCinema.
    if (error && error.code !== "23505") {
      console.error("waitlist-signup insert failed:", error);
      return Response.json({ error: "Eintragen fehlgeschlagen. Bitte später erneut versuchen." }, { status: 500 });
    }

    return Response.json({ success: true });
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/waitlist-signup' \
    --header 'Content-Type: application/json' \
    --data '{"email":"test@example.com"}'

*/
