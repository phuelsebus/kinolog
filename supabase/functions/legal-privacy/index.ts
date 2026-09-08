// Edge Function: legal-privacy
// War frueher eine eigene HTML-Seite, leitet jetzt dauerhaft (301) auf die
// echte Seite unter kinoliebeapp.de/datenschutz weiter - die Inhalte leben
// jetzt dort (siehe website/src/pages/datenschutz.astro). Diese URL bleibt
// bewusst bestehen (nicht geloescht), da sie extern verankert ist: Google
// Play Console's Data-Safety-Formular hat genau diese Adresse als
// Privacy-Policy-URL hinterlegt. Aktualisiere die Play-Console-URL bei
// Gelegenheit direkt auf die neue Adresse, der Redirect ist nur das
// Sicherheitsnetz, falls das noch nicht passiert ist.
import "@supabase/functions-js/edge-runtime.d.ts";

const REDIRECT_URL = "https://kinoliebeapp.de/datenschutz";

export default {
  fetch: (req: Request) => {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return new Response(null, { status: 301, headers: { Location: REDIRECT_URL } });
  },
};
