import { supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { calculerSemaine } from '@/lib/semaine';
import { joursChevauchement, ajouterJours, premierJourDeCours } from '@/lib/vacances';

// Prolongation des formules à cause des vacances, partagée entre l'admin
// (création d'une période) et la planification automatique (toutes les
// 10 min) : une formule achetée APRÈS la saisie d'une période de vacances
// n'était jusqu'ici jamais prolongée, puisque le calcul ne tournait qu'au
// moment de la création de la période.

const FORMULES_PROLONGEES_PENDANT_VACANCES = ['mensuel_4', 'mensuel_8', 'illimite'];

export async function appliquerProlongationsVacances(vacanceId: string): Promise<{ prolongees: number; debutGel: string | null }> {
  const admin = supabaseAdmin();
  const { data: vacance } = await admin.from('vacances').select('id, date_debut, date_fin').eq('id', vacanceId).single();
  const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).maybeSingle();
  const { data: cours } = await admin.from('cours').select('jour_semaine, semaine').eq('actif', true);
  if (!vacance || !ref) return { prolongees: 0, debutGel: null };

  const lundiRef = new Date(ref.date_lundi_reference);
  const debutGel = premierJourDeCours(vacance.date_debut, vacance.date_fin, cours ?? [], (d) =>
    calculerSemaine(new Date(d + 'T12:00:00Z'), lundiRef, ref.semaine_ce_lundi)
  );
  if (!debutGel) return { prolongees: 0, debutGel: null };

  const { data: abonnements } = await admin
    .from('abonnements')
    .select('id, formule_nom, date_debut_formule, date_expiration')
    .eq('abonnement_actif', true)
    .eq('gele', false)
    .in('formule_nom', FORMULES_PROLONGEES_PENDANT_VACANCES)
    .not('date_expiration', 'is', null)
    .gte('date_expiration', debutGel);
  const { data: dejaFaites } = await admin.from('vacances_prolongations').select('abonnement_id').eq('vacance_id', vacanceId);
  const dejaProlonges = new Set((dejaFaites ?? []).map((d) => d.abonnement_id));

  let prolongees = 0;
  for (const abo of abonnements ?? []) {
    if (dejaProlonges.has(abo.id)) continue;
    // Début de formule inconnu (anciens élèves importés) : on le déduit de
    // la date de fin et de la durée de la formule.
    let debutFormule = abo.date_debut_formule as string | null;
    if (!debutFormule) {
      const d = new Date(abo.date_expiration + 'T12:00:00Z');
      d.setUTCMonth(d.getUTCMonth() - (FORMULES[abo.formule_nom]?.validiteMois ?? 1));
      debutFormule = d.toISOString().slice(0, 10);
    }
    const jours = joursChevauchement(debutFormule, abo.date_expiration, debutGel, vacance.date_fin);
    if (jours <= 0) continue;
    const { error } = await admin.from('vacances_prolongations').insert({ vacance_id: vacanceId, abonnement_id: abo.id, jours });
    if (error) continue; // déjà tracée entre-temps : ne jamais prolonger deux fois
    await admin.from('abonnements').update({ date_expiration: ajouterJours(abo.date_expiration, jours) }).eq('id', abo.id);
    prolongees++;
  }
  return { prolongees, debutGel };
}


// Applique les prolongations pour toutes les vacances pas encore terminées.
// Sans risque de double prolongation (traçage dans vacances_prolongations).
export async function appliquerProlongationsVacancesAVenir(): Promise<number> {
  const admin = supabaseAdmin();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data: periodes } = await admin.from('vacances').select('id').gte('date_fin', aujourdhui);
  let total = 0;
  for (const v of periodes ?? []) total += (await appliquerProlongationsVacances(v.id)).prolongees;
  return total;
}
