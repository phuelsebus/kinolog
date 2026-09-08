// Edge Function: legal-terms
// War frueher eine eigene HTML-Seite, leitet jetzt dauerhaft (301) auf die
// echte Seite unter kinoliebeapp.de/nutzungsbedingungen weiter - die Inhalte
// leben jetzt dort (siehe website/src/pages/nutzungsbedingungen.astro).
// Diese URL bleibt bewusst bestehen (nicht geloescht), da sie extern
// verankert ist: Discords OAuth-App-Verifizierung hat genau diese Adresse
// als Terms-of-Service-URL hinterlegt. Aktualisiere die Discord-Angabe bei
// Gelegenheit direkt auf die neue Adresse, der Redirect ist nur das
// Sicherheitsnetz, falls das noch nicht passiert ist.
import "@supabase/functions-js/edge-runtime.d.ts";

const REDIRECT_URL = "https://kinoliebeapp.de/nutzungsbedingungen";

export default {
  fetch: (req: Request) => {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return new Response(null, { status: 301, headers: { Location: REDIRECT_URL } });
  },
};
