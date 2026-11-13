'use server';

import { notifierVideoSoumise } from '@/lib/mentorship-notifs';
import { prochaineRevision, INTERVALLES_REVISION_JOURS } from '@/lib/mentorship-engagement';
import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { TOUS_LES_NOEUDS, estNoeudDeverrouille, estNoeudAcquisDepuisProgression, moduleIdExercice } from '@/lib/mentorship-modules';

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
  // Les niveaux à exercices sont acquis via leurs exercices (module_id
  // « niveau::exercice ») : on en déduit les niveaux acquis avant de
  // vérifier le déverrouillage, sinon le QCM du niveau suivant serait refusé.
  const idsModulesAcquis = new Set((acquisData ?? []).map((d) => d.module_id));
  const idsAcquis = new Set(
    TOUS_LES_NOEUDS.filter((n) => estNoeudAcquisDepuisProgression(n, (id) => idsModulesAcquis.has(id))).map((n) => n.id)
  );
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
    .select('statut, quiz_reussi, premiere_video_url')
    .eq('eleve_id', user.id)
    .eq('module_id', noeudId)
    .maybeSingle();

  const peutSoumettre = ligneActuelle?.quiz_reussi === true || ligneActuelle?.statut === 'refuse';
  if (!peutSoumettre) echouer('Réussis le QCM de ce niveau avant de soumettre ta vidéo.');

  const misAJour: Record<string, unknown> = { statut: 'en_attente', video_url: videoUrl, submitted_at: new Date().toISOString() };
  // On ne garde que la toute première vidéo jamais soumise sur ce module —
  // les resoumissions suivantes ne l'écrasent jamais, pour permettre une
  // comparaison avant/après dans la vue chemin.
  if (!ligneActuelle?.premiere_video_url) {
    misAJour.premiere_video_url = videoUrl;
    misAJour.premiere_video_date = new Date().toISOString();
  }

  const { error } = await supabase.from('mentorship_progression')
    .update(misAJour)
    .eq('eleve_id', user.id).eq('module_id', noeudId);

  if (error) echouer(error.message);
  await notifierVideoSoumise(user.id, noeudId);

  revalidatePath('/mentorship');
}

// Soumission vidéo pour un nœud à EXERCICES INDÉPENDANTS (modèle v4,
// branches). Contrairement à `soumettreVideo` (ancien modèle tronc), il n'y
// a pas de QCM à passer avant : chaque exercice (obligatoire ou progression
// bonus) se soumet dès que le nœud est déverrouillé. Ne rend jamais
// l'exercice "acquis" directement — ça reste soumis à la validation de
// Sylvain dans /admin/mentorship, exactement comme l'ancien modèle.
export async function soumettreVideoExercice(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const noeudId = formData.get('noeud_id') as string;
  const exerciceId = formData.get('exercice_id') as string;
  const videoUrl = (formData.get('video_url') as string)?.trim();
  if (!videoUrl) echouer('Merci de coller le lien de ta vidéo.');

  const noeud = TOUS_LES_NOEUDS.find((n) => n.id === noeudId);
  if (!noeud) echouer('Compétence introuvable.');
  const exercice = [...(noeud.exercices ?? []), ...(noeud.progressionBonus ?? [])].find((e) => e.id === exerciceId);
  if (!exercice) echouer('Exercice introuvable.');

  const { data: acquisData } = await supabase
    .from('mentorship_progression')
    .select('module_id')
    .eq('eleve_id', user.id)
    .eq('statut', 'acquis');
  const idsModulesAcquis = new Set((acquisData ?? []).map((d) => d.module_id));
  const estModuleAcquis = (id: string) => idsModulesAcquis.has(id);
  const idsNoeudsAcquis = new Set(
    TOUS_LES_NOEUDS.filter((n) => estNoeudAcquisDepuisProgression(n, estModuleAcquis)).map((n) => n.id)
  );
  if (!estNoeudDeverrouille(noeud, idsNoeudsAcquis)) echouer('Ce niveau est encore verrouillé.');

  // Le QCM du niveau est la porte d'entrée : tant qu'il n'est pas réussi,
  // aucune vidéo d'exercice (obligatoire ou bonus) ne peut être soumise.
  if (noeud.qcm.length > 0 && exercice.theme !== 'recuperation') {
    const { data: ligneNoeud } = await supabase
      .from('mentorship_progression')
      .select('quiz_reussi')
      .eq('eleve_id', user.id).eq('module_id', noeud.id)
      .maybeSingle();
    if (!ligneNoeud?.quiz_reussi) echouer('Réussis le QCM de ce niveau avant de soumettre tes vidéos.');
  }

  const moduleId = moduleIdExercice(noeud, exercice);

  const { data: ligneActuelle } = await supabase
    .from('mentorship_progression')
    .select('premiere_video_url')
    .eq('eleve_id', user.id)
    .eq('module_id', moduleId)
    .maybeSingle();

  const valeurs: Record<string, unknown> = { eleve_id: user.id, module_id: moduleId, statut: 'en_attente', video_url: videoUrl, submitted_at: new Date().toISOString() };
  if (!ligneActuelle?.premiere_video_url) {
    valeurs.premiere_video_url = videoUrl;
    valeurs.premiere_video_date = new Date().toISOString();
  }

  const { error } = await supabase.from('mentorship_progression')
    .upsert(valeurs, { onConflict: 'eleve_id,module_id' });
  if (error) echouer(error.message);
  await notifierVideoSoumise(user.id, moduleId);

  revalidatePath('/mentorship');
}

// Révision espacée : l'élève répond à une question d'un QCM qu'il a déjà
// réussi. La bonne réponse n'est révélée qu'ici, après sa réponse.
export async function repondreRevision(questionId: string, reponse: number): Promise<{ ok: boolean; juste: boolean; bonneReponse: number; prochaineDansJours: number }> {
  const echec = { ok: false, juste: false, bonneReponse: -1, prochaineDansJours: 0 };
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return echec;

  const noeud = TOUS_LES_NOEUDS.find((n) => n.qcm.some((q) => q.id === questionId));
  const question = noeud?.qcm.find((q) => q.id === questionId);
  if (!noeud || !question) return echec;

  const { data: ligneNoeud } = await supabase
    .from('mentorship_progression')
    .select('quiz_reussi')
    .eq('eleve_id', user.id).eq('module_id', noeud.id)
    .maybeSingle();
  if (!ligneNoeud?.quiz_reussi) return echec;

  const { data: existante } = await supabase
    .from('mentorship_revision')
    .select('boite, nb_justes, nb_reponses')
    .eq('eleve_id', user.id).eq('question_id', questionId)
    .maybeSingle();

  const juste = reponse === question.bonneReponse;
  const maintenant = new Date();
  const suite = prochaineRevision(existante ? existante.boite : null, juste, maintenant);
  const { error } = await supabase.from('mentorship_revision').upsert({
    eleve_id: user.id,
    question_id: questionId,
    boite: suite.boite,
    prochaine_le: suite.prochaine_le,
    derniere_le: maintenant.toISOString(),
    derniere_juste: juste,
    nb_justes: (existante?.nb_justes ?? 0) + (juste ? 1 : 0),
    nb_reponses: (existante?.nb_reponses ?? 0) + 1,
  }, { onConflict: 'eleve_id,question_id' });
  if (error) return echec;

  return { ok: true, juste, bonneReponse: question.bonneReponse, prochaineDansJours: INTERVALLES_REVISION_JOURS[suite.boite] };
}
