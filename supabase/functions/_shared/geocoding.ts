// Duenne Abstraktion um die OpenStreetMap Nominatim API (Geocoding einer
// Stadt zu Koordinaten). Wird ausschliesslich serverseitig verwendet, um aus
// einem Stadtnamen eine kleine Bounding Box fuer die Overpass-Kino-Suche zu
// bauen (siehe overpass.ts) - eine deutschlandweite Overpass-Suche ist auf
// dem kostenlosen Public-Dienst zu langsam/unzuverlaessig, siehe Kommentar
// dort. Kein API-Key noetig, aber Nominatim verlangt einen aussagekraeftigen
// User-Agent und max. 1 Request/s (Usage Policy) - fuer eine explizit vom
// Nutzer ausgeloeste Kino-Suche unproblematisch.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodedPlace {
  latitude: number;
  longitude: number;
}

export async function geocodeCity(city: string): Promise<GeocodedPlace | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', city);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'de');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KinoLog/1.0 (Supabase Edge Function; cinema-search geocoding)',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Nominatim request failed (${response.status}): ${body}`);
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (results.length === 0) return null;

  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
}

// Baut eine Bounding Box (min_lat,min_lon,max_lat,max_lon fuer Overpass) um
// einen Punkt herum. 0.2 Grad entspricht bei deutschen Breitengraden ca.
// 15-22km - deckt eine Stadt samt naeherer Umgebung ab, bleibt aber klein
// genug fuer eine schnelle Overpass-Antwort.
export function bboxAround(place: GeocodedPlace, marginDegrees = 0.2): string {
  const { latitude, longitude } = place;
  return [latitude - marginDegrees, longitude - marginDegrees, latitude + marginDegrees, longitude + marginDegrees].join(
    ','
  );
}
