import { avatarPathFor } from '../lib/avatarImages';
import { supabase } from '../lib/supabase';

// profiles ist die kanonische Quelle fuer User.displayName (idee.md Abschnitt 5),
// nicht die Supabase-Auth-Metadaten - handle_new_user (siehe
// supabase/migrations/20260813000000_init_schema.sql) kopiert display_name bei
// Registrierung einmalig dorthin, kuenftige Aenderungen sollen dort landen.
export interface Profile {
  displayName: string | null;
  avatarUrl: string | null; // privater Storage-Pfad, siehe lib/avatarImages.ts
}

export interface ProfileService {
  getProfile(userId: string): Promise<Profile>;
  updateAvatarUrl(userId: string): Promise<void>;
}

export const profileService: ProfileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return { displayName: data?.display_name ?? null, avatarUrl: data?.avatar_url ?? null };
  },

  // Nimmt bewusst keinen freien avatarUrl-Parameter entgegen - der Pfad
  // wird immer aus der eigenen userId abgeleitet (avatarPathFor), damit ein
  // Nutzer sein Profil nie auf den Storage-Pfad eines anderen Nutzers zeigen
  // lassen kann (RLS auf storage.objects wuerde das Signieren zwar ohnehin
  // verhindern, aber so ist es gar nicht erst moeglich, es zu versuchen).
  async updateAvatarUrl(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarPathFor(userId) })
      .eq('id', userId);
    if (error) throw error;
  },
};
