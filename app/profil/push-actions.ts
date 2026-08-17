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

// Met à jour les préférences par type de notification (rappel de cours /
// confirmation de réservation), pour le push et/ou l'email. Ne touche pas à
// l'abonnement push lui-même — juste quels types de messages l'élève reçoit.
export async function definirPreferencesNotif(preferences: {
  pushRappel?: boolean;
  pushConfirmation?: boolean;
  emailRappel?: boolean;
  emailConfirmation?: boolean;
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: 'Non connecté.' };

  const patch: Record<string, boolean> = {};
  if (typeof preferences.pushRappel === 'boolean') patch.notif_push_rappel = preferences.pushRappel;
  if (typeof preferences.pushConfirmation === 'boolean') patch.notif_push_confirmation = preferences.pushConfirmation;
  if (typeof preferences.emailRappel === 'boolean') patch.notif_email_rappel = preferences.emailRappel;
  if (typeof preferences.emailConfirmation === 'boolean') patch.notif_email_confirmation = preferences.emailConfirmation;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) return { ok: false, erreur: error.message };
  return { ok: true };
}
