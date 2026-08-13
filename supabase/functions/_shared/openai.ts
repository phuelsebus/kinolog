// Duenne Abstraktion um die OpenAI Responses API (Vision + Structured Outputs).
// Wird ausschliesslich serverseitig (Supabase Edge Functions) verwendet - der
// OPENAI_API_KEY verlaesst nie den Server (vgl. idee.md Abschnitt 3 "Ticket Recognition").
//
// Die konkrete AI-Implementierung ist bewusst hinter extractTicketDataFromImage()
// gekapselt, damit sie austauschbar bleibt (z.B. gegen einen reinen OCR-Provider).

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4o-mini';

export interface RawTicketExtraction {
  movieTitle: string | null;
  date: string | null;
  time: string | null;
  cinema: string | null;
  hall: string | null;
  row: string | null;
  seat: string | null;
  price: number | null;
  confidence: number;
  rawText: string | null;
}

const TICKET_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    movieTitle: { type: ['string', 'null'], description: 'Titel des Films, so wie auf dem Ticket abgedruckt.' },
    date: { type: ['string', 'null'], description: 'Datum der Vorstellung im Format YYYY-MM-DD.' },
    time: { type: ['string', 'null'], description: 'Uhrzeit der Vorstellung im Format HH:mm (24h).' },
    cinema: { type: ['string', 'null'], description: 'Name des Kinos.' },
    hall: { type: ['string', 'null'], description: 'Saalnummer/-name, falls vorhanden.' },
    row: { type: ['string', 'null'], description: 'Reihe, falls vorhanden.' },
    seat: { type: ['string', 'null'], description: 'Sitzplatznummer, falls vorhanden.' },
    price: { type: ['number', 'null'], description: 'Ticketpreis als Zahl (z.B. 14.90), ohne Waehrungssymbol.' },
    confidence: {
      type: 'number',
      description: 'Gesamteinschaetzung (0-1), wie sicher die Erkennung insgesamt ist.',
    },
    rawText: { type: ['string', 'null'], description: 'Der vollstaendige, auf dem Ticket erkannte Text.' },
  },
  required: ['movieTitle', 'date', 'time', 'cinema', 'hall', 'row', 'seat', 'price', 'confidence', 'rawText'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Du bist ein praezises Extraktionswerkzeug fuer Kinokarten (Tickets).
Analysiere das Bild einer Kinokarte und extrahiere ausschliesslich Informationen,
die tatsaechlich auf dem Ticket sichtbar sind. Erfinde keine Werte. Wenn ein Feld
nicht erkennbar ist, setze es auf null. Gib eine ehrliche confidence (0-1) an,
die widerspiegelt, wie sicher du bei der Gesamterkennung bist - niedrige Werte
(< 0.5) bei unscharfen, teilweise verdeckten oder unleserlichen Tickets.`;

function getApiKey(): string {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) {
    throw new Error('OPENAI_API_KEY ist nicht als Supabase Secret gesetzt.');
  }
  return key;
}

interface ResponsesApiContentItem {
  type: string;
  text?: string;
}

interface ResponsesApiOutputItem {
  type: string;
  content?: ResponsesApiContentItem[];
}

interface ResponsesApiResult {
  output?: ResponsesApiOutputItem[];
}

/**
 * Analysiert ein Ticketbild (per oeffentlich erreichbarer, i.d.R. zeitlich
 * begrenzter signierter URL) und liefert die extrahierten Felder gemaess
 * idee.md Abschnitt 4. Alle Felder ausser confidence sind optional/nullable -
 * unsichere Daten muessen vom Nutzer clientseitig bestaetigt werden.
 */
export async function extractTicketDataFromImage(imageUrl: string): Promise<RawTicketExtraction> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Extrahiere die Daten dieser Kinokarte.' },
            { type: 'input_image', image_url: imageUrl, detail: 'high' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'ticket_extraction',
          schema: TICKET_EXTRACTION_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body}`);
  }

  const result = (await response.json()) as ResponsesApiResult;
  const message = result.output?.find((item) => item.type === 'message');
  const textContent = message?.content?.find((c) => c.type === 'output_text')?.text;

  if (!textContent) {
    throw new Error('OpenAI hat keine verwertbare Antwort geliefert.');
  }

  return JSON.parse(textContent) as RawTicketExtraction;
}
