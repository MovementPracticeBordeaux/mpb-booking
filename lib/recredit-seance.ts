import type { SupabaseClient } from '@supabase/supabase-js';

// Formule à laquelle rendre une séance annulée.
// - Séance "à régler" (sans formule) : rien n'avait été décompté, rien à rendre.
// - Sinon, la formule qui a payé la séance (reservations.abonnement_id), si elle
//   est encore active ou en attente.
// - Si cette formule est terminée : la séance va à la formule active seulement
//   si l'ancienne était encore valable à ce jour (remplacée avant sa date de
//   fin). Une formule expirée ne rend rien : ses séances sont perdues.
// - Anciennes réservations sans formule connue : formule active.
// Le recrédit ne dépasse jamais le nombre de séances de la formule (voir
// quotaApresRecredit), pour qu'aucun jeu d'annulations ne fasse cumuler.
export type FormuleRecredit = {
  id: string;
  formule_nom: string;
  quota_restant: number | null;
  quota_total: number | null;
  date_expiration: string | null;
};

const COLONNES = 'id, formule_nom, quota_restant, quota_total, date_expiration, abonnement_actif, en_attente';

export async function formuleARecrediter(
  admin: SupabaseClient,
  r: { eleve_id: string; abonnement_id?: string | null; a_regler?: boolean | null },
  aujourdhuiISO: string
): Promise<FormuleRecredit | null> {
  if (r.a_regler) return null;
  if (r.abonnement_id) {
    const { data: payeuse } = await admin.from('abonnements').select(COLONNES).eq('id', r.abonnement_id).maybeSingle();
    if (payeuse && (payeuse.abonnement_actif || payeuse.en_attente)) return payeuse;
    if (payeuse && payeuse.date_expiration && payeuse.date_expiration < aujourdhuiISO) return null;
  }
  const { data: active } = await admin.from('abonnements').select(COLONNES)
    .eq('eleve_id', r.eleve_id).eq('categorie', 'planning').eq('abonnement_actif', true).maybeSingle();
  return active ?? null;
}

// Nouveau nombre de séances après avoir rendu une séance, plafonné au total
// de la formule. null = rien à modifier (illimité).
export function quotaApresRecredit(abo: { formule_nom: string; quota_restant: number | null; quota_total: number | null }): number | null {
  if (abo.formule_nom === 'illimite' || abo.quota_restant == null) return null;
  const plafond = abo.quota_total ?? Infinity;
  return Math.min(abo.quota_restant + 1, plafond);
}
