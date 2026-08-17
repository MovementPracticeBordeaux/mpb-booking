'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';

export async function reserverCours(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const coursId = formData.get('cours_id') as string;
  const dateSeance = formData.get('date_seance') as string;

  const echouer = (message: string) => redirect(`/planning?erreur=${encodeURIComponent(message)}`);
  const versLesTarifs = (message: string) => redirect(`/tarifs?erreur=${encodeURIComponent(message)}`);

  // Toute la logique (vérifs + réservation + décompte du quota) tourne dans
  // une seule fonction SQL atomique côté base de données (voir
  // supabase/migration_reservation_atomique.sql) : ça protège à la fois
  // contre un double-clic/double-onglet qui ferait consommer moins de
  // crédits que de séances réellement réservées, et — comme pour les autres
  // écritures dans 'profiles' — ça évite de s'appuyer sur la session de
  // l'élève pour modifier son propre quota.
  const admin = supabaseAdmin();
  const { data: resultat, error } = await admin.rpc('reserver_creneau', {
    p_eleve_id: user.id,
    p_cours_id: coursId,
    p_date_seance: dateSeance,
  });

  if (error) {
    echouer(error.message);
    return;
  }

  switch (resultat) {
    case 'ok':
      break;
    case 'pas_abonne':
      versLesTarifs("Tu n'as pas encore de pass actif — choisis une formule ci-dessous pour pouvoir réserver.");
      return;
    case 'gele':
      echouer('Ton pass est actuellement gelé (contacte Sylvain pour le débloquer).');
      return;
    case 'expire':
      versLesTarifs('Ton pass a expiré — renouvelle-le ci-dessous pour continuer à réserver.');
      return;
    case 'quota_epuise':
      versLesTarifs('Ton pass est épuisé — choisis une nouvelle formule ci-dessous.');
      return;
    case 'deja_reserve':
      echouer('Tu as déjà réservé cette séance.');
      return;
    case 'trop_tard':
      echouer('Trop tard pour réserver cette séance (moins de 1h30 avant le début) — contacte directement Sylvain pour ce cas particulier.');
      return;
    default:
      echouer('Une erreur est survenue, réessaie.');
      return;
  }

  // Email + notification push de confirmation — ne doivent jamais faire
  // échouer la réservation elle-même si Resend/le push sont indisponibles,
  // d'où les try/catch silencieux indépendants l'un de l'autre.
  const { data: cours } = await admin
    .from('cours')
    .select('discipline, heure_debut, heure_fin, lieu')
    .eq('id', coursId)
    .single();

  if (cours) {
    const dateAffichee = new Date(dateSeance + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    if (user.email) {
      try {
        await envoyerEmail(
          user.email,
          `Réservation confirmée : ${cours.discipline} le ${dateAffichee}`,
          `<p>C'est confirmé !</p>
           <p>Tu es inscrit·e au cours de <strong>${cours.discipline}</strong>, le <strong>${dateAffichee}</strong>,
           de ${cours.heure_debut.slice(0, 5)} à ${cours.heure_fin.slice(0, 5)}${cours.lieu ? ` (${cours.lieu})` : ''}.</p>
           <p>Tu peux annuler cette réservation depuis ton espace sur le site, jusqu'à 1h30 avant le début du cours.</p>
           <p>À bientôt !</p>`
        );
      } catch {}
    }

    try {
      await envoyerPushAEleve(
        user.id,
        'Réservation confirmée ✅',
        `${cours.discipline} le ${dateAffichee}, ${cours.heure_debut.slice(0, 5)}-${cours.heure_fin.slice(0, 5)}`,
        '/planning'
      );
    } catch {}
  }

  revalidatePath('/planning');
}

// Annule une réservation existante et restitue le crédit consommé (sauf pour
// les formules illimitées, qui n'en décomptent pas). Impossible d'annuler
// moins de 1h30 avant le début du cours — pour ce cas particulier, l'élève
// doit écrire à Sylvain.
export async function annulerReservation(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const coursId = formData.get('cours_id') as string;
  const dateSeance = formData.get('date_seance') as string;

  const echouer = (message: string) => redirect(`/planning?erreur=${encodeURIComponent(message)}`);

  const DELAI_ANNULATION_MIN = 90; // 1h30 avant le début du cours

  const { data: cours } = await supabase.from('cours').select('heure_debut').eq('id', coursId).single();
  if (cours) {
    const debut = new Date(`${dateSeance}T${cours.heure_debut}`);
    const minutesAvantDebut = (debut.getTime() - Date.now()) / 60000;
    if (minutesAvantDebut < DELAI_ANNULATION_MIN) {
      echouer('Ce cours ne peut plus être annulé (moins de 1h30 avant le début) — contacte directement Sylvain pour ce cas particulier.');
      return;
    }
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id')
    .eq('eleve_id', user.id)
    .eq('cours_id', coursId)
    .eq('date_seance', dateSeance)
    .eq('statut', 'confirmee')
    .single();

  if (!reservation) {
    echouer('Réservation introuvable.');
    return;
  }

  const { error } = await supabase
    .from('reservations')
    .update({ statut: 'annulee' })
    .eq('id', reservation.id);

  if (error) {
    echouer(error.message);
    return;
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('formule_nom, quota_restant')
    .eq('id', user.id)
    .single();

  if (profil && profil.formule_nom !== 'illimite' && profil.quota_restant != null) {
    // Écriture volontairement faite avec le client admin plutôt que la
    // session de l'élève : la policy RLS "profil_update_own" autorise à
    // modifier N'IMPORTE QUELLE colonne de sa propre fiche (pas seulement
    // quota_restant). En écrivant via la session utilisateur ici, on
    // s'appuierait sur cette policy trop permissive pour une opération
    // sensible — un élève pourrait sinon s'auto-attribuer un abonnement en
    // modifiant sa fiche directement depuis le navigateur. Le client admin
    // ignore RLS et ne fait que ce que ce code précis autorise.
    const admin = supabaseAdmin();
    await admin
      .from('profiles')
      .update({ quota_restant: profil.quota_restant + 1 })
      .eq('id', user.id);
  }

  revalidatePath('/planning');
  revalidatePath('/profil');
}
