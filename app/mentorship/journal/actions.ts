'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function ajouterEntreeJournal(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const branche = formData.get('branche') as string;
  const contenu = (formData.get('contenu') as string)?.trim();

  if (!branche || !contenu) {
    redirect('/mentorship/journal?erreur=' + encodeURIComponent('Merci de remplir la branche et une note.'));
  }

  const { error } = await supabase.from('journal_entrainement').insert({
    eleve_id: user.id,
    branche,
    contenu,
  });

  if (error) {
    console.error('Erreur ajout entrée journal:', error.message);
    redirect('/mentorship/journal?erreur=' + encodeURIComponent('Une erreur est survenue, réessaie.'));
  }

  revalidatePath('/mentorship/journal');
  redirect('/mentorship/journal');
}

export async function supprimerEntreeJournal(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  // RLS garantit déjà qu'un élève ne peut supprimer que ses propres entrées,
  // le .eq('eleve_id', ...) est une double sécurité explicite.
  await supabase.from('journal_entrainement').delete().eq('id', id).eq('eleve_id', user.id);

  revalidatePath('/mentorship/journal');
}
