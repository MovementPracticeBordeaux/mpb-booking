'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BRANCHES, TRONC } from '@/lib/mentorship-modules';

function echouer(message: string): never {
  redirect(`/admin/mentorship?erreur=${encodeURIComponent(message)}`);
}

async function verifierAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') echouer('Accès refusé.');
  return user;
}

function domaineDuNoeud(moduleId: string): string {
  const tronc = TRONC.find((t) => t.id === moduleId);
  if (tronc) return 'tronc';
  return BRANCHES.find((n) => n.id === moduleId)?.domaine ?? 'tronc';
}

// Valide une soumission — et, si Sylvain a rempli le champ "thème observé",
// enregistre au passage une ligne dans le bilan de compétences de l'élève.
// C'est la façon la plus naturelle d'alimenter ce suivi : au moment où il
// regarde la vidéo, sans lui créer de tâche admin séparée.
export async function validerSoumission(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const moduleId = formData.get('module_id') as string;
  const theme = (formData.get('theme') as string)?.trim();
  const noteSuivi = (formData.get('note_suivi') as string)?.trim();

  const { error } = await admin.from('mentorship_progression')
    .update({ statut: 'acquis', commentaire_coach: null, reviewed_at: new Date().toISOString() })
    .eq('eleve_id', eleveId).eq('module_id', moduleId);
  if (error) echouer(error.message);

  if (theme) {
    await admin.from('mentorship_suivi_competence').insert({
      eleve_id: eleveId,
      domaine: domaineDuNoeud(moduleId),
      exercice_ou_theme: theme,
      statut: 'acquis',
      commentaire: noteSuivi || null,
    });
  }

  revalidatePath('/admin/mentorship');
}

export async function refuserSoumission(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const moduleId = formData.get('module_id') as string;
  const commentaire = (formData.get('commentaire') as string)?.trim() || null;
  const theme = (formData.get('theme') as string)?.trim();

  const { error } = await admin.from('mentorship_progression')
    .update({ statut: 'refuse', commentaire_coach: commentaire, reviewed_at: new Date().toISOString() })
    .eq('eleve_id', eleveId).eq('module_id', moduleId);
  if (error) echouer(error.message);

  if (theme) {
    await admin.from('mentorship_suivi_competence').insert({
      eleve_id: eleveId,
      domaine: domaineDuNoeud(moduleId),
      exercice_ou_theme: theme,
      statut: 'difficulte_recurrente',
      commentaire: commentaire,
    });
  }

  revalidatePath('/admin/mentorship');
}
