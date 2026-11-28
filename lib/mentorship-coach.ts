// « Le mot du coach » : quelques phrases construites à partir des données de
// l'élève (retours de Sylvain, QCM, suivi chiffré, régularité, bilan
// d'entrée), affichées en haut du tableau de bord. Rédaction de Claude :
// visibles par les élèves seulement une fois validées par Sylvain
// (MOTS_DU_COACH_VALIDES), en aperçu côté admin en attendant.
import type { BilanEntree, Qualite } from './mentorship-bilan-entree';

export const MOTS_DU_COACH_VALIDES = false;

export type PerfCoach = { cree_le: string; valeur: number | null; series: number | null; unite?: string | null };
export type MotCoach = { id: string; texte: string; poids: number };

export type DonneesCoach = {
  maintenant: Date;
  aRetravailler: { nom: string; commentaire: string | null }[];
  qcmEnAttente: string[]; // libellés des niveaux dont le QCM reste à réussir
  perfsParExercice: { nom: string; perfs: PerfCoach[] }[]; // perfs de la plus récente à la plus ancienne
  branchesOuvertes: { domaine: Qualite; label: string; dernierePerf: string | null }[]; // palier en cours
  seancesSemaine: number;
  derniereActivite: string | null;
  bilan: BilanEntree | null;
};

const JOUR = 86400000;
const jours = (de: string, a: Date) => Math.floor((a.getTime() - new Date(de).getTime()) / JOUR);

// Branche délaissée : la branche ouverte la moins récemment travaillée,
// si elle ne l'a pas été depuis au moins `seuil` jours alors que l'élève
// s'entraîne. Les points à améliorer du bilan passent devant à égalité.
export function brancheDelaissee(d: DonneesCoach, seuil = 8): { domaine: Qualite; label: string; jours: number | null } | null {
  if (d.branchesOuvertes.length < 2 || !d.derniereActivite || jours(d.derniereActivite, d.maintenant) > 7) return null;
  const faibles = new Set(d.bilan?.points_faibles ?? []);
  const candidates = d.branchesOuvertes
    .map((b) => ({ ...b, jours: b.dernierePerf ? jours(b.dernierePerf, d.maintenant) : null }))
    .filter((b) => b.domaine !== 'connexion' && (b.jours === null || b.jours >= seuil))
    .sort((a, b) => (b.jours ?? 999) - (a.jours ?? 999) || Number(faibles.has(b.domaine)) - Number(faibles.has(a.domaine)));
  const c = candidates[0];
  return c ? { domaine: c.domaine, label: c.label, jours: c.jours } : null;
}

// Stagnation : on ne conclut qu'avec assez de recul. Il faut au moins
// STAGNATION_MIN_SEANCES séances notées sur au moins STAGNATION_MIN_SEMAINES
// semaines ; le meilleur résultat de la seconde moitié ne dépasse pas celui
// de la première. (3 séances, c'était trop peu pour mesurer un progrès.)
export const STAGNATION_MIN_SEANCES = 6;
export const STAGNATION_MIN_SEMAINES = 4;
export function stagne(perfs: PerfCoach[], maintenant: Date): boolean {
  const unite = perfs[0]?.unite ?? null;
  const serie = perfs.filter((p) => (p.unite ?? null) === unite && typeof p.valeur === 'number');
  if (serie.length < STAGNATION_MIN_SEANCES) return false;
  const plusAncienne = serie[serie.length - 1].cree_le;
  if (jours(plusAncienne, new Date(serie[0].cree_le)) < STAGNATION_MIN_SEMAINES * 7) return false;
  if (jours(serie[0].cree_le, maintenant) > 14) return false; // exercice plus pratiqué : rien à dire
  const moitie = Math.floor(serie.length / 2);
  const recentes = serie.slice(0, moitie).map((p) => p.valeur as number);
  const anciennes = serie.slice(moitie).map((p) => p.valeur as number);
  return Math.max(...recentes) <= Math.max(...anciennes);
}

function valeurs(perfs: PerfCoach[]): number[] {
  const unite = perfs[0]?.unite ?? null;
  return perfs.filter((p) => (p.unite ?? null) === unite && typeof p.valeur === 'number').map((p) => p.valeur as number);
}

export function motsDuCoach(d: DonneesCoach): MotCoach[] {
  const mots: MotCoach[] = [];
  const absence = d.derniereActivite ? jours(d.derniereActivite, d.maintenant) : null;

  if (absence !== null && absence >= 10) {
    mots.push({ id: 'retour', poids: 100, texte: "Content de te revoir. Aujourd'hui, une séance courte suffit : l'essentiel, et c'est déjà gagné." });
  }
  const r = d.aRetravailler[0];
  if (r) {
    mots.push({ id: 'retravailler', poids: 90, texte: `Sylvain t'a demandé de retravailler « ${r.nom} »${r.commentaire ? ' : relis son conseil avant de commencer' : ''}. Commence ta séance par lui.` });
  }
  if (d.qcmEnAttente.length > 0) {
    mots.push({ id: 'qcm', poids: 80, texte: `Le QCM de ${d.qcmEnAttente[0]} t'attend dans l'onglet Théorie : c'est lui qui ouvre l'envoi de tes vidéos.` });
  }
  const delaissee = brancheDelaissee(d);
  if (delaissee) {
    mots.push({ id: 'delaissee', poids: 70, texte: delaissee.jours === null
      ? `Tu n'as pas encore travaillé la ${delaissee.label} de ce palier. Et si c'était ta priorité aujourd'hui ?`
      : `Ta ${delaissee.label} n'a pas été travaillée depuis ${delaissee.jours} jours. Et si c'était ta priorité aujourd'hui ?` });
  }
  for (const ex of d.perfsParExercice) {
    const v = valeurs(ex.perfs);
    if (v.length >= 3 && v[0] > Math.max(...v.slice(1)) && jours(ex.perfs[0].cree_le, d.maintenant) <= 3) {
      mots.push({ id: `record-${ex.nom}`, poids: 60, texte: `Nouveau record sur « ${ex.nom} ». Bien joué : c'est ta régularité qui paie.` });
      break;
    }
  }
  for (const ex of d.perfsParExercice) {
    if (stagne(ex.perfs, d.maintenant)) {
      mots.push({ id: `stagne-${ex.nom}`, poids: 50, texte: `Sur « ${ex.nom} », tu es sur un plateau depuis quelques semaines : ça arrive à tout le monde, c'est une étape normale de la progression. Les outils proposés sous l'exercice peuvent t'aider à passer ce cap.` });
      break;
    }
  }
  if (d.bilan?.blessures) {
    mots.push({ id: 'blessure', poids: 40, texte: "Tu as signalé une douleur ou une ancienne blessure : écoute ton corps, adapte ou laisse de côté un exercice qui la réveille, et signale-le à Sylvain." });
  }
  if (d.seancesSemaine >= 3) {
    mots.push({ id: 'rythme', poids: 30, texte: `${d.seancesSemaine} séances cette semaine : tu es dans le rythme. Pense aussi à récupérer.` });
  }
  return mots.sort((a, b) => b.poids - a.poids).slice(0, 2);
}
