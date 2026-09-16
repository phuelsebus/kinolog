// Gemeinsamer fetch()-Wrapper mit Timeout + einem Retry bei echten
// Netzwerk-/Timeout-Fehlern (nicht bei erhaltenen 4xx/5xx-Antworten - die
// sind meist kein transientes Problem und werden hier normal
// zurueckgegeben, nicht geworfen). Ohne das konnte ein haengender Request
// an TMDB/OpenAI den Nutzer bisher unbegrenzt warten lassen.
const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchWithRetry(
  url: string | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const attempt = () => fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

  try {
    return await attempt();
  } catch (error) {
    console.error(`fetch fehlgeschlagen, versuche ${url} ein zweites Mal:`, error);
    return await attempt();
  }
}
