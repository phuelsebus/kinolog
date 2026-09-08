// Edge Function: legal-imprint
// War frueher eine eigene HTML-Seite, leitet jetzt dauerhaft (301) auf die
// echte Seite unter kinoliebeapp.de/impressum weiter - die Inhalte leben
// jetzt dort (siehe website/src/pages/impressum.astro). Von legal-privacy
// verlinkt, deshalb bewusst bestehen gelassen statt geloescht.
import "@supabase/functions-js/edge-runtime.d.ts";

const REDIRECT_URL = "https://kinoliebeapp.de/impressum";

export default {
  fetch: (req: Request) => {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return new Response(null, { status: 301, headers: { Location: REDIRECT_URL } });
  },
};
