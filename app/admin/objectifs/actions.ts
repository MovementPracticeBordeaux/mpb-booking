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

function echouer(message: string): never {
  redirect(`/admin/objectifs?erreur=${encodeURIComponent(message)}`);
}
function reussir(message: string): never {
  redirect(`/admin/objectifs?succes=${encodeURIComponent(message)}`);
}

// Ajoute une relation entre deux objectifs. type='sert_a' (directionnel :
// sourceId sert à atteindre cibleId) ou type='complementaire' (symétrique
// : les deux objectifs se renforcent mutuellement, sans ordre imposé —
// on vérifie donc l'absence de doublon dans les deux sens avant d'insérer,
// puisque (A,B) et (B,A) représentent la même paire complémentaire).
export async function ajouterRelation(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const sourceId = formData.get('source_id') as string;
  const cibleId = formData.get('cible_id') as string;
  const type = (formData.get('type') as string) || 'sert_a';
  if (!sourceId || !cibleId || sourceId === cibleId) echouer('Choisis deux objectifs différents.');

  if (type === 'complementaire') {
    const { data: existante } = await admin
      .from('objectifs_relations')
      .select('id')
      .eq('type', 'complementaire')
      .or(`and(objectif_source_id.eq.${sourceId},objectif_cible_id.eq.${cibleId}),and(objectif_source_id.eq.${cibleId},objectif_cible_id.eq.${sourceId})`)
      .maybeSingle();
    if (existante) echouer('Cette relation complémentaire existe déjà.');
  }

  const { error } = await admin.from('objectifs_relations').insert({ objectif_source_id: sourceId, objectif_cible_id: cibleId, type });
  if (error && !error.message.includes('duplicate')) echouer(error.message);

  revalidatePath('/admin/objectifs');
  reussir('Relation ajoutée.');
}

export async function supprimerRelation(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const relationId = formData.get('relation_id') as string;
  const { error } = await admin.from('objectifs_relations').delete().eq('id', relationId);
  if (error) echouer(error.message);

  revalidatePath('/admin/objectifs');
  reussir('Relation supprimée.');
}

export async function mettreAJourObjectif(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const objectifId = formData.get('objectif_id') as string;
  const motsCles = (formData.get('mots_cles') as string) ?? '';
  const note = (formData.get('note') as string) ?? '';

  const { error } = await admin.from('objectifs_mentorship').update({ mots_cles: motsCles, note }).eq('id', objectifId);
  if (error) echouer(error.message);

  revalidatePath('/admin/objectifs');
  reussir('Objectif mis à jour.');
}
