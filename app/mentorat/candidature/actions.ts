'use server';

import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { MENTORAT_OUVERT } from '@/lib/formules';
import { redirect } from 'next/navigation';

function echouer(message: string): never {
  redirect(`/mentorat/candidature?erreur=${encodeURIComponent(message)}`);
}

export async function envoyerCandidature(formData: FormData) {
  if (!MENTORAT_OUVERT) {
    echouer("Le Mentorat n'accepte pas de nouvelle candidature pour le moment.");
  }

  const nom = (formData.get('nom') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const telephone = (formData.get('telephone') as string)?.trim() || null;
  const niveau = formData.get('niveau') as string;
  const formuleSouhaitee = formData.get('formule_souhaitee') as string;
  const objectifs = (formData.get('objectifs') as string)?.trim();

  if (!nom) echouer('Merci d\'indiquer ton nom.');
  if (!email || !email.includes('@')) echouer('Merci d\'indiquer une adresse email valide.');
  if (!niveau) echouer('Merci d\'indiquer ton niveau actuel.');
  if (!objectifs || objectifs.length < 10) echouer('Merci de préciser un peu tes objectifs.');

  const admin = supabaseAdmin();
  const { error } = await admin.from('mentorat_candidatures').insert({
    nom,
    email,
    telephone,
    niveau,
    formule_souhaitee: formuleSouhaitee || null,
    objectifs,
  });

  if (error) {
    console.error('Erreur insertion candidature Mentorat:', error.message);
    echouer('Une erreur est survenue, réessaie dans un instant.');
  }

  // Prévient Sylvain par email — non bloquant si Resend est indisponible.
  try {
    const destinataire = process.env.ADMIN_ALERT_EMAIL;
    if (destinataire) {
      await envoyerEmail(
        destinataire,
        `Nouvelle candidature Mentorat — ${nom}`,
        `<p><strong>${nom}</strong> (${email}${telephone ? `, ${telephone}` : ''}) vient de candidater au Mentorat.</p>
         <p><strong>Niveau :</strong> ${niveau}</p>
         <p><strong>Formule souhaitée :</strong> ${formuleSouhaitee || 'non précisée'}</p>
         <p><strong>Objectifs :</strong><br/>${objectifs.replace(/\n/g, '<br/>')}</p>
         <p>À traiter depuis /admin (section candidatures).</p>`
      );
    }
  } catch {
    // Non critique : la candidature est déjà enregistrée en base.
  }

  redirect('/mentorat/candidature?envoye=1');
}
