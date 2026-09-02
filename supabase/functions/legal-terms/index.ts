// Edge Function: legal-terms
// Oeffentliche, unauthentifizierte HTML-Fassung der Nutzungsbedingungen
// (Inhalt gespiegelt aus mobile/app/legal/terms.tsx) unter
// https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/legal-terms -
// gebraucht z.B. fuer die "Terms of Service"-URL bei der Discord-OAuth-
// App-Verifizierung. Aenderungen an terms.tsx sollten hier mitgepflegt werden.
import "@supabase/functions-js/edge-runtime.d.ts";

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nutzungsbedingungen – KinoLiebe</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; margin-top: 1.75rem; margin-bottom: 0.25rem; }
  a { color: #0a66c2; }
</style>
</head>
<body>
<h1>Nutzungsbedingungen – KinoLiebe</h1>

<h2>1. Geltungsbereich</h2>
<p>Diese Nutzungsbedingungen gelten für die Nutzung der App KinoLiebe durch dich als Nutzer. Mit der Registrierung
akzeptierst du diese Bedingungen.</p>

<h2>2. Beschreibung des Dienstes</h2>
<p>KinoLiebe ist ein kostenloses, privates Hobby-Projekt zum persönlichen Archivieren von Kinobesuchen (Filme,
Kinos, Bewertungen, Ticketfotos). Es besteht kein Anspruch auf ununterbrochene Verfügbarkeit oder
Weiterentwicklung der App.</p>

<h2>3. Nutzerkonto</h2>
<p>Für die Nutzung ist ein Konto erforderlich (E-Mail/Passwort oder Anmeldung über Google/Discord). Du bist für
die Sicherheit deiner Zugangsdaten selbst verantwortlich und trägst dafür Sorge, dass Dritte keinen Zugriff auf
dein Konto erhalten.</p>

<h2>4. Deine Inhalte</h2>
<p>Alle von dir eingetragenen Daten (Kinobesuche, Notizen, Ticketfotos, Profilbild) bleiben dein Eigentum. Wir
nutzen sie ausschließlich zur Bereitstellung der App-Funktionen, nicht für eigene Zwecke Dritter. Details dazu
in der <a href="https://htnuvcdolvnnrbxmrryf.supabase.co/functions/v1/legal-privacy">Datenschutzerklärung</a>.</p>

<h2>5. Haftungsausschluss</h2>
<p>Die App wird "wie besehen" ohne Garantie auf Fehlerfreiheit oder ständige Verfügbarkeit bereitgestellt. Für
Datenverlust wird nur im gesetzlich vorgeschriebenen Umfang gehaftet. Filmdaten stammen von TMDB und werden
ohne Gewähr für Richtigkeit übernommen.</p>

<h2>6. Änderungen</h2>
<p>Diese Bedingungen können bei Bedarf angepasst werden, z.B. wenn neue Funktionen hinzukommen. Wesentliche
Änderungen werden in der App kommuniziert.</p>

<h2>7. Kündigung / Konto löschen</h2>
<p>Du kannst dein Konto jederzeit selbst löschen (Profil → "Konto löschen"). Damit werden auch alle zugehörigen
Daten unwiderruflich entfernt.</p>

<h2>8. Anwendbares Recht</h2>
<p>Es gilt deutsches Recht.</p>

<h2>9. Kontakt</h2>
<p>Fragen zu diesen Bedingungen: <a href="mailto:phuelsebusxx@gmail.com">phuelsebusxx@gmail.com</a></p>
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
