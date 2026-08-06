'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function reserverCours(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const coursId = formData.get('cours_id') as string;
  const dateSeance = formData.get('date_seance') as string;

  const echouer = (message: string) => redirect(`/planning?erreur=${encodeURIComponent(message)}`);
  const versLesTarifs = (message: string) => redirect(`/tarifs?erreur=${encodeURIComponent(message)}`);

  const { data: profil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profil || !profil.abonnement_actif || !profil.formule_nom) {
    versLesTarifs("Tu n'as pas encore de pass actif — choisis une formule ci-dessous pour pouvoir réserver.");
    return;
  }

  if (profil.gele) {
    echouer('Ton pass est actuellement gelé (contacte Sylvain pour le débloquer).');
    return;
  }

  if (profil.date_expiration && new Date(profil.date_expiration) < new Date()) {
    versLesTarifs('Ton pass a expiré — renouvelle-le ci-dessous pour continuer à réserver.');
    return;
  }

  // 'illimite' : pas de décompte. Toutes les autres formules ont un quota.
  if (profil.formule_nom !== 'illimite') {
    if (profil.quota_restant <= 0) {
      versLesTarifs('Ton pass est épuisé — choisis une nouvelle formule ci-dessous.');
      return;
    }
    const { error: errUpdate } = await supabase
      .from('profiles')
      .update({ quota_restant: profil.quota_restant - 1 })
      .eq('id', user.id);
    if (errUpdate) {
      echouer(errUpdate.message);
      return;
    }
  }

  const { error } = await supabase.from('reservations').insert({
    eleve_id: user.id,
    cours_id: coursId,
    date_seance: dateSeance,
  });

  if (error) {
    echouer(error.message);
    return;
  }

  revalidatePath('/planning');
}
