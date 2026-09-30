'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normaliserTelephone } from '@/lib/telephone';

// L'élève modifie son propre prénom (affiché notamment dans le classement
// du défi du mois). Le GRANT en base restreint cette action à la seule
// colonne "nom" — impossible de toucher à autre chose via cette action,
// même en cas de requête bidouillée.
export async function modifierMonPrenom(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const prenom = (formData.get('prenom') as string)?.trim();
  if (!prenom) return;

  await supabase.from('profiles').update({ nom: prenom }).eq('id', user.id);

  revalidatePath('/profil');
  revalidatePath('/defi');
}

// L'élève renseigne ou modifie son propre téléphone. Obligatoire : Sylvain
// doit pouvoir joindre tout élève (changement de cours, lieu, annulation),
// y compris ceux qui ne sont pas dans le groupe WhatsApp. Le GRANT en base
// restreint cette action à la seule colonne "telephone".
export async function enregistrerMonTelephone(
  _etat: { erreur?: string; ok?: boolean },
  formData: FormData
): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const telephone = normaliserTelephone(formData.get('telephone') as string);
  if (!telephone) {
    return { erreur: 'Numéro invalide. Exemple : 06 12 34 56 78 (ou +44 7911 123456 pour un numéro étranger).' };
  }

  const { error } = await supabase.from('profiles').update({ telephone }).eq('id', user.id);
  if (error) return { erreur: "L'enregistrement a échoué, réessaie dans un instant." };

  revalidatePath('/', 'layout');
  return { ok: true };
}
