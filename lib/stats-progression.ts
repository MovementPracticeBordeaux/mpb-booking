// Calcule les statistiques de l'onglet "Progression" à partir des
// historiques bruts des outils Force et Figures (+ du journal
// d'entraînement pour la régularité). Fonction pure, testable
// indépendamment de tout appel réseau.
//
// Note : l'outil Locomotion ne journalise aucune donnée structurée pour
// l'instant (juste un métronome/combinaisons, rien d'enregistré) — il
// n'apparaît donc pas dans ces statistiques.

export type EntreeForce = { exercice: string; reps_par_set: string; cree_le: string };
export type EntreeFigure = { figure: string; tentatives: string; cree_le: string };
export type EntreeJournal = { cree_le: string };

export type PointVolume = { periode: string; total: number };

export type StatsProgression = {
  joursActifs30j: number;
  volumeForceParSemaine: PointVolume[]; // reps totales, 8 dernières semaines
  volumeForceParMois: PointVolume[]; // reps totales, 6 derniers mois
  tempsFiguresParSemaineSec: PointVolume[]; // secondes de tenue cumulées, 8 dernières semaines
  tempsFiguresParMoisSec: PointVolume[]; // secondes de tenue cumulées, 6 derniers mois
  forcePointsForts: { nom: string; total: number }[]; // top 3 exercices par volume cumulé
  forcePointsFaibles: { nom: string; total: number }[]; // 3 exercices les moins pratiqués
  figuresMeilleures: { nom: string; meilleurTempsSec: number }[]; // top 3 par meilleure tenue
  figuresAAmeliorer: { nom: string; meilleurTempsSec: number }[]; // 3 moins avancées
};

function lundiDeLaSemaine(date: Date): string {
  const d = new Date(date);
  const jour = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - jour);
  return d.toISOString().slice(0, 10);
}

function sommeListe(champ: string): number {
  return champ
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n))
    .reduce((a, b) => a + b, 0);
}

function derniersN(map: Map<string, number>, n: number): PointVolume[] {
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-n)
    .map(([periode, total]) => ({ periode, total }));
}

export function calculerStatsProgression(
  force: EntreeForce[],
  figures: EntreeFigure[],
  journal: EntreeJournal[]
): StatsProgression {
  const il30j = new Date();
  il30j.setDate(il30j.getDate() - 30);

  const joursActifs = new Set<string>();
  const marquerJour = (dateISO: string) => {
    if (new Date(dateISO) >= il30j) joursActifs.add(dateISO.slice(0, 10));
  };
  force.forEach((e) => marquerJour(e.cree_le));
  figures.forEach((e) => marquerJour(e.cree_le));
  journal.forEach((e) => marquerJour(e.cree_le));

  const volSemaine = new Map<string, number>();
  const volMois = new Map<string, number>();
  const parExercice = new Map<string, number>();
  for (const e of force) {
    const total = sommeListe(e.reps_par_set);
    const d = new Date(e.cree_le);
    const semaine = lundiDeLaSemaine(d);
    volSemaine.set(semaine, (volSemaine.get(semaine) ?? 0) + total);
    const mois = e.cree_le.slice(0, 7);
    volMois.set(mois, (volMois.get(mois) ?? 0) + total);
    parExercice.set(e.exercice, (parExercice.get(e.exercice) ?? 0) + total);
  }

  const tempsSemaine = new Map<string, number>();
  const tempsMois = new Map<string, number>();
  const meilleurParFigure = new Map<string, number>();
  for (const e of figures) {
    const valeurs = e.tentatives.split(',').map(Number).filter((n) => !isNaN(n));
    const total = valeurs.reduce((a, b) => a + b, 0);
    const meilleur = valeurs.length ? Math.max(...valeurs) : 0;
    const d = new Date(e.cree_le);
    const semaine = lundiDeLaSemaine(d);
    tempsSemaine.set(semaine, (tempsSemaine.get(semaine) ?? 0) + total);
    const mois = e.cree_le.slice(0, 7);
    tempsMois.set(mois, (tempsMois.get(mois) ?? 0) + total);
    meilleurParFigure.set(e.figure, Math.max(meilleurParFigure.get(e.figure) ?? 0, meilleur));
  }

  const exercicesTries = [...parExercice.entries()].sort((a, b) => b[1] - a[1]);
  const figuresTries = [...meilleurParFigure.entries()].sort((a, b) => b[1] - a[1]);
  // En dessous de 6 exercices/figures pratiqués, "points forts" et
  // "points faibles" se chevaucheraient (même élément dans les deux
  // listes) — pas assez de variété pour que la distinction ait du sens.
  const assezDeVarieteExercices = exercicesTries.length >= 6;
  const assezDeVarieteFigures = figuresTries.length >= 6;

  return {
    joursActifs30j: joursActifs.size,
    volumeForceParSemaine: derniersN(volSemaine, 8),
    volumeForceParMois: derniersN(volMois, 6),
    tempsFiguresParSemaineSec: derniersN(tempsSemaine, 8),
    tempsFiguresParMoisSec: derniersN(tempsMois, 6),
    forcePointsForts: exercicesTries.slice(0, 3).map(([nom, total]) => ({ nom, total })),
    forcePointsFaibles: assezDeVarieteExercices
      ? exercicesTries.slice(-3).reverse().map(([nom, total]) => ({ nom, total }))
      : [],
    figuresMeilleures: figuresTries.slice(0, 3).map(([nom, meilleurTempsSec]) => ({ nom, meilleurTempsSec })),
    figuresAAmeliorer: assezDeVarieteFigures
      ? figuresTries.slice(-3).reverse().map(([nom, meilleurTempsSec]) => ({ nom, meilleurTempsSec }))
      : [],
  };
}
