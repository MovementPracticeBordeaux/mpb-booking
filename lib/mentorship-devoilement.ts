// Dévoilement progressif du Mentorat : on ne montre pas tout d'un coup pour
// éviter que l'élève soit noyé (retour de Louis, 28/11/2026). Les onglets et
// les cartes secondaires apparaissent au fil de ce qu'il a réellement fait.

export type OngletMentorat = 'arbre' | 'theorie' | 'seances' | 'journal' | 'outils' | 'validation' | 'progression';

export type Avancement = {
  qcmReussi: boolean; // au moins un QCM réussi (l'envoi de vidéos est ouvert)
  joursDePratique: number; // jours distincts avec au moins un exercice noté
  niveauxValides: number; // niveaux de l'arbre validés
};

export type Devoilement = { onglet: OngletMentorat; condition: (a: Avancement) => boolean; quand: string };

// Ordre d'apparition et condition de chaque onglet. « quand » est affiché au
// coach (aperçu admin) pour savoir ce que voit l'élève.
export const DEVOILEMENT: Devoilement[] = [
  { onglet: 'arbre', condition: () => true, quand: 'dès le début' },
  { onglet: 'theorie', condition: () => true, quand: 'dès le début' },
  { onglet: 'validation', condition: (a) => a.qcmReussi, quand: 'après son premier QCM réussi' },
  { onglet: 'journal', condition: (a) => a.joursDePratique >= 1, quand: 'après sa première séance notée' },
  { onglet: 'seances', condition: (a) => a.joursDePratique >= 3, quand: 'après 3 jours de pratique' },
  { onglet: 'outils', condition: (a) => a.niveauxValides >= 1, quand: 'après son premier niveau validé' },
];

export function ongletsVisibles(a: Avancement): Set<OngletMentorat> {
  return new Set([...DEVOILEMENT.filter((d) => d.condition(a)).map((d) => d.onglet), 'progression' as OngletMentorat]);
}

// Cartes « pour aller plus loin » du tableau de bord (idée du jour, révision,
// quête secondaire) : après le premier niveau validé.
export function aDecouvrirPlusLoin(a: Avancement): boolean {
  return a.niveauxValides >= 1;
}
