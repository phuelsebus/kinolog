import { supabase } from '../lib/supabase';
import type { TicketExtractionData } from '../types/models';

export interface TicketExtractionResult {
  data: TicketExtractionData;
  rawText: string | null;
  confidence: number | null;
}

// Abstraktion gemaess idee.md Abschnitt 3 ("Ticket Recognition").
// Die konkrete AI-Implementierung (OpenAI GPT-4o Vision) laeuft serverseitig
// in einer Supabase Edge Function und ist austauschbar.
export interface TicketScanner {
  // imagePath: bereits hochgeladener Storage-Pfad (siehe uploadTicketImage
  // in lib/ticketImages.ts), nicht die lokale Geraete-URI - die Edge
  // Function erzeugt daraus serverseitig eine signierte URL fuer die Vision-API.
  extractTicketData(imagePath: string): Promise<TicketExtractionResult>;
}

// Ruft die Supabase Edge Function "ticket-scan" auf (kapselt OpenAI Vision,
// siehe supabase/functions/ticket-scan/index.ts). Gleiches Muster wie
// tmdbMovieProvider in MovieProvider.ts.
export const openAiTicketScanner: TicketScanner = {
  async extractTicketData(imagePath: string): Promise<TicketExtractionResult> {
    const { data, error } = await supabase.functions.invoke<{
      data: TicketExtractionData;
      rawText: string | null;
      confidence: number | null;
    }>('ticket-scan', { body: { imagePath } });

    if (error) throw error;
    if (!data) throw new Error('Ticketanalyse lieferte keine Daten.');
    return { data: data.data, rawText: data.rawText, confidence: data.confidence };
  },
};

// Wird von scan-ticket.tsx an die nachfolgenden Screens (search-movie,
// new-visit) durchgereicht, um Formularfelder vorzubefuellen.
export type ScanHandoff = TicketExtractionResult & { imagePath: string };

// Legt nach erfolgreichem Speichern eines Kinobesuchs den Rohergebnis-
// Audit-Trail an (idee.md Abschnitt 5, ticket_extractions). Best-effort:
// ein Fehler hier darf das bereits erfolgreiche Anlegen des Kinobesuchs
// nicht rueckgaengig machen oder dem Nutzer als Fehler angezeigt werden.
export async function saveTicketExtraction(
  cinemaVisitId: string,
  result: TicketExtractionResult
): Promise<void> {
  const { error } = await supabase.from('ticket_extractions').insert({
    cinema_visit_id: cinemaVisitId,
    raw_text: result.rawText,
    extracted_data: result.data,
    confidence: result.confidence,
    provider: 'openai-gpt-4o-vision',
  });

  if (error) console.error('saveTicketExtraction failed:', error);
}
