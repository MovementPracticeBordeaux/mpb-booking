'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function verifierAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') redirect('/');
}

// Ces actions ne redirigent volontairement JAMAIS (contrairement au reste
// de l'admin) : elles sont appelées en rafale sur une même carte ouverte
// (ajouter plusieurs relations, ajuster des mots-clés...), et une
// redirection - même vers la même page avec un paramètre de succès -
// provoquait une navigation qui refermait la carte et effaçait la
// recherche en cours à chaque validation. On se contente de revalidatePath
// (données à jour sans perdre l'état local du composant) et on renvoie un
// petit statut, affiché ou non par l'appelant.

// Ajoute une relation "sert à" entre deux objectifs : sourceId sert à
// atteindre cibleId (directionnel).
export async function ajouterRelation(formData: FormData): Promise<{ ok: boolean; erreur?: string }> {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const sourceId = formData.get('source_id') as string;
  const cibleId = formData.get('cible_id') as string;
  if (!sourceId || !cibleId || sourceId === cibleId) return { ok: false, erreur: 'Choisis deux objectifs différents.' };

  const { error } = await admin.from('objectifs_relations').insert({ objectif_source_id: sourceId, objectif_cible_id: cibleId, type: 'sert_a' });
  if (error && !error.message.includes('duplicate')) return { ok: false, erreur: error.message };

  revalidatePath('/admin/objectifs');
  return { ok: true };
}

export async function supprimerRelation(formData: FormData): Promise<{ ok: boolean; erreur?: string }> {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const relationId = formData.get('relation_id') as string;
  const { error } = await admin.from('objectifs_relations').delete().eq('id', relationId);
  if (error) return { ok: false, erreur: error.message };

  revalidatePath('/admin/objectifs');
  return { ok: true };
}

export async function mettreAJourObjectif(formData: FormData): Promise<{ ok: boolean; erreur?: string }> {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const objectifId = formData.get('objectif_id') as string;
  const motsCles = (formData.get('mots_cles') as string) ?? '';
  const note = (formData.get('note') as string) ?? '';

  const { error } = await admin.from('objectifs_mentorship').update({ mots_cles: motsCles, note }).eq('id', objectifId);
  if (error) return { ok: false, erreur: error.message };

  revalidatePath('/admin/objectifs');
  return { ok: true };
}
