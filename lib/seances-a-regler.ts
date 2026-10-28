import { supabaseAdmin } from '@/lib/supabase-server';

// Séances suivies sans formule (inscrites par Sylvain, reservations.a_regler) :
// dès que l'élève a une formule collective active, elles y sont déduites,
// comme s'il les avait réservées avec. Appelé après chaque attribution,
// achat ou renouvellement de formule collective. Sans effet si rien n'est dû.
export async function imputerSeancesARegler(eleveId: string): Promise<number> {
  const admin = supabaseAdmin();
  const { data: seances } = await admin
    .from('reservations')
    .select('id, date_seance')
    .eq('eleve_id', eleveId)
    .eq('a_regler', true)
    .eq('statut', 'confirmee')
    .order('date_seance', { ascending: true });
  if (!seances?.length) return 0;

  const { data: abo } = await admin
    .from('abonnements')
    .select('id, quota_restant, date_expiration, gele, date_gel_debut, date_fin_gel_prevue')
    .eq('eleve_id', eleveId)
    .eq('categorie', 'planning')
    .eq('abonnement_actif', true)
    .maybeSingle();
  if (!abo) return 0;

  // Une formule ne couvre que les séances jusqu'à sa date de fin (prolongée
  // d'un éventuel gel). Une séance après expiration reste à régler.
  const finValidite = expirationEffective(abo);

  let imputees = 0;
  let quota = abo.quota_restant;
  for (const s of seances) {
    if (finValidite && s.date_seance > finValidite) continue;
    // Formule à nombre de séances épuisée : la séance reste due.
    if (quota != null && quota <= 0) break;
    const { error } = await admin.from('reservations').update({ a_regler: false }).eq('id', s.id).eq('a_regler', true);
    if (error) break;
    if (quota != null) quota -= 1;
    imputees++;
  }
  if (abo.quota_restant != null && imputees > 0) {
    await admin.from('abonnements').update({ quota_restant: quota }).eq('id', abo.id);
  }
  return imputees;
}

// Date de fin réelle d'une formule (YYYY-MM-DD), gel compris — même calcul
// que la réservation (reserver_creneau). null = sans date de fin.
export function expirationEffective(abo: {
  date_expiration: string | null;
  gele?: boolean | null;
  date_gel_debut?: string | null;
  date_fin_gel_prevue?: string | null;
}): string | null {
  if (!abo.date_expiration) return null;
  if (abo.gele && abo.date_gel_debut && abo.date_fin_gel_prevue) {
    const jours = Math.round(
      (Date.parse(abo.date_fin_gel_prevue + 'T00:00:00Z') - Date.parse(abo.date_gel_debut + 'T00:00:00Z')) / 86400000
    );
    const d = new Date(abo.date_expiration + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
  }
  return abo.date_expiration;
}
