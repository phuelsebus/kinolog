import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

const TICKET_IMAGES_BUCKET = 'ticket-images';

function fileExtensionFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Laedt ein Ticketbild in den privaten "ticket-images" Bucket hoch.
 * Pfadkonvention: <user_id>/<uuid>.<ext> - RLS erlaubt Zugriff nur auf den
 * eigenen "Ordner" (siehe supabase/migrations/20260813120000_ticket_images_storage.sql).
 * Gibt den Storage-Pfad zurueck (kein oeffentliches URL, da Bucket privat ist).
 */
export async function uploadTicketImage(userId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const extension = fileExtensionFromUri(uri);
  const path = `${userId}/${Crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(TICKET_IMAGES_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: response.headers.get('content-type') ?? `image/${extension}`,
      upsert: false,
    });

  if (error) throw error;
  return path;
}

/**
 * Erzeugt eine zeitlich begrenzte signierte URL fuer ein privates Ticketbild,
 * z.B. zur Anzeige auf der Detailseite eines Kinobesuchs.
 */
export async function getTicketImageSignedUrl(
  path: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(TICKET_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
