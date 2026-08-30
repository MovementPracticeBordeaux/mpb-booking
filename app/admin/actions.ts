'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FORMULES } from '@/lib/formules';
import { joursVacancesDansPeriode, ajouterJours } from '@/lib/vacances';
import { stripe } from '@/lib/stripe';
import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';

// Toute erreur dans une action admin redirige vers la page d'où elle vient
// (avec un message clair), au lieu de crasher (Next.js masque les throw en
// production) ou de renvoyer ailleurs dans l'admin.
function echouer(chemin: string, message: string): never {
  redirect(`${chemin}?erreur=${encodeURIComponent(message)}`);
}

// Symétrique de echouer() : confirmation visible après une action réussie
// (bandeau vert), pour qu'un clic sur "Attribuer"/"Valider"/etc. donne
// toujours un retour visuel clair, succès ou échec.
function reussir(chemin: string, message: string): never {
  redirect(`${chemin}?succes=${encodeURIComponent(message)}`);
}

async function verifierAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') echouer('/admin', 'Accès refusé.');
  return user;
}

// --- Planning collectif -----------------------------------------------

export async function ajouterCours(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const { error } = await admin.from('cours').insert({
    discipline: formData.get('discipline') as string,
    semaine: formData.get('semaine') as string,
    jour_semaine: Number(formData.get('jour_semaine')),
    heure_debut: formData.get('heure_debut') as string,
    heure_fin: formData.get('heure_fin') as string,
    lieu: formData.get('lieu') as string,
  });
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Cours ajouté au planning.');
}

export async function desactiverCours(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const id = formData.get('id') as string;
  const { error } = await admin.from('cours').update({ actif: false }).eq('id', id);
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Créneau désactivé.');
}

export async function definirSemaineReference(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const { error } = await admin.from('semaine_reference').upsert({
    id: 1,
    date_lundi_reference: formData.get('date_lundi_reference') as string,
    semaine_ce_lundi: formData.get('semaine_ce_lundi') as string,
  });
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Semaine de référence mise à jour.');
}

// Périodes de vacances : tant que la date du jour est dans l'une de ces
// périodes, le planning public affiche un message "en vacances" au lieu des
// cours pour ce jour-là. Plusieurs périodes distinctes peuvent coexister
// dans l'année (Toussaint, Noël, été...), chacune ajoutable/supprimable
// individuellement.
export async function ajouterVacances(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const debut = formData.get('date_debut') as string;
  const fin = formData.get('date_fin') as string;

  if (!debut || !fin) echouer('/admin/planning', 'Indique une date de début et une date de fin.');
  if (fin < debut) echouer('/admin/planning', 'La date de fin doit être après la date de début.');

  const { error } = await admin.from('vacances').insert({ date_debut: debut, date_fin: fin });
  if (error) echouer('/admin/planning', error.message);

  // Prolonge automatiquement les formules actives qui chevauchent cette
  // nouvelle période de vacances, pour que l'élève garde un mois (ou la
  // durée de sa formule) effectivement utilisable. Exemple : formule du 15
  // juillet au 15 août, vacances du 1er au 15 août -> nouvelle date de fin
  // le 30 août. Ne concerne QUE les formules mensuelles récurrentes (4
  // cours/mois, 8 cours/mois, illimité) — pas les carnets (5/10 cours),
  // dont la validité (3/6 mois) est pensée pour être consommée à son
  // rythme, indépendamment des périodes de fermeture. Ne concerne pas non
  // plus les pass déjà gelés manuellement (leur propre mécanisme de dégel
  // gère déjà leur prolongation), ni les profils sans date de début connue
  // (élèves déjà migrés depuis Wix, entre autres).
  const FORMULES_CONCERNEES_PAR_LES_VACANCES = ['mensuel_4', 'mensuel_8', 'illimite'];
  const { data: profilsActifs } = await admin
    .from('profiles')
    .select('id, date_debut_formule, date_expiration')
    .eq('abonnement_actif', true)
    .eq('gele', false)
    .in('formule_nom', FORMULES_CONCERNEES_PAR_LES_VACANCES)
    .not('date_debut_formule', 'is', null)
    .not('date_expiration', 'is', null)
    .lte('date_debut_formule', fin)
    .gte('date_expiration', debut);

  for (const p of profilsActifs ?? []) {
    const jours = joursVacancesDansPeriode(p.date_debut_formule, p.date_expiration, [{ date_debut: debut, date_fin: fin }]);
    if (jours > 0) {
      await admin.from('profiles')
        .update({ date_expiration: ajouterJours(p.date_expiration, jours) })
        .eq('id', p.id);
    }
  }

  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Période de vacances ajoutée.');
}

