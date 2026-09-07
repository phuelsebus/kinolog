// Edge Function: auth-redirect
// Oeffentliche, unauthentifizierte Weiterleitung unter
// https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/auth-redirect -
// noetig, weil Mail-Apps nur echte http(s)-Links automatisch antippbar
// verlinken; ein "kinolog://..."-Link im E-Mail-Template (siehe
// supabase/templates/recovery.html) ist dort nur toter Text.
//
// Liefert bewusst einen echten HTTP-302-Redirect statt einer gerenderten
// HTML-Zwischenseite: der Supabase-Functions-Gateway erzwingt bei JEDER
// Response "Content-Type: text/plain" + "X-Content-Type-Options: nosniff"
// (bestaetigter, ungeloester Plattform-Bug - betrifft auch account-deletion/
// legal-*), wodurch ein HTML-Body nie als HTML gerendert wird, egal welchen
// Content-Type der Code setzt. Ein 302 braucht dagegen keinen renderbaren
// Body - der Browser folgt der Location direkt in die App-eigene Custom-URL.
import "@supabase/functions-js/edge-runtime.d.ts";

const APP_SCHEME = "kinolog";
const ALLOWED_TYPES = new Set(["recovery", "invite", "magiclink", "signup", "email_change"]);

export default {
  fetch: (req: Request) => {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(req.url);
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") ?? "";

    if (!tokenHash || !ALLOWED_TYPES.has(type)) {
      return new Response("Ungültiger oder abgelaufener Link.", { status: 400 });
    }

    const deepLink = `${APP_SCHEME}://auth-callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
    return new Response(
      `Falls sich die App nicht automatisch oeffnet: ${deepLink}`,
      { status: 302, headers: { Location: deepLink } }
    );
  },
};
