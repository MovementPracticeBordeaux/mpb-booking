import { supabaseAdmin } from '@/lib/supabase-server';

// Séances suivies sans formule (inscrites par Sylvain, reservations.a_regler) :
// dès que l'élève a une formule collective active, elles y sont déduites,
// comme s'il les avait réservées avec. Appelé après chaque attribution,
// achat ou renouvellement de formule collective. Sans effet si rien n'est dû.
export async function imputerSeancesARegler(eleveId: string): Promise<number> {
  const admin = supabaseAdmin();
  const { data: seances } = await admin
    .from('reservations')
    .select('id')
    .eq('eleve_id', eleveId)
    .eq('a_regler', true)
    .eq('statut', 'confirmee')
    .order('date_seance', { ascending: true });
  if (!seances?.length) return 0;

  const { data: abo } = await admin
    .from('abonnements')
    .select('id, quota_restant')
    .eq('eleve_id', eleveId)
    .eq('categorie', 'planning')
    .eq('abonnement_actif', true)
    .maybeSingle();
  if (!abo) return 0;

  let imputees = 0;
  let quota = abo.quota_restant;
  for (const s of seances) {
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
