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
  redirect(`/admin/candidatures?erreur=${encodeURIComponent(message)}`);
}

function reussir(message: string): never {
  redirect(`/admin/candidatures?succes=${encodeURIComponent(message)}`);
}

export async function accepterCandidature(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'acceptee' }).eq('id', id);
  if (error) echouer(error.message);
  revalidatePath('/admin/candidatures');
  reussir('Candidature acceptée.');
}

export async function refuserCandidature(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'refusee' }).eq('id', id);
  if (error) echouer(error.message);
  revalidatePath('/admin/candidatures');
  reussir('Candidature refusée.');
}

export async function remettreEnAttente(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'nouvelle' }).eq('id', id);
  if (error) echouer(error.message);
  revalidatePath('/admin/candidatures');
  reussir('Candidature remise en attente.');
}
