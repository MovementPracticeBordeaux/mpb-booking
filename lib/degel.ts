import { supabaseAdmin } from '@/lib/supabase-server';

// Hors des fichiers 'use server' : une fonction exportée depuis un tel
// fichier devient une action appelable depuis Internet, or celle-ci ne
// vérifie pas qui l'appelle (elle sert au cron et à l'action admin).
// Dégel : prolonge automatiquement la date de validité du nombre de jours
// pendant lesquels l'abonnement est resté gelé (comme sur le site actuel).
// Factorisée pour être réutilisée par le dégel manuel (bouton admin) et par
// le dégel automatique planifié (cron quotidien, voir api/cron/rappels).
// Cible un abonnement précis (abonnementId) plutôt qu'un élève : depuis la
// refonte multi-abonnements, un élève peut avoir plusieurs abonnements
// actifs (planning/coaching/mentorat), chacun se gèle/dégèle indépendamment.
export async function degelerAbonnement(abonnementId: string): Promise<{ ok: boolean; erreur?: string }> {
  const admin = supabaseAdmin();

  const { data: abo } = await admin.from('abonnements')
    .select('date_gel_debut, date_expiration')
    .eq('id', abonnementId)
    .single();
  if (!abo?.date_gel_debut) return { ok: false, erreur: "Cet abonnement n'est pas gelé." };

  const debutGel = new Date(abo.date_gel_debut);
  const joursGeles = Math.max(0, Math.round((Date.now() - debutGel.getTime()) / (1000 * 60 * 60 * 24)));

  const nouvelleExpiration = new Date(abo.date_expiration ?? new Date());
  nouvelleExpiration.setDate(nouvelleExpiration.getDate() + joursGeles);

  const { error } = await admin.from('abonnements').update({
    gele: false,
    date_gel_debut: null,
    date_fin_gel_prevue: null,
    date_expiration: nouvelleExpiration.toISOString().slice(0, 10),
  }).eq('id', abonnementId);

  return error ? { ok: false, erreur: error.message } : { ok: true };
}

