// Edge Function: legal-privacy
// Oeffentliche, unauthentifizierte HTML-Fassung der Datenschutzerklaerung
// (Inhalt gespiegelt aus mobile/app/legal/privacy.tsx) unter
// https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/legal-privacy -
// Play Console verlangt fuer das Data-Safety-Formular zwingend eine
// oeffentlich erreichbare Privacy-Policy-URL, die In-App-Route allein reicht
// dafuer nicht. Aenderungen an privacy.tsx sollten hier mitgepflegt werden.
import "@supabase/functions-js/edge-runtime.d.ts";

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Datenschutzerklärung – KinoLiebe</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; margin-top: 1.75rem; margin-bottom: 0.25rem; }
  a { color: #0a66c2; }
</style>
</head>
<body>
<h1>Datenschutzerklärung – KinoLiebe</h1>

<h2>1. Verantwortlicher</h2>
<p>Pascal Hülsebus<br />
E-Mail: <a href="mailto:phuelsebusxx@gmail.com">phuelsebusxx@gmail.com</a><br />
(siehe auch <a href="https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/legal-imprint">Impressum</a>)</p>

<h2>2. Welche Daten wir verarbeiten</h2>
<p>
• Account: E-Mail-Adresse, Anzeigename, Profilbild (optional), Passwort (verschlüsselt gespeichert)<br />
• Kinobesuche: Filmdaten, Kino, Datum/Uhrzeit, Saal/Reihe/Sitz, Preis, Bewertung, Notizen<br />
• Ticketfotos: von dir freiwillig hochgeladene Bilder deiner Kinokarten<br />
• Kino-Standortdaten: Koordinaten von Kinos (keine Standort-/Bewegungsdaten von dir selbst)
</p>

<h2>3. Zweck der Verarbeitung</h2>
<p>Bereitstellung der App-Funktionen: Anmeldung, Speichern und Anzeigen deiner persönlichen Kinobesuch-Bibliothek.</p>

<h2>4. Rechtsgrundlage</h2>
<p>Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags mit dir).</p>

<h2>5. Empfänger / Auftragsverarbeiter</h2>
<p>
• Supabase Inc. – Hosting, Datenbank, Authentifizierung, Dateispeicher (Serverstandort EU/Paris)<br />
• The Movie Database (TMDB) – Filmsuche und Filmdaten<br />
• OpenAI – nur wenn du den Ticket-Scan nutzt: Analyse deines Ticketfotos zur Texterkennung<br />
• OpenStreetMap (Nominatim/Overpass) – nur bei der Kino-Suche: deine Sucheingabe wird übermittelt
</p>

<h2>6. Speicherdauer</h2>
<p>Deine Daten werden gespeichert, bis du deinen Account löschst oder uns zur Löschung aufforderst.</p>

<h2>7. Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und
Widerspruch (Art. 15–21 DSGVO) sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Kontaktiere uns
dafür unter <a href="mailto:phuelsebusxx@gmail.com">phuelsebusxx@gmail.com</a>.</p>

<h2>8. Konto löschen</h2>
<p>Du kannst dein Konto jederzeit direkt in der App unter „Profil" → „Konto löschen" unwiderruflich löschen.
Alternativ (z.B. ohne App-Zugriff):
<a href="https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/account-deletion">https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/account-deletion</a></p>
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
