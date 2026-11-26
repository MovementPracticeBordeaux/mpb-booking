'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { envoyerEmail } from '@/lib/resend';

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
  const { data: cand, error } = await admin.from('mentorat_candidatures').update({ statut: 'acceptee' }).eq('id', id).select('email, nom').maybeSingle();
  if (error) echouer(error.message);
  revalidatePath('/admin/candidatures');

  // Prévient le candidat, avec le lien d'inscription et de paiement. Non
  // bloquant : si l'email part mal, la candidature reste acceptée.
  let emailEnvoye = false;
  if (cand?.email) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const lien = `${site}/mentorat/inscription`;
    const nom = (cand.nom ?? '').replace(/[<>&]/g, '');
    try {
      await envoyerEmail(cand.email, 'Ta candidature au Mentorat est acceptée', `
        <p>Bonjour${nom ? ` ${nom}` : ''},</p>
        <p>Bonne nouvelle : ta candidature au Mentorat est acceptée. Je suis content de t'accompagner.</p>
        <p>Pour t'inscrire, connecte-toi sur le site avec cette adresse email (${cand.email.replace(/[<>&]/g, '')}), puis choisis ta formule :</p>
        <p><a href="${lien}">${lien}</a></p>
        <p>Tu peux payer par carte, ou en plusieurs fois avec Klarna quand il est proposé au paiement. Ton accès s'ouvre dès le paiement reçu.</p>
        <p>À très vite,<br>Sylvain — Movement Practice Bordeaux</p>`);
      emailEnvoye = true;
    } catch { /* l'admin est prévenu par le message ci-dessous */ }
  }
  reussir(emailEnvoye ? 'Candidature acceptée : le lien d’inscription a été envoyé par email.' : "Candidature acceptée, mais l'email n'a pas pu partir : envoie-lui le lien /mentorat/inscription.");
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
