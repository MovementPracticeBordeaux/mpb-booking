'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Un élève choisit (ou change, tant qu'il n'a pas encore été validé par
// l'admin) son niveau pour le défi en cours. La policy RLS
// defi_participations_ecriture_propre garantit qu'il ne peut agir que sur
// sa propre participation, jamais se marquer lui-même comme validé.
//
// Si son profil n'a pas encore de prénom renseigné (juste un email à la
// création du compte), le formulaire le demande en même temps que le
// niveau : le classement public affiche toujours un prénom, jamais un
// email. Complète directement sa fiche au passage.
export async function choisirNiveauDefi(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const defiId = formData.get('defi_id') as string;
  const niveau = formData.get('niveau') as string;
  const prenom = (formData.get('prenom') as string)?.trim();
  if (!['facile', 'moyen', 'dur', 'beast'].includes(niveau)) return;

  if (prenom) {
    await supabase.from('profiles').update({ nom: prenom }).eq('id', user.id);
  }

  // Pas d'upsert ici : ON CONFLICT DO UPDATE toucherait aussi defi_id et
  // eleve_id dans sa clause SET (même à valeur inchangée), qui ne sont
  // plus autorisés en modification depuis le durcissement de sécurité de
  // cette table (seuls niveau et tentative_superieure le sont) — c'est
  // exactement ce qui bloquait "changer de niveau" une fois qu'une
  // participation existait déjà. Update d'abord, insert seulement si rien
  // n'a été mis à jour (première participation à ce défi).
  const { data: misAJour } = await supabase
    .from('defi_participations')
    .update({ niveau })
    .eq('defi_id', defiId)
    .eq('eleve_id', user.id)
    .select('id');

  if (!misAJour || misAJour.length === 0) {
    await supabase.from('defi_participations').insert({ defi_id: defiId, eleve_id: user.id, niveau });
  }

  revalidatePath('/defi');
  revalidatePath('/profil');
}

// Un élève déjà validé signale qu'il tente un AUTRE niveau (plus dur, plus
// facile, peu importe — libre à lui de changer d'avis), sans perdre son
// étoile actuelle en attendant (le champ "niveau" validé ne bouge pas tant
// que l'admin n'a pas confirmé la tentative, via surclasserNiveauParticipation
// qui vide ce champ au passage).
export async function tenterNiveauSuperieur(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const defiId = formData.get('defi_id') as string;
  const niveauVise = formData.get('niveau') as string;
  if (!['facile', 'moyen', 'dur', 'beast'].includes(niveauVise)) return;

  await supabase
    .from('defi_participations')
    .update({ tentative_superieure: niveauVise })
    .eq('defi_id', defiId)
    .eq('eleve_id', user.id);

  revalidatePath('/defi');
}
