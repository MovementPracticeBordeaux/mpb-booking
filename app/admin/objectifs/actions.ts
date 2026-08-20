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

// Ajoute une relation entre deux objectifs. type='sert_a' (directionnel :
// sourceId sert à atteindre cibleId) ou type='complementaire' (symétrique
// : les deux objectifs se renforcent mutuellement, sans ordre imposé —
// on vérifie donc l'absence de doublon dans les deux sens avant d'insérer,
// puisque (A,B) et (B,A) représentent la même paire complémentaire).
export async function ajouterRelation(formData: FormData): Promise<{ ok: boolean; erreur?: string }> {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const sourceId = formData.get('source_id') as string;
  const cibleId = formData.get('cible_id') as string;
  const type = (formData.get('type') as string) || 'sert_a';
  if (!sourceId || !cibleId || sourceId === cibleId) return { ok: false, erreur: 'Choisis deux objectifs différents.' };

  if (type === 'complementaire') {
    const { data: existante } = await admin
      .from('objectifs_relations')
      .select('id')
      .eq('type', 'complementaire')
      .or(`and(objectif_source_id.eq.${sourceId},objectif_cible_id.eq.${cibleId}),and(objectif_source_id.eq.${cibleId},objectif_cible_id.eq.${sourceId})`)
      .maybeSingle();
    if (existante) return { ok: false, erreur: 'Cette relation complémentaire existe déjà.' };
  }

  const { error } = await admin.from('objectifs_relations').insert({ objectif_source_id: sourceId, objectif_cible_id: cibleId, type });
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
