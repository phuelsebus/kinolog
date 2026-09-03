// Einfaches, DB-gestuetztes Rate-Limiting fuer Edge Functions, die externe
// APIs kapseln (TMDB, Overpass/Nominatim) - schuetzt vor Kosten-/Bann-Risiko
// durch ein Skript mit einem (kostenlos erstellbaren) Account, nicht vor
// normaler Nutzung. Gleiches Prinzip wie das bestehende monatliche
// ticket-scan-Limit (siehe ticket-scan/index.ts), nur generisch ueber
// public.api_usage statt einer eigenen Tabelle pro Function.
//
// Faellt bewusst "offen" aus (erlaubt den Request), wenn die Pruefung selbst
// fehlschlaegt (z.B. DB-Hickser) - ein defektes Rate-Limiting darf normale
// Nutzer nicht aussperren.

// deno-lint-ignore no-explicit-any
export async function checkRateLimit(
  supabaseAdmin: any,
  userId: string,
  endpoint: string,
  limit: number,
  windowMinutes: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", windowStart);

  if (error) {
    console.error(`Rate-Limit-Pruefung fuer ${endpoint} fehlgeschlagen:`, error);
    return true;
  }
  if ((count ?? 0) >= limit) {
    return false;
  }

  const { error: insertError } = await supabaseAdmin.from("api_usage").insert({ user_id: userId, endpoint });
  if (insertError) {
    console.error(`Rate-Limit-Zaehlung fuer ${endpoint} fehlgeschlagen:`, insertError);
  }
  return true;
}

export function rateLimitResponse(): Response {
  return Response.json(
    { error: "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." },
    { status: 429 },
  );
}
