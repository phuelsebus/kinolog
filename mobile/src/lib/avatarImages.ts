import { File } from 'expo-file-system';
import { supabase } from './supabase';

const AVATAR_BUCKET = 'avatars';

function mimeFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  return ext === 'png' ? 'image/png' : 'image/jpeg';
}

/**
 * Laedt ein Profilbild in den privaten "avatars" Bucket hoch. Pfad bewusst
 * OHNE Dateiname-Variation (<user_id>/avatar) - es gibt immer nur ein
 * Profilbild pro Nutzer, upsert ersetzt ein vorhandenes statt eine neue
 * Datei danebenzulegen (vgl. uploadTicketImage in ticketImages.ts, das
 * bewusst eindeutige Namen braucht, da dort mehrere Bilder pro Nutzer
 * existieren).
 *
 * Liest die Datei ueber expo-file-system statt fetch(uri) - Bildauswahl aus
 * der Galerie liefert auf Android oft eine content://-URI, die fetch()
 * teils als beschaedigte/leere Daten liefert; die native File-API von
 * expo-file-system liest solche URIs zuverlaessig.
 */
export async function uploadAvatarImage(userId: string, uri: string): Promise<string> {
  const arrayBuffer = await new File(uri).arrayBuffer();
  const path = `${userId}/avatar`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeFromUri(uri),
      upsert: true,
    });

  if (error) throw error;
  return path;
}

export async function getAvatarSignedUrl(path: string, expiresInSeconds = 60 * 60): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
