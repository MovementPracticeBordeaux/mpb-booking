'use server';

import { supabaseServer } from '@/lib/supabase-server';

// Enregistre l'abonnement push de l'appareil courant pour l'élève connecté.
// Appelée depuis le composant client juste après pushManager.subscribe().
export async function enregistrerAbonnementPush(abonnement: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: 'Non connecté.' };

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      eleve_id: user.id,
      endpoint: abonnement.endpoint,
      p256dh: abonnement.keys.p256dh,
      auth: abonnement.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  if (error) return { ok: false, erreur: error.message };
  return { ok: true };
}

// Supprime l'abonnement de l'appareil courant (l'élève désactive les
// notifications, ou le navigateur signale un endpoint expiré).
export async function supprimerAbonnementPush(endpoint: string) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: 'Non connecté.' };

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('eleve_id', user.id);
  if (error) return { ok: false, erreur: error.message };
  return { ok: true };
}
