import { File } from 'expo-file-system';
import { supabase } from './supabase';

const TICKET_IMAGES_BUCKET = 'ticket-images';

function fileExtensionFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

function mimeFromExtension(extension: string): string {
  return extension === 'png' ? 'image/png' : 'image/jpeg';
}

// Nur zur Erzeugung eines eindeutigen Dateinamens, keine sicherheitskritische
// Verwendung - bewusst kein crypto.randomUUID(): das erfordert im Web einen
// "secure context" (HTTPS oder localhost) und schlaegt sonst fehl, z.B. beim
// Testen ueber die LAN-IP eines Rechners von einem Mobilgeraet aus (http://).
function generateFileId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Laedt ein Ticketbild in den privaten "ticket-images" Bucket hoch.
 * Pfadkonvention: <user_id>/<uuid>.<ext> - RLS erlaubt Zugriff nur auf den
 * eigenen "Ordner" (siehe supabase/migrations/20260813120000_ticket_images_storage.sql).
 * Gibt den Storage-Pfad zurueck (kein oeffentliches URL, da Bucket privat ist).
 *
 * Liest die Datei ueber expo-file-system statt fetch(uri) - Bildauswahl aus
 * der Galerie liefert auf Android oft eine content://-URI, die fetch()
 * teils als beschaedigte/leere Daten liefert; die native File-API von
 * expo-file-system liest solche URIs zuverlaessig.
 */
export async function uploadTicketImage(userId: string, uri: string): Promise<string> {
  const arrayBuffer = await new File(uri).arrayBuffer();
  const extension = fileExtensionFromUri(uri);
  const path = `${userId}/${generateFileId()}.${extension}`;

  const { error } = await supabase.storage
    .from(TICKET_IMAGES_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeFromExtension(extension),
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
