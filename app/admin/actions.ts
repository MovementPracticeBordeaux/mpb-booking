'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

async function verifierAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') throw new Error('Accès refusé');
  return user;
}

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
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function desactiverCours(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const id = formData.get('id') as string;
  const { error } = await admin.from('cours').update({ actif: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function definirSemaineReference(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const { error } = await admin.from('semaine_reference').upsert({
    id: 1,
    date_lundi_reference: formData.get('date_lundi_reference') as string,
    semaine_ce_lundi: formData.get('semaine_ce_lundi') as string,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

import { FORMULES } from '@/lib/formules';

// Permet à l'admin d'octroyer une formule à un élève sans passer par Stripe
// (offert gratuitement, payé en liquide/virement, geste commercial, etc.)
export async function attribuerFormule(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();

  const eleveId = formData.get('eleve_id') as string;
  const formuleNom = formData.get('formule_nom') as string;
  const paye = formData.get('paye') === 'on';
  const montant = Number(formData.get('montant') ?? 0);

  const formule = FORMULES[formuleNom];
  if (!formule) throw new Error('Formule inconnue');

  const expiration = new Date();
  expiration.setMonth(expiration.getMonth() + formule.validiteMois);

  const { error } = await admin.from('profiles').update({
    formule_nom: formuleNom,
    quota_total: formule.quota,
    quota_restant: formule.quota,
    date_expiration: expiration.toISOString().slice(0, 10),
    abonnement_actif: true,
    origine: 'manuel',
    paye,
  }).eq('id', eleveId);
  if (error) throw new Error(error.message);

  // Historise le paiement (ou le don) pour que l'élève puisse générer sa facture
  await admin.from('paiements').insert({
    eleve_id: eleveId,
    formule_nom: formuleNom,
    montant: paye ? montant : 0,
    origine: 'manuel',
    paye,
  });

  revalidatePath('/admin');
}

// Coaching/mentorship n'a pas de réservation de créneau automatique : quand
// une séance de coaching a lieu, l'admin décompte lui-même le nombre
// d'heures (ou l'unité) consommées sur le pass de l'élève.
export async function decompterCoaching(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const quantite = Number(formData.get('quantite'));

  const { data: profil } = await admin.from('profiles').select('quota_restant').eq('id', eleveId).single();
  if (!profil || profil.quota_restant == null) throw new Error('Pas de quota à décompter pour cet élève.');
  if (profil.quota_restant < quantite) throw new Error('Quantité supérieure au quota restant.');

  const { error } = await admin.from('profiles')
    .update({ quota_restant: profil.quota_restant - quantite })
    .eq('id', eleveId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}

// Coupe l'accès d'un élève de façon définitive (résiliation, formule terminée)
export async function suspendreAcces(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const { error } = await admin.from('profiles').update({ abonnement_actif: false }).eq('id', eleveId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
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
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

// Corrige directement la date de validité du pass
export async function modifierExpiration(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const nouvelleDate = formData.get('date_expiration') as string;
  const { error } = await admin.from('profiles').update({ date_expiration: nouvelleDate }).eq('id', eleveId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

// Gel temporaire (blessure, vacances...) : le pass reste attribué mais
// devient inutilisable jusqu'au dégel.
export async function gelerPass(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;
  const { error } = await admin.from('profiles').update({
    gele: true,
    date_gel_debut: new Date().toISOString().slice(0, 10),
  }).eq('id', eleveId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

// Dégel : prolonge automatiquement la date de validité du nombre de jours
// pendant lesquels le pass est resté gelé (comme sur le site actuel).
export async function degelerPass(formData: FormData) {
  await verifierAdmin();
  const admin = supabaseAdmin();
  const eleveId = formData.get('eleve_id') as string;

  const { data: profil } = await admin.from('profiles')
    .select('date_gel_debut, date_expiration')
    .eq('id', eleveId)
    .single();
  if (!profil?.date_gel_debut) throw new Error("Ce pass n'est pas gelé.");

  const debutGel = new Date(profil.date_gel_debut);
  const joursGeles = Math.max(0, Math.round((Date.now() - debutGel.getTime()) / (1000 * 60 * 60 * 24)));

  const nouvelleExpiration = new Date(profil.date_expiration ?? new Date());
  nouvelleExpiration.setDate(nouvelleExpiration.getDate() + joursGeles);

  const { error } = await admin.from('profiles').update({
    gele: false,
    date_gel_debut: null,
    date_expiration: nouvelleExpiration.toISOString().slice(0, 10),
  }).eq('id', eleveId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}
