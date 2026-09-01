import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Muss beim Modul-Laden einmal aufgerufen werden, damit die per
// WebBrowser.openAuthSessionAsync geoeffnete Session sich korrekt aufloest.
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google';

const redirectTo = makeRedirectUri({ scheme: 'kinolog', path: 'auth-callback' });

/**
 * Google-Login via Supabase Auth OAuth-Flow. Oeffnet den Google-Login im
 * System-Browser (App-Wechsel ist bei OAuth normal), Supabase verarbeitet
 * den Callback serverseitig und leitet danach zu redirectTo zurueck
 * ("kinolog://auth-callback") - von dort werden die Tokens aus der URL
 * extrahiert und die Session gesetzt.
 *
 * Funktioniert NICHT in Expo Go: Google akzeptiert nur fest registrierte
 * Redirect-URLs, Expo Go hat aber kein festes eigenes URL-Schema. Braucht
 * einen Dev-Client- oder Standalone-Build, der das in app.json
 * konfigurierte "kinolog://"-Schema tatsaechlich registriert.
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Login-URL konnte nicht erstellt werden.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    // "cancel"/"dismiss": Nutzer hat den Browser selbst geschlossen - kein Fehler.
    return { error: result.type === 'cancel' || result.type === 'dismiss' ? null : 'Anmeldung fehlgeschlagen.' };
  }

  const { params, errorCode } = getQueryParams(result.url);
  if (errorCode) return { error: errorCode };

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) {
    return { error: 'Keine gültige Sitzung erhalten.' };
  }

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) return { error: sessionError.message };

  return { error: null };
}
