'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

// L'élève renseigne ou modifie son propre téléphone, pour que Sylvain
// puisse le contacter si besoin. Même principe que le prénom : le GRANT en
// base restreint cette action à la seule colonne "telephone".
export async function modifierMonTelephone(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const telephone = (formData.get('telephone') as string)?.trim();

  await supabase.from('profiles').update({ telephone: telephone || null }).eq('id', user.id);

  revalidatePath('/profil');
}
