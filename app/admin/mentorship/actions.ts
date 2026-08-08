'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export async function validerSoumission(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const moduleId = formData.get('module_id') as string;

  const { error } = await admin.from('mentorship_progression')
    .update({ statut: 'acquis', commentaire_coach: null, reviewed_at: new Date().toISOString() })
    .eq('eleve_id', eleveId).eq('module_id', moduleId);

  if (error) echouer(error.message);
  revalidatePath('/admin/mentorship');
}

export async function refuserSoumission(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const moduleId = formData.get('module_id') as string;
  const commentaire = (formData.get('commentaire') as string)?.trim() || null;

  const { error } = await admin.from('mentorship_progression')
    .update({ statut: 'refuse', commentaire_coach: commentaire, reviewed_at: new Date().toISOString() })
    .eq('eleve_id', eleveId).eq('module_id', moduleId);

  if (error) echouer(error.message);
  revalidatePath('/admin/mentorship');
}
