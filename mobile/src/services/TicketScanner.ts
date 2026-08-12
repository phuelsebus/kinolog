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
  extractTicketData(imageUri: string): Promise<TicketExtractionResult>;
}

// TODO (ticket-scanner Todo): Implementierung, die das Ticketbild zu Supabase
// Storage hochlaedt und anschliessend die Edge Function "ticket-scan" aufruft.
