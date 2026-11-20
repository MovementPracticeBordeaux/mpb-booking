'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';
import { parisVersUTC } from '@/lib/dates-paris';
import { formuleARecrediter, quotaApresRecredit } from '@/lib/recredit-seance';

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
      versLesTarifs("Tu n'as pas encore de pass actif.");
      return;
    case 'gele':
      echouer('Ton pass est actuellement gelé (contacte Sylvain pour le débloquer).');
      return;
    case 'expire':
      versLesTarifs('Ton pass a expiré.');
      return;
    case 'quota_epuise':
      versLesTarifs('Ton pass est épuisé — choisis une nouvelle formule ci-dessous.');
      return;
    case 'deja_reserve':
      echouer('Tu as déjà réservé cette séance.');
      return;
    case 'annulee':
      echouer('Cette séance est annulée.');
      return;
    case 'pas_commence':
      echouer("Ta formule n'a pas encore commencé : tu pourras réserver les séances à partir de sa date de début.");
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
        const { data: profilPrefs } = await admin.from('profiles').select('notif_email_confirmation').eq('id', user.id).single();
        if (profilPrefs?.notif_email_confirmation !== false) {
          await envoyerEmail(
            user.email,
            `Réservation confirmée : ${cours.discipline} le ${dateAffichee}`,
            `<p>C'est confirmé !</p>
             <p>Tu es inscrit·e au cours de <strong>${cours.discipline}</strong>, le <strong>${dateAffichee}</strong>,
             de ${cours.heure_debut.slice(0, 5)} à ${cours.heure_fin.slice(0, 5)}${cours.lieu ? ` (${cours.lieu})` : ''}.</p>
             <p>Tu peux annuler cette réservation depuis ton espace sur le site, jusqu'à 1h30 avant le début du cours.</p>
             <p>À bientôt !</p>`
          );
        }
      } catch {}
    }

    try {
      await envoyerPushAEleve(
        user.id,
        'Réservation confirmée ✅',
        `${cours.discipline} le ${dateAffichee}, ${cours.heure_debut.slice(0, 5)}-${cours.heure_fin.slice(0, 5)}`,
        '/planning',
        'confirmation'
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
  if (!cours) {
    echouer('Cours introuvable.');
    return;
  }
  {
    // Heure du cours = heure de Paris (le serveur tourne en UTC : sans
    // conversion, on pouvait annuler jusqu'à 30 min APRÈS le début en été).
    const debut = new Date(parisVersUTC(`${dateSeance}T${String(cours.heure_debut).slice(0, 5)}`));
    const minutesAvantDebut = (debut.getTime() - Date.now()) / 60000;
    if (minutesAvantDebut < DELAI_ANNULATION_MIN) {
      echouer('Ce cours ne peut plus être annulé (moins de 1h30 avant le début) — contacte directement Sylvain pour ce cas particulier.');
      return;
    }
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, eleve_id, a_regler, abonnement_id')
    .eq('eleve_id', user.id)
    .eq('cours_id', coursId)
    .eq('date_seance', dateSeance)
    .eq('statut', 'confirmee')
    .single();

  if (!reservation) {
    echouer('Réservation introuvable.');
    return;
  }

  // Écriture côté serveur : l'élève n'a plus le droit de modifier lui-même
  // ses réservations depuis le navigateur. La réservation a été retrouvée
  // ci-dessus avec SA session, donc elle lui appartient bien.
  const admin = supabaseAdmin();
  // Ne passe qu'une fois : un double clic ne rend pas deux séances.
  const { data: annulee, error } = await admin
    .from('reservations')
    .update({ statut: 'annulee', a_regler: false })
    .eq('id', reservation.id)
    .eq('eleve_id', user.id)
    .eq('statut', 'confirmee')
    .select('id');

  if (error) {
    echouer(error.message);
    return;
  }
  if (!annulee?.length) {
    revalidatePath('/planning');
    return;
  }

  // Séance inscrite "à régler" (sans formule) : rien n'avait été décompté,
  // donc rien à recréditer.
  if (reservation.a_regler) {
    revalidatePath('/planning');
    revalidatePath('/profil');
    return;
  }

  const abo = await formuleARecrediter(admin, reservation, new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }));
  const nouveauQuota = abo ? quotaApresRecredit(abo) : null;
  if (abo && nouveauQuota != null) {
    // Écriture avec le client admin : l'élève n'a que la lecture sur ses formules.
    await admin.from('abonnements').update({ quota_restant: nouveauQuota }).eq('id', abo.id);
  }

  revalidatePath('/planning');
  revalidatePath('/profil');
}
