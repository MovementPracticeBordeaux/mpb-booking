'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FORMULES } from '@/lib/formules';
import { joursVacancesDansPeriode, ajouterJours } from '@/lib/vacances';
import { stripe } from '@/lib/stripe';

// Toute erreur dans une action admin redirige vers la page d'où elle vient
// (avec un message clair), au lieu de crasher (Next.js masque les throw en
// production) ou de renvoyer ailleurs dans l'admin.
function echouer(chemin: string, message: string): never {
  redirect(`${chemin}?erreur=${encodeURIComponent(message)}`);
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
}

export async function desactiverCours(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const id = formData.get('id') as string;
  const { error } = await admin.from('cours').update({ actif: false }).eq('id', id);
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
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
}

export async function supprimerVacances(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const id = formData.get('id') as string;

  const { error } = await admin.from('vacances').delete().eq('id', id);
  if (error) echouer('/admin/planning', error.message);
  revalidatePath('/admin/planning');
  revalidatePath('/planning');
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

  if (!eleveId) echouer('/admin/eleves', 'Choisis un élève.');

  const formule = FORMULES[formuleNom];
  if (!formule) echouer('/admin/eleves', 'Formule inconnue.');

  const expiration = new Date();
  expiration.setMonth(expiration.getMonth() + formule.validiteMois);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const { error } = await admin.from('profiles').update({
    formule_nom: formuleNom,
    quota_total: formule.quota,
    quota_restant: formule.quota,
    date_debut_formule: aujourdhui,
    date_expiration: expiration.toISOString().slice(0, 10),
    abonnement_actif: true,
    origine: 'manuel',
    paye,
  }).eq('id', eleveId);
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
}


// d'heures (ou l'unité) consommées sur le pass de l'élève.
export async function decompterCoaching(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const quantite = Number(formData.get('quantite'));

  const { data: profil } = await admin.from('profiles').select('quota_restant').eq('id', eleveId).single();
  if (!profil || profil.quota_restant == null) echouer('/admin/eleves', 'Pas de quota à décompter pour cet élève.');
  if (profil.quota_restant < quantite) echouer('/admin/eleves', 'Quantité supérieure au quota restant.');

  const { error } = await admin.from('profiles')
    .update({ quota_restant: profil.quota_restant - quantite })
    .eq('id', eleveId);
  if (error) echouer('/admin/eleves', error.message);

  revalidatePath('/admin/eleves');
}

// Coupe l'accès d'un élève de façon définitive (résiliation, formule terminée)
export async function suspendreAcces(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const { error } = await admin.from('profiles').update({ abonnement_actif: false }).eq('id', eleveId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
}

// Corrige directement le nombre de séances/heures restantes (erreur, geste
// commercial, séance rattrapée...) — fonctionne aussi bien pour les cours
// collectifs que pour le coaching, puisque les deux utilisent quota_restant.
export async function modifierQuotaRestant(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const nouveauQuota = Number(formData.get('quota_restant'));
  const { error } = await admin.from('profiles').update({ quota_restant: nouveauQuota }).eq('id', eleveId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
}

// Corrige directement la date de validité du pass
export async function modifierExpiration(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const nouvelleDate = formData.get('date_expiration') as string;
  const { error } = await admin.from('profiles').update({ date_expiration: nouvelleDate }).eq('id', eleveId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
}

// Gel temporaire (blessure, vacances...) : le pass reste attribué mais
// devient inutilisable jusqu'au dégel.
export async function gelerPass(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const dateFinGelPrevue = (formData.get('date_fin_gel_prevue') as string) || null;
  const { error } = await admin.from('profiles').update({
    gele: true,
    date_gel_debut: new Date().toISOString().slice(0, 10),
    // Optionnel : si une date de reprise est indiquée, le cron quotidien
    // dégèlera automatiquement le pass ce jour-là (voir
    // app/api/cron/rappels/route.ts) — sinon dégel manuel comme avant.
    date_fin_gel_prevue: dateFinGelPrevue,
  }).eq('id', eleveId);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
}

// Corrige/renseigne la date de reprise d'un pass déjà gelé, sans le
// re-geler (contrairement à gelerPass qui réinitialiserait date_gel_debut
// à aujourd'hui). Sert notamment pour les pass gelés importés de l'ancien
// site, sans date de reprise connue au moment de l'import : une fois cette
// date renseignée, l'élève peut réserver dès maintenant sur sa période de
// réactivation (voir reserver_creneau), sans attendre le dégel automatique.
export async function definirDateReprise(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const dateFinGelPrevue = (formData.get('date_fin_gel_prevue') as string) || null;
  const { error } = await admin.from('profiles').update({
    date_fin_gel_prevue: dateFinGelPrevue,
  }).eq('id', eleveId).eq('gele', true);
  if (error) echouer('/admin/eleves', error.message);
  revalidatePath('/admin/eleves');
}

// Dégel : prolonge automatiquement la date de validité du nombre de jours
// pendant lesquels le pass est resté gelé (comme sur le site actuel).
// Factorisée pour être réutilisée par le dégel manuel (bouton admin) et par
// le dégel automatique planifié (cron quotidien, voir api/cron/rappels).
export async function degelerProfil(eleveId: string): Promise<{ ok: boolean; erreur?: string }> {
  const admin = supabaseAdmin();

  const { data: profil } = await admin.from('profiles')
    .select('date_gel_debut, date_expiration')
    .eq('id', eleveId)
    .single();
  if (!profil?.date_gel_debut) return { ok: false, erreur: "Ce pass n'est pas gelé." };

  const debutGel = new Date(profil.date_gel_debut);
  const joursGeles = Math.max(0, Math.round((Date.now() - debutGel.getTime()) / (1000 * 60 * 60 * 24)));

  const nouvelleExpiration = new Date(profil.date_expiration ?? new Date());
  nouvelleExpiration.setDate(nouvelleExpiration.getDate() + joursGeles);

  const { error } = await admin.from('profiles').update({
    gele: false,
    date_gel_debut: null,
    date_fin_gel_prevue: null,
    date_expiration: nouvelleExpiration.toISOString().slice(0, 10),
  }).eq('id', eleveId);

  return error ? { ok: false, erreur: error.message } : { ok: true };
}

export async function degelerPass(formData: FormData) {
  await verifierAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const resultat = await degelerProfil(eleveId);
  if (!resultat.ok) echouer('/admin/eleves', resultat.erreur ?? 'Erreur inconnue.');
  revalidatePath('/admin/eleves');
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
  // qu'on ne le fait pas explicitement ici : si sa formule actuelle est
  // justement celle qu'on vient de rembourser, on coupe l'accès.
  const { data: profilEleve } = await admin
    .from('profiles')
    .select('formule_nom, abonnement_actif')
    .eq('id', paiement.eleve_id)
    .single();
  if (profilEleve?.abonnement_actif && profilEleve.formule_nom === paiement.formule_nom) {
    await admin.from('profiles').update({ abonnement_actif: false }).eq('id', paiement.eleve_id);
  }

  revalidatePath('/admin/eleves');
}
