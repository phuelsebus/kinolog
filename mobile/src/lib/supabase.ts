import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { secureSessionStorage } from './secureSessionStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY muessen in .env gesetzt sein (siehe .env.example).'
  );
}

// Auf nativen Plattformen liegt die Session (inkl. Refresh-Token) AES-
// verschluesselt im Storage, der Schluessel selbst im Android Keystore/iOS
// Keychain (siehe secureSessionStorage.ts) - reines AsyncStorage waere
// Klartext auf dem Geraet. SecureStore gibt es im Web-Preview nicht
// (react-native-web, unser schneller Test-Loop), daher dort Fallback auf
// AsyncStorage - Browser-Storage hat ohnehin ein anderes Bedrohungsmodell.
const sessionStorage = Platform.OS === 'web' ? AsyncStorage : secureSessionStorage;

// Nur der öffentliche Anon-Key liegt im Client. Alle privilegierten Aufrufe
// (TMDB, Vision/AI) laufen über Supabase Edge Functions mit Server-Secrets.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
