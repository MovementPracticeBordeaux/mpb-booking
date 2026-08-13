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

export async function accepterCandidature(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'acceptee' }).eq('id', id);
  if (error) console.error('Erreur acceptation candidature:', error.message);
  revalidatePath('/admin/candidatures');
}

export async function refuserCandidature(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'refusee' }).eq('id', id);
  if (error) console.error('Erreur refus candidature:', error.message);
  revalidatePath('/admin/candidatures');
}

export async function remettreEnAttente(formData: FormData) {
  await verifierAdmin();
  const id = formData.get('id') as string;
  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').update({ statut: 'nouvelle' }).eq('id', id);
  if (error) console.error('Erreur remise en attente candidature:', error.message);
  revalidatePath('/admin/candidatures');
}
