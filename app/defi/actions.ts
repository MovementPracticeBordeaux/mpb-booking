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
  if (!['facile', 'moyen', 'dur'].includes(niveau)) return;

  if (prenom) {
    await supabase.from('profiles').update({ nom: prenom }).eq('id', user.id);
  }

  await supabase
    .from('defi_participations')
    .upsert({ defi_id: defiId, eleve_id: user.id, niveau }, { onConflict: 'defi_id,eleve_id' });

  revalidatePath('/defi');
  revalidatePath('/profil');
}
