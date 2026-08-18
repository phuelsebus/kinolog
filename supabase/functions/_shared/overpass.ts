// Duenne Abstraktion um die OpenStreetMap Overpass API (amenity=cinema).
// Wird ausschliesslich serverseitig (Supabase Edge Functions) verwendet.
// Kein API-Key noetig - Overpass ist ein oeffentlicher, geteilter Dienst;
// es gibt keine offizielle kostenlose "alle Kinos Deutschlands"-API, OSM
// ist fuer dieses MVP die praktikabelste Datenquelle.
//
// Wichtig: eine deutschlandweite Suche (ganzes Land als bbox/Polygon) ist auf
// dem kostenlosen Public-Dienst unzuverlaessig langsam (in Tests durchgehend
// >25s oder 504/429) - eine schmale, staedtische Bounding Box (siehe
// geocoding.ts bboxAround) antwortet dagegen typischerweise in <1s. Deshalb
// verlangt cinema-search zusaetzlich zum Kinonamen eine Stadt und die Suche
// laeuft nur innerhalb von deren naeherer Umgebung.

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Die Nutzereingabe wird direkt in die Overpass-QL-Query interpoliert (kein
// parametrisiertes API). '"' und '\' werden entfernt, damit kein String-Literal
// aufgebrochen bzw. keine zusaetzliche QL-Anweisung eingeschleust werden kann;
// verbleibende Regex-Metazeichen werden escaped, Laenge auf 80 Zeichen gekappt.
function sanitizeForOverpassRegex(query: string): string {
  const cleaned = query.replace(/["\\]/g, '').trim();
  return cleaned.replace(/[.*+?^${}()|[\]]/g, '\\$&').slice(0, 80);
}

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OsmCinemaResult {
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function searchCinemasOverpass(query: string, bbox: string): Promise<OsmCinemaResult[]> {
  const safeQuery = sanitizeForOverpassRegex(query);
  if (!safeQuery) return [];

  const ql = `
    [out:json][timeout:15];
    (
      node["amenity"="cinema"]["name"~"${safeQuery}",i](${bbox});
      way["amenity"="cinema"]["name"~"${safeQuery}",i](${bbox});
    );
    out center 20;
  `;

  // Overpass/OSM-Infrastruktur lehnt Requests ohne aussagekraeftigen
  // User-Agent teils mit 406 ab (uebliche Praxis bei OSM-Diensten, vgl.
  // Nominatim Usage Policy). Der Deno-Runtime-Default reicht dafuer nicht.
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Accept: 'application/json',
      'User-Agent': 'KinoLog/1.0 (Supabase Edge Function; cinema-search)',
    },
    body: ql,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Overpass request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as OverpassResponse;

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const tags = el.tags!;
      const street = tags['addr:street'];
      const houseNumber = tags['addr:housenumber'];

      return {
        name: tags.name,
        address: street ? [street, houseNumber].filter(Boolean).join(' ') : null,
        city: tags['addr:city'] ?? null,
        country: 'Deutschland',
        latitude: el.lat ?? el.center?.lat ?? null,
        longitude: el.lon ?? el.center?.lon ?? null,
      };
    });
}