export async function supprimerVacances(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const id = formData.get('id') as string;

  const { error } = await admin.from('vacances').delete().eq('id', id);
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Période de vacances supprimée.');
}

// --- Élèves & paiements -------------------------------------------------

// Crée directement le compte d'un élève à partir de son email — utile
// quand quelqu'un paye en présentiel (liquide, virement) et n'a jamais mis
// les pieds sur le site : ça permet de lui attribuer une formule tout de
// suite, sans attendre qu'il/elle se connecte une première fois. Le compte
// est créé côté auth (le trigger 'on_auth_user_created' génère
// automatiquement la ligne profiles correspondante) ; l'élève pourra se
// connecter plus tard avec cette même adresse via le lien magique habituel,
// aucun mot de passe à définir.
export async function creerEleve(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const nom = (formData.get('nom') as string)?.trim();
  if (!email) echouer('/admin/eleves', 'Renseigne une adresse email.');

  const { data: creation, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // pas d'email de vérification à envoyer, le compte est actif tout de suite
  });

  if (error) {
    // Compte déjà existant : pas une vraie erreur, l'élève apparaît déjà
    // dans la liste plus bas — on redirige simplement sans planter.
    if (error.message?.toLowerCase().includes('already') || error.message?.toLowerCase().includes('existe')) {
      echouer('/admin/eleves', `${email} a déjà un compte — choisis-le directement dans "Attribuer une formule" ci-dessous.`);
    }
    echouer('/admin/eleves', error.message);
  }

  if (nom && creation.user) {
    await admin.from('profiles').update({ nom }).eq('id', creation.user.id);
  }

  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', `Compte créé pour ${email}.`);
}

