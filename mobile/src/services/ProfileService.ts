import { supabase } from '../lib/supabase';

// profiles ist die kanonische Quelle fuer User.displayName (idee.md Abschnitt 5),
// nicht die Supabase-Auth-Metadaten - handle_new_user (siehe
// supabase/migrations/20260813000000_init_schema.sql) kopiert display_name bei
// Registrierung einmalig dorthin, kuenftige Aenderungen sollen dort landen.
export interface ProfileService {
  getDisplayName(userId: string): Promise<string | null>;
}

export const profileService: ProfileService = {
  async getDisplayName(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.display_name ?? null;
  },
};
