// Edge Function: legal-imprint
// Oeffentliche, unauthentifizierte HTML-Fassung des Impressums (Inhalt
// gespiegelt aus mobile/app/legal/imprint.tsx) unter
// https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/legal-imprint -
// von legal-privacy verlinkt. Aenderungen an imprint.tsx sollten hier
// mitgepflegt werden.
import "@supabase/functions-js/edge-runtime.d.ts";

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Impressum – KinoLiebe</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; margin-top: 1.75rem; margin-bottom: 0.25rem; }
  a { color: #0a66c2; }
</style>
</head>
<body>
<h1>Impressum – KinoLiebe</h1>

<h2>Angaben gemäß § 5 DDG</h2>
<p>Pascal Hülsebus<br />
[************]<br />
[************]<br />
Deutschland</p>

<h2>Kontakt</h2>
<p>E-Mail: <a href="mailto:phuelsebusxx@gmail.com">phuelsebusxx@gmail.com</a></p>

<h2>Hinweis</h2>
<p>KinoLiebe ist ein privates, nicht-kommerzielles Hobby-Projekt zum persönlichen Archivieren von Kinobesuchen.</p>
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