// Réserve une séance datée pour le compte d'un élève, depuis l'admin —
// réutilise exactement le même RPC atomique que la réservation côté élève
// (reserver_creneau), donc les mêmes règles s'appliquent (quota, gel,
// expiration), à une exception près : l'admin peut réserver même à moins
// de 1h30 du début (ou après le début) via p_ignorer_delai, contrairement
// à un élève qui réserve lui-même (reserverCours n'active jamais ce
// contournement). Utile pour un élève qui arrive en dernière minute au
// studio, ou pour corriger un oubli après coup.
export async function reserverCoursPourEleve(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const eleveId = formData.get('eleve_id') as string;
  const seance = formData.get('seance') as string; // format "coursId::dateISO"
  if (!eleveId || !seance) echouer('/admin/planning', 'Choisis un élève et une séance.');
  const [coursId, dateSeance] = seance.split('::');

  const { data: resultat, error } = await admin.rpc('reserver_creneau', {
    p_eleve_id: eleveId,
    p_cours_id: coursId,
    p_date_seance: dateSeance,
    p_ignorer_delai: true,
  });
  if (error) echouer('/admin/planning', error.message);

  const messages: Record<string, string> = {
    pas_abonne: "Cet élève n'a pas de pass actif — attribue-lui une formule d'abord.",
    gele: 'Le pass de cet élève est actuellement gelé.',
    expire: 'Le pass de cet élève a expiré.',
    quota_epuise: 'Le quota de cet élève est épuisé.',
    deja_reserve: 'Cet élève a déjà réservé cette séance.',
  };
  if (resultat !== 'ok') echouer('/admin/planning', messages[resultat as string] ?? 'Réservation impossible.');

  // Même confirmation (email + push) que si l'élève avait réservé
  // lui-même, en respectant ses préférences de notification.
  const { data: cours } = await admin.from('cours').select('discipline, heure_debut, heure_fin, lieu').eq('id', coursId).single();
  const { data: profilEleve } = await admin.from('profiles').select('email, notif_email_confirmation').eq('id', eleveId).single();
  if (cours) {
    const dateAffichee = new Date(dateSeance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (profilEleve?.email && profilEleve.notif_email_confirmation !== false) {
      try {
        await envoyerEmail(
          profilEleve.email,
          `Réservation confirmée : ${cours.discipline} le ${dateAffichee}`,
          `<p>C'est confirmé !</p>
           <p>Tu es inscrit·e au cours de <strong>${cours.discipline}</strong>, le <strong>${dateAffichee}</strong>,
           de ${cours.heure_debut.slice(0, 5)} à ${cours.heure_fin.slice(0, 5)}${cours.lieu ? ` (${cours.lieu})` : ''}.</p>
           <p>À bientôt !</p>`
        );
      } catch {}
    }
    try {
      await envoyerPushAEleve(
        eleveId,
        'Réservation confirmée ✅',
        `${cours.discipline} le ${dateAffichee}, ${cours.heure_debut.slice(0, 5)}-${cours.heure_fin.slice(0, 5)}`,
        '/planning',
        'confirmation'
      );
    } catch {}
  }

  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  reussir('/admin/planning', 'Réservation effectuée, confirmation envoyée à l\'élève.');
}

// Permet à l'admin d'octroyer une formule à un élève sans passer par Stripe
// (offert gratuitement, payé en liquide/virement, geste commercial, etc.)
export async function attribuerFormule(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const eleveId = formData.get('eleve_id') as string;
  const formuleNom = formData.get('formule_nom') as string;
  const paye = formData.get('paye') === 'on';
  const montant = Number(formData.get('montant') ?? 0);
  const branche1 = (formData.get('branche_1') as string) || '';
  const branche2 = (formData.get('branche_2') as string) || '';

  if (!eleveId) echouer('/admin/eleves', 'Choisis un élève.');

  const formule = FORMULES[formuleNom];
  if (!formule) echouer('/admin/eleves', 'Formule inconnue.');

  if (formule.categorie === 'mentorat' && formuleNom.startsWith('mentorship_') && !branche1) {
    echouer('/admin/eleves', 'Choisis au moins une branche pour cette formule Mentorat.');
  }
  const branches = formule.categorie === 'mentorat' && branche1
    ? (branche2 ? `${branche1},${branche2}` : branche1)
    : null;

  const expiration = new Date();
  expiration.setMonth(expiration.getMonth() + formule.validiteMois);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  // Un élève ne peut avoir qu'un seul abonnement ACTIF par catégorie
  // (planning / coaching / mentorat) à la fois — mais peut très bien avoir
  // les trois en parallèle. Si un abonnement de cette catégorie précise est
  // déjà actif, on le désactive avant d'insérer le nouveau plutôt que
  // d'échouer sur la contrainte d'unicité.
  await admin.from('abonnements')
    .update({ abonnement_actif: false })
    .eq('eleve_id', eleveId)
    .eq('categorie', formule.categorie)
    .eq('abonnement_actif', true);

  const { error } = await admin.from('abonnements').insert({
    eleve_id: eleveId,
    categorie: formule.categorie,
    formule_nom: formuleNom,
    quota_total: formule.quota,
    quota_restant: formule.quota,
    date_debut_formule: aujourdhui,
    date_expiration: expiration.toISOString().slice(0, 10),
    abonnement_actif: true,
    origine: 'manuel',
    paye,
    branches,
  });
  if (error) echouer('/admin/eleves', error.message);

  // Historise le paiement (ou le don) pour que l'élève puisse générer sa facture
  const { error: errPaiement } = await admin.from('paiements').insert({
    eleve_id: eleveId,
    formule_nom: formuleNom,
    montant: paye ? montant : 0,
    origine: 'manuel',
    paye,
  });
  if (errPaiement) echouer('/admin/eleves', errPaiement.message);

  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Formule attribuée.');
}


// Corrige directement le nombre de séances/heures restantes (erreur, geste
// commercial, séance rattrapée...) — fonctionne aussi bien pour les cours
// collectifs que pour le coaching, puisque les deux utilisent quota_restant.
export async function decompterCoaching(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const quantite = Number(formData.get('quantite'));

  const { data: abo } = await admin.from('abonnements').select('quota_restant').eq('id', abonnementId).single();
  if (!abo || abo.quota_restant == null) echouer('/admin/eleves', 'Pas de quota à décompter pour cet abonnement.');
  if (abo.quota_restant < quantite) echouer('/admin/eleves', 'Quantité supérieure au quota restant.');

  const { error } = await admin.from('abonnements')
    .update({ quota_restant: abo.quota_restant - quantite })
    .eq('id', abonnementId);
  if (error) echouer('/admin/eleves', error.message);

  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Quota décompté.');
}

// Coupe l'accès d'un abonnement précis de façon définitive (résiliation,
// formule terminée) — ne touche pas aux autres abonnements de l'élève.
export async function suspendreAcces(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const { error } = await admin.from('abonnements').update({ abonnement_actif: false }).eq('id', abonnementId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Accès suspendu.');
}

// Corrige directement le nombre de séances/heures restantes (erreur, geste
// commercial, séance rattrapée...) — fonctionne aussi bien pour les cours
// collectifs que pour le coaching, puisque les deux utilisent quota_restant.
export async function modifierQuotaRestant(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const nouveauQuota = Number(formData.get('quota_restant'));
  const { error } = await admin.from('abonnements').update({ quota_restant: nouveauQuota }).eq('id', abonnementId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Quota mis à jour.');
}

// Corrige directement la date de validité d'un abonnement précis
export async function modifierExpiration(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const nouvelleDate = formData.get('date_expiration') as string;
  const { error } = await admin.from('abonnements').update({ date_expiration: nouvelleDate }).eq('id', abonnementId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Date d\'expiration mise à jour.');
}

// Gel temporaire (blessure, vacances...) : l'abonnement reste attribué mais
// devient inutilisable jusqu'au dégel. Les autres abonnements de l'élève
// (autres catégories) ne sont pas affectés.
export async function gelerPass(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const dateFinGelPrevue = (formData.get('date_fin_gel_prevue') as string) || null;
  const { error } = await admin.from('abonnements').update({
    gele: true,
    date_gel_debut: new Date().toISOString().slice(0, 10),
    // Optionnel : si une date de reprise est indiquée, le cron quotidien
    // dégèlera automatiquement le pass ce jour-là (voir
    // app/api/cron/rappels/route.ts) — sinon dégel manuel comme avant.
    date_fin_gel_prevue: dateFinGelPrevue,
  }).eq('id', abonnementId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Pass gelé.');
}

// Corrige/renseigne la date de reprise d'un abonnement déjà gelé, sans le
// re-geler (contrairement à gelerPass qui réinitialiserait date_gel_debut
// à aujourd'hui). Sert notamment pour les pass gelés importés de l'ancien
// site, sans date de reprise connue au moment de l'import : une fois cette
// date renseignée, l'élève peut réserver dès maintenant sur sa période de
// réactivation (voir reserver_creneau), sans attendre le dégel automatique.
export async function definirDateReprise(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const dateFinGelPrevue = (formData.get('date_fin_gel_prevue') as string) || null;
  const { error } = await admin.from('abonnements').update({
    date_fin_gel_prevue: dateFinGelPrevue,
  }).eq('id', abonnementId).eq('gele', true);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Date de reprise mise à jour.');
}

// Dégel : prolonge automatiquement la date de validité du nombre de jours
// pendant lesquels l'abonnement est resté gelé (comme sur le site actuel).
// Factorisée pour être réutilisée par le dégel manuel (bouton admin) et par
// le dégel automatique planifié (cron quotidien, voir api/cron/rappels).
// Cible un abonnement précis (abonnementId) plutôt qu'un élève : depuis la
// refonte multi-abonnements, un élève peut avoir plusieurs abonnements
// actifs (planning/coaching/mentorat), chacun se gèle/dégèle indépendamment.
export async function degelerAbonnement(abonnementId: string): Promise<{ ok: boolean; erreur?: string }> {
  const admin = supabaseAdmin();

  const { data: abo } = await admin.from('abonnements')
    .select('date_gel_debut, date_expiration')
    .eq('id', abonnementId)
    .single();
  if (!abo?.date_gel_debut) return { ok: false, erreur: "Cet abonnement n'est pas gelé." };

  const debutGel = new Date(abo.date_gel_debut);
  const joursGeles = Math.max(0, Math.round((Date.now() - debutGel.getTime()) / (1000 * 60 * 60 * 24)));

  const nouvelleExpiration = new Date(abo.date_expiration ?? new Date());
  nouvelleExpiration.setDate(nouvelleExpiration.getDate() + joursGeles);

  const { error } = await admin.from('abonnements').update({
    gele: false,
    date_gel_debut: null,
    date_fin_gel_prevue: null,
    date_expiration: nouvelleExpiration.toISOString().slice(0, 10),
  }).eq('id', abonnementId);

  return error ? { ok: false, erreur: error.message } : { ok: true };
}

export async function degelerPass(formData: FormData) {
  await verifierAdmin();
  const abonnementId = formData.get('abonnement_id') as string;
  const resultat = await degelerAbonnement(abonnementId);
  if (!resultat.ok) echouer('/admin/eleves', resultat.erreur ?? 'Erreur inconnue.');
  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Pass dégelé.');
}

// Rembourse un paiement passé par Stripe directement depuis l'admin
// (retrouve la session Stripe, crée un remboursement complet).
export async function rembourserPaiement(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const paiementId = formData.get('paiement_id') as string;

  const { data: paiement } = await admin.from('paiements').select('*').eq('id', paiementId).single();
  if (!paiement) echouer('/admin/eleves', 'Paiement introuvable.');
  if (paiement.rembourse) echouer('/admin/eleves', 'Déjà remboursé.');
  if (!paiement.stripe_session_id) {
    echouer('/admin/eleves', "Ce paiement n'est pas passé par Stripe (manuel/offert) — rien à rembourser automatiquement.");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(paiement.stripe_session_id);
    if (!session.payment_intent) echouer('/admin/eleves', 'Aucun paiement Stripe associé à cette session.');
    await stripe.refunds.create({ payment_intent: session.payment_intent as string });
  } catch (e: any) {
    echouer('/admin/eleves', 'Erreur Stripe : ' + e.message);
  }

  const { error } = await admin.from('paiements').update({ rembourse: true }).eq('id', paiementId);
  if (error) echouer('/admin/eleves', error.message);

  // Le remboursement n'annule pas automatiquement l'accès de l'élève tant
  // qu'on ne le fait pas explicitement ici : si l'abonnement actif de la
  // même catégorie correspond justement à la formule qu'on vient de
  // rembourser, on coupe cet abonnement précis (sans toucher aux autres
  // catégories que l'élève pourrait avoir en parallèle).
  const categorie = FORMULES[paiement.formule_nom]?.categorie;
  if (categorie) {
    await admin.from('abonnements')
      .update({ abonnement_actif: false })
      .eq('eleve_id', paiement.eleve_id)
      .eq('categorie', categorie)
      .eq('formule_nom', paiement.formule_nom)
      .eq('abonnement_actif', true);
  }

  revalidatePath('/admin/eleves');
  reussir('/admin/eleves', 'Paiement remboursé.');
}

// Permet à l'admin de retirer un élève d'un cours qu'il a réservé, y
// compris pour le jour même ou une date passée (contrairement à
// l'annulation élève, bloquée à moins de 1h30 du début). Recrédite le
// quota de son abonnement actif, exactement comme une annulation normale
// (même logique que annulerReservation côté élève).
export async function annulerReservationAdmin(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const eleveId = formData.get('eleve_id') as string;
  const coursId = formData.get('cours_id') as string;
  const dateSeance = formData.get('date_seance') as string;
  if (!eleveId || !coursId || !dateSeance) echouer('/admin/planning', 'Réservation introuvable.');

  const { data: reservation } = await admin
    .from('reservations')
    .select('id')
    .eq('eleve_id', eleveId)
    .eq('cours_id', coursId)
    .eq('date_seance', dateSeance)
    .eq('statut', 'confirmee')
    .maybeSingle();

  if (!reservation) echouer('/admin/planning', 'Réservation introuvable ou déjà annulée.');

  const { error } = await admin
    .from('reservations')
    .update({ statut: 'annulee' })
    .eq('id', reservation.id);
  if (error) echouer('/admin/planning', error.message);

  const { data: abo } = await admin
    .from('abonnements')
    .select('id, formule_nom, quota_restant')
    .eq('eleve_id', eleveId)
    .eq('categorie', 'planning')
    .eq('abonnement_actif', true)
    .maybeSingle();

  if (abo && abo.formule_nom !== 'illimite' && abo.quota_restant != null) {
    await admin
      .from('abonnements')
      .update({ quota_restant: abo.quota_restant + 1 })
      .eq('id', abo.id);
  }

  revalidatePath('/admin/planning');
  revalidatePath('/planning');
  revalidatePath('/profil');
  reussir('/admin/planning', 'Élève retiré du cours, formule recréditée.');
}

// --- Factures manuelles (prestations hors catalogue, ex. interventions à
// l'extérieur) ---

export async function creerFactureManuelle(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const nomClient = (formData.get('nom_client') as string)?.trim();
  const emailClient = ((formData.get('email_client') as string) || '').trim() || null;
  const telephoneClient = ((formData.get('telephone_client') as string) || '').trim() || null;
  const lignesJson = formData.get('lignes') as string;

  if (!nomClient) echouer('/admin/factures', 'Le nom du client est requis.');
  if (!emailClient && !telephoneClient) echouer('/admin/factures', 'Renseigne au moins un email ou un téléphone pour pouvoir envoyer la facture.');

  let lignes: { description: string; prixUnitaire: number; quantite: number }[];
  try {
    lignes = JSON.parse(lignesJson);
  } catch {
    echouer('/admin/factures', 'Lignes de facture invalides.');
    return;
  }
  lignes = lignes
    .filter((l) => l.description?.trim() && l.prixUnitaire > 0 && l.quantite > 0)
    .map((l) => ({ description: l.description.trim(), prixUnitaire: l.prixUnitaire, quantite: l.quantite }));
  if (lignes.length === 0) echouer('/admin/factures', 'Ajoute au moins une ligne de prestation avec un prix et une quantité.');

  const total = lignes.reduce((somme, l) => somme + l.prixUnitaire * l.quantite, 0);

  const { error } = await admin.from('factures_manuelles').insert({
    nom_client: nomClient,
    email_client: emailClient,
    telephone_client: telephoneClient,
    lignes,
    total,
  });
  if (error) echouer('/admin/factures', error.message);

  revalidatePath('/admin/factures');
  reussir('/admin/factures', 'Facture créée.');
}

export async function envoyerFactureEmail(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const factureId = formData.get('facture_id') as string;

  const { data: facture } = await admin.from('factures_manuelles').select('*').eq('id', factureId).single();
  if (!facture) echouer('/admin/factures', 'Facture introuvable.');
  if (!facture.email_client) echouer('/admin/factures', "Cette facture n'a pas d'email renseigné.");

  const lien = `${process.env.NEXT_PUBLIC_SITE_URL}/facture-externe/${facture.id}`;
  const lignesHtml = (facture.lignes as { description: string; prixUnitaire: number; quantite: number }[])
    .map((l) => `<li>${l.description}${l.quantite > 1 ? ` — ${l.quantite} × ${l.prixUnitaire.toFixed(2)} €` : ''} — ${(l.prixUnitaire * l.quantite).toFixed(2)} €</li>`)
    .join('');

  try {
    await envoyerEmail(
      facture.email_client,
      `Facture Movement Practice Bordeaux — ${facture.total.toFixed(2)} €`,
      `<p>Bonjour ${facture.nom_client},</p>
       <p>Voici la facture pour la prestation convenue :</p>
       <ul>${lignesHtml}</ul>
       <p><strong>Total : ${facture.total.toFixed(2)} €</strong></p>
       <p><a href="${lien}">Voir et imprimer la facture</a></p>
       <p>Merci !</p>`
    );
  } catch (e: any) {
    echouer('/admin/factures', `Échec de l'envoi de l'email : ${e.message ?? 'erreur inconnue'}`);
    return;
  }

  await admin.from('factures_manuelles').update({ envoyee_le: new Date().toISOString() }).eq('id', factureId);
  revalidatePath('/admin/factures');
  reussir('/admin/factures', 'Facture envoyée par email.');
}

// --- Défi du mois (partagé par tous les élèves ayant un abonnement actif,
// quel que soit le forfait — pas de version "difficile" réservée aux
// abonnés illimité, volontairement : la difficulté payée ne reflète pas le
// niveau physique de l'élève). L'envoi de la vidéo se fait par WhatsApp
// comme d'habitude, l'app se contente d'afficher le défi en cours.

export async function creerDefiMensuel(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const titre = (formData.get('titre') as string)?.trim();
  const questionNiveau = (formData.get('question_niveau') as string)?.trim();
  const descriptionFacile = (formData.get('description_facile') as string)?.trim();
  const descriptionMoyen = (formData.get('description_moyen') as string)?.trim();
  const descriptionDur = (formData.get('description_dur') as string)?.trim();
  const explication = (formData.get('explication') as string)?.trim() || null;
  const regressions = (formData.get('regressions') as string)?.trim() || null;

  if (!titre || !questionNiveau || !descriptionFacile || !descriptionMoyen || !descriptionDur) {
    echouer('/admin/defis', 'Titre, question et les 3 niveaux de description sont requis.');
  }

  const { error } = await admin.from('defis_mensuels').insert({
    titre,
    question_niveau: questionNiveau,
    description_facile: descriptionFacile,
    description_moyen: descriptionMoyen,
    description_dur: descriptionDur,
    explication,
    regressions,
    // Colonne historique conservée pour compatibilité, jamais réaffichée
    // depuis l'introduction des 3 niveaux.
    description: descriptionMoyen,
  });
  if (error) echouer('/admin/defis', error.message);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  revalidatePath('/profil');
  reussir('/admin/defis', 'Nouveau défi publié — visible immédiatement sur le site.');
}

export async function supprimerDefiMensuel(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const defiId = formData.get('defi_id') as string;

  // Supprime aussi automatiquement toutes les participations liées (dont
  // les étoiles déjà gagnées sur ce défi précis) via la contrainte "on
  // delete cascade" — c'est volontaire, mais il faut que l'admin en soit
  // conscient (message clair côté interface avant le clic).
  const { error } = await admin.from('defis_mensuels').delete().eq('id', defiId);
  if (error) echouer('/admin/defis', error.message);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  revalidatePath('/profil');
  reussir('/admin/defis', 'Défi supprimé (et les étoiles gagnées dessus avec lui).');
}

// Corrige un défi déjà publié SANS en recréer un nouveau — important pour
// ne pas perdre les participations déjà en cours (niveaux choisis, étoiles
// déjà validées) : elles restent attachées au même defi_id.
export async function modifierDefiMensuel(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const defiId = formData.get('defi_id') as string;
  const titre = (formData.get('titre') as string)?.trim();
  const questionNiveau = (formData.get('question_niveau') as string)?.trim();
  const descriptionFacile = (formData.get('description_facile') as string)?.trim();
  const descriptionMoyen = (formData.get('description_moyen') as string)?.trim();
  const descriptionDur = (formData.get('description_dur') as string)?.trim();
  const explication = (formData.get('explication') as string)?.trim() || null;
  const regressions = (formData.get('regressions') as string)?.trim() || null;

  if (!titre || !questionNiveau || !descriptionFacile || !descriptionMoyen || !descriptionDur) {
    echouer('/admin/defis', 'Titre, question et les 3 niveaux de description sont requis.');
  }

  const { error } = await admin.from('defis_mensuels').update({
    titre,
    question_niveau: questionNiveau,
    description_facile: descriptionFacile,
    description_moyen: descriptionMoyen,
    description_dur: descriptionDur,
    explication,
    regressions,
    description: descriptionMoyen,
  }).eq('id', defiId);
  if (error) echouer('/admin/defis', error.message);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  revalidatePath('/profil');
  reussir('/admin/defis', 'Défi modifié — les participations déjà en cours sont conservées.');
}

// Valide la participation d'un élève à un défi (après vérification de la
// vidéo reçue par WhatsApp) : lui attribue son étoile, de la couleur
// correspondant au niveau qu'il avait choisi.
export async function validerParticipationDefi(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const participationId = formData.get('participation_id') as string;

  const { data: participation, error } = await admin
    .from('defi_participations')
    .update({ valide: true, valide_le: new Date().toISOString(), tentative_superieure: null })
    .eq('id', participationId)
    .select('eleve_id, niveau, defi_id, defis_mensuels(titre)')
    .single();
  if (error) echouer('/admin/defis', error.message);

  await notifierValidationDefi(participation);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  reussir('/admin/defis', 'Participation validée — étoile attribuée, élève prévenu.');
}

// Prévient l'élève par email + push qu'il vient de gagner son étoile, et
// l'invite à tenter le niveau supérieur s'il n'est pas déjà au maximum
// (sans qu'il perde l'étoile déjà acquise en attendant, voir
// tenterNiveauSuperieur côté élève).
async function notifierValidationDefi(participation: any) {
  if (!participation) return;
  const admin = supabaseAdmin();
  const { data: profil } = await admin.from('profiles').select('email, nom').eq('id', participation.eleve_id).single();
  if (!profil?.email) return;

  const LABEL: Record<string, string> = { facile: 'Bronze 🥉', moyen: 'Argent 🥈', dur: 'Or 🥇' };
  const titre = participation.defis_mensuels?.titre ?? 'le défi';
  const peutTenterPlus = participation.niveau !== 'dur';

  try {
    await envoyerEmail(
      profil.email,
      `🏆 Défi validé : ${LABEL[participation.niveau]}`,
      `<p>Bravo ${profil.nom ?? ''} !</p>
       <p>Ton défi "${titre}" est validé au niveau <strong>${LABEL[participation.niveau]}</strong> — ton étoile est ajoutée au classement.</p>
       ${peutTenterPlus
         ? `<p>Envie d'aller plus loin ? Tu peux tenter le niveau supérieur quand tu veux, sans perdre l'étoile que tu viens de gagner en attendant. Rendez-vous sur ta page <a href="${process.env.NEXT_PUBLIC_SITE_URL}/defi">Défi du mois</a>.</p>`
         : ''}`
    );
  } catch {
    // Non bloquant : l'étoile est déjà attribuée, un email qui ne part pas
    // ne doit pas remettre ça en cause.
  }

  await envoyerPushAEleve(
    participation.eleve_id,
    '🏆 Défi validé !',
    `Niveau ${LABEL[participation.niveau]} ajouté à ton classement.`,
    '/defi'
  );
}

// Annule une validation faite par erreur (retire l'étoile correspondante).
export async function invaliderParticipationDefi(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const participationId = formData.get('participation_id') as string;

  const { error } = await admin
    .from('defi_participations')
    .update({ valide: false, valide_le: null })
    .eq('id', participationId);
  if (error) echouer('/admin/defis', error.message);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  reussir('/admin/defis', 'Validation annulée.');
}

// Surclasse le niveau d'une participation déjà validée (ex. l'élève avait
// été validé en bronze, mais a depuis réussi la version or du même défi) :
// l'étoile affichée dans le classement passe automatiquement à la couleur
// du nouveau niveau, sans repasser par "en attente de validation".
export async function surclasserNiveauParticipation(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const participationId = formData.get('participation_id') as string;
  const nouveauNiveau = formData.get('niveau') as string;
  if (!['facile', 'moyen', 'dur'].includes(nouveauNiveau)) echouer('/admin/defis', 'Niveau invalide.');

  const { data: participation, error } = await admin
    .from('defi_participations')
    .update({ niveau: nouveauNiveau, tentative_superieure: null })
    .eq('id', participationId)
    .select('eleve_id, niveau, defi_id, defis_mensuels(titre)')
    .single();
  if (error) echouer('/admin/defis', error.message);

  await notifierValidationDefi(participation);

  revalidatePath('/admin/defis');
  revalidatePath('/defi');
  reussir('/admin/defis', 'Niveau mis à jour — étoile surclassée, élève prévenu.');
}
