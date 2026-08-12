import { Redirect } from 'expo-router';

// TODO (auth-flow Todo): Basierend auf Supabase Session zu (tabs) oder (auth)/login weiterleiten.
// Platzhalter: leitet direkt zum Login-Screen weiter, bis der Auth-Flow implementiert ist.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
