import { createClient } from '@supabase/supabase-js';

// Gleicher Anon-Key wie die mobile App (siehe mobile/src/lib/supabase.ts) -
// unbedenklich clientseitig, die waitlist_signups-Tabelle hat bewusst keine
// RLS-Policy fuer anon (siehe Migration), einziger Schreibweg ist die
// waitlist-signup Edge Function.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('PUBLIC_SUPABASE_URL/PUBLIC_SUPABASE_ANON_KEY fehlen (siehe .env.example).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
