// Edge Function: account-deletion
// Oeffentliche, unauthentifizierte HTML-Seite unter
// https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/account-deletion -
// erfuellt die Google-Play-Vorgabe, dass eine Konto-Loeschung auch AUSSERHALB
// der App anfragbar sein muss (Web-Link-Pflicht, seit 2026-04-15), zusaetzlich
// zur In-App-Loeschung in mobile/app/(tabs)/profile.tsx. Bewusst kein
// Self-Service-Formular (unauthentifizierte destruktive Aktionen waeren ein
// Sicherheitsrisiko) - stattdessen manuelle Bearbeitung per E-Mail, wie bei
// einer Solo-Entwickler-App vertretbar.
import "@supabase/functions-js/edge-runtime.d.ts";

const CONTACT_EMAIL = "phuelsebusxx@gmail.com";

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Konto löschen – KinoLiebe</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; margin-top: 2rem; }
  a { color: #0a66c2; }
  .box { background: #f4f4f4; border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; }
</style>
</head>
<body>
<h1>Konto löschen – KinoLiebe</h1>

<h2>Option 1: In der App</h2>
<p>Öffne KinoLiebe, gehe zu <strong>Profil</strong> und tippe unten auf <strong>„Konto löschen“</strong>.
Dein Konto sowie alle gespeicherten Kinobesuche, Bewertungen und Ticketbilder werden dabei
sofort unwiderruflich gelöscht.</p>

<h2>Option 2: Ohne App-Zugriff</h2>
<p>Falls du die App nicht mehr installiert hast oder dich nicht mehr anmelden kannst, schreib
uns eine E-Mail von der Adresse, mit der du dich registriert hast:</p>
<div class="box">
  <a href="mailto:${CONTACT_EMAIL}?subject=Konto%20l%C3%B6schen">${CONTACT_EMAIL}</a>
</div>
<p>Wir löschen dein Konto und alle zugehörigen Daten (Kinobesuche, Bewertungen, Ticketbilder)
dann manuell innerhalb von 30 Tagen.</p>
</body>
</html>`;

export default {
  fetch: (req: Request) => {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
