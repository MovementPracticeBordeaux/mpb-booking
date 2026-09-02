// PROTOTYPE VISUEL — pas branché en base, rien n'est sauvegardé (tout
// disparaît au rechargement). Objectif : montrer à Sylvain le concept d'un
// verrouillage global par niveau ("niveau 2 nulle part tant que niveau 1
// n'est pas validé PARTOUT") + les quêtes secondaires, sans toucher à
// l'arbre existant (/mentorship, ArbreCompetences, mentorship-modules.ts).
// Si le concept est validé, la suite est : vraies tables Supabase, vrai
// envoi de vidéo élève + validation admin (comme les branches aujourd'hui).
//
// Composant serveur (pas de 'use client' ici) : on reprend le contenu réel
// du v1 (BRANCHES) pour que Sylvain voie les vrais exercices à valider par
// niveau, mais on ne passe au client QUE des champs sûrs (titre/résumé/noms
// d'exercices) — jamais l'objet NoeudMentorship complet, pour rester dans
// la même discipline que noeudSansReponses() ailleurs dans le programme.

import { BRANCHES, ORDRE_DOMAINES, Domaine } from '@/lib/mentorship-modules';
import PiliersTestClient, { ContenuNiveau } from './PiliersTestClient';

export default function PiliersTestPage() {
  const contenu: Record<string, ContenuNiveau> = {};
  for (const noeud of BRANCHES) {
    contenu[`${noeud.domaine}-${noeud.niveau}`] = {
      titre: noeud.titre,
      resume: noeud.resume,
      aValider: (noeud.exercices ?? []).map((e) => ({ nom: e.nom, videoUrl: e.videoUrl || null, note: e.note ?? null })),
      bonus: (noeud.progressionBonus ?? []).map((e) => ({ nom: e.nom, videoUrl: e.videoUrl || null, note: e.note ?? null })),
    };
  }

  return <PiliersTestClient domaines={ORDRE_DOMAINES as Domaine[]} contenu={contenu} />;
}
