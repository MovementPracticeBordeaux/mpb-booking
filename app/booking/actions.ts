'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function reserverCours(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');

  const coursId = formData.get('cours_id') as string;
  const dateSeance = formData.get('date_seance') as string;

  const { data: profil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profil || !profil.abonnement_actif || !profil.formule_nom) {
    throw new Error("Aucun pass actif. Rends-toi sur la page tarifs pour en acheter un.");
  }

  if (profil.gele) {
    throw new Error('Ton pass est actuellement gelé (contacte Sylvain pour le débloquer).');
  }

  if (profil.date_expiration && new Date(profil.date_expiration) < new Date()) {
    throw new Error('Ton pass a expiré.');
  }

  // 'illimite' : pas de décompte. Toutes les autres formules ont un quota.
  if (profil.formule_nom !== 'illimite') {
    if (profil.quota_restant <= 0) {
      throw new Error('Ton pass est épuisé (toutes les séances ont été utilisées).');
    }
    const { error: errUpdate } = await supabase
      .from('profiles')
      .update({ quota_restant: profil.quota_restant - 1 })
      .eq('id', user.id);
    if (errUpdate) throw new Error(errUpdate.message);
  }

  const { error } = await supabase.from('reservations').insert({
    eleve_id: user.id,
    cours_id: coursId,
    date_seance: dateSeance,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/');
}
