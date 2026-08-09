'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { TOUS_LES_NOEUDS, estNoeudDeverrouille } from '@/lib/mentorship-modules';

function echouer(message: string): never {
  redirect(`/mentorship?erreur=${encodeURIComponent(message)}`);
}

const SEUIL_REUSSITE_QCM = 0.8; // 80% de bonnes réponses pour débloquer la vidéo

// Correction du QCM — se fait entièrement ici, côté serveur. Les bonnes
// réponses (`bonneReponse`) ne quittent jamais cette fonction : le
// composant client ne reçoit jamais que les questions sans réponse (voir
// noeudSansReponses() dans lib/mentorship-modules.ts).
//
// On n'écrit en base QUE si le QCM est réussi : un échec ne laisse aucune
// trace, l'élève peut retenter autant de fois qu'il veut sans qu'on ait à
// gérer un état "échoué" dans la table de progression.
export async function repondreQCM(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const noeudId = formData.get('noeud_id') as string;
  const noeud = TOUS_LES_NOEUDS.find((n) => n.id === noeudId);
  if (!noeud) echouer('Compétence introuvable.');
  if (noeud.qcm.length === 0) echouer('Pas de QCM pour ce niveau.');

  const { data: acquisData } = await supabase
    .from('mentorship_progression')
    .select('module_id')
    .eq('eleve_id', user.id)
    .eq('statut', 'acquis');
  const idsAcquis = new Set((acquisData ?? []).map((d) => d.module_id));
  if (!estNoeudDeverrouille(noeud, idsAcquis)) echouer('Ce niveau est encore verrouillé.');

  // Déjà réussi précédemment : rien à refaire, on renvoie directement vers
  // l'écran de soumission vidéo.
  const { data: ligneExistante } = await supabase
    .from('mentorship_progression')
    .select('quiz_reussi')
    .eq('eleve_id', user.id).eq('module_id', noeudId)
    .maybeSingle();
  if (ligneExistante?.quiz_reussi) {
    revalidatePath('/mentorship');
    return;
  }

  let bonnesReponses = 0;
  for (const question of noeud.qcm) {
    const reponseElve = Number(formData.get(`reponse-${question.id}`));
    if (reponseElve === question.bonneReponse) bonnesReponses += 1;
  }
  const score = Math.round((bonnesReponses / noeud.qcm.length) * 100);
  const reussi = bonnesReponses / noeud.qcm.length >= SEUIL_REUSSITE_QCM;

  if (!reussi) {
    redirect(`/mentorship?erreur=${encodeURIComponent(`QCM non validé (${score}%, il faut au moins 80%). Retente quand tu veux.`)}`);
  }

  const { error } = await supabase.from('mentorship_progression').insert({
    eleve_id: user.id,
    module_id: noeudId,
    quiz_reussi: true,
    quiz_score: score,
    quiz_valide_le: new Date().toISOString(),
  });
  if (error) echouer(error.message);

  revalidatePath('/mentorship');
}

// L'élève soumet le lien de sa vidéo — seulement possible après avoir
// réussi le QCM du niveau (ou en cas de re-soumission après un refus). Ne
// rend jamais le nœud "acquis" directement : ça reste soumis à la
// validation de Sylvain dans /admin/mentorship.
export async function soumettreVideo(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const noeudId = formData.get('noeud_id') as string;
  const videoUrl = (formData.get('video_url') as string)?.trim();
  if (!videoUrl) echouer('Merci de coller le lien de ta vidéo.');

  const { data: ligneActuelle } = await supabase
    .from('mentorship_progression')
    .select('statut, quiz_reussi')
    .eq('eleve_id', user.id)
    .eq('module_id', noeudId)
    .maybeSingle();

  const peutSoumettre = ligneActuelle?.quiz_reussi === true || ligneActuelle?.statut === 'refuse';
  if (!peutSoumettre) echouer('Réussis le QCM de ce niveau avant de soumettre ta vidéo.');

  const { error } = await supabase.from('mentorship_progression')
    .update({ statut: 'en_attente', video_url: videoUrl, submitted_at: new Date().toISOString() })
    .eq('eleve_id', user.id).eq('module_id', noeudId);

  if (error) echouer(error.message);

  revalidatePath('/mentorship');
}

// Cocher un défi quotidien = une petite pratique du jour (la programmation
// d'une compétence en cours), pour le petit bonus d'XP motivant. Ne fait
// PAS progresser la compétence elle-même (une seule fois par jour et par
// compétence, grâce à la contrainte unique(eleve_id, noeud_id, jour)).
export async function validerDefiQuotidien(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const noeudId = formData.get('noeud_id') as string;

  const { error } = await supabase.from('mentorship_defi_valide').insert({
    eleve_id: user.id,
    noeud_id: noeudId,
  });
  // Une contrainte "déjà fait aujourd'hui" (code 23505) n'est pas une
  // vraie erreur à afficher à l'élève — on l'ignore silencieusement.
  if (error && error.code !== '23505') echouer(error.message);

  revalidatePath('/mentorship');
}
