// Ce qui donne envie de revenir : révision espacée des QCM, série de
// semaines actives et badges. Fonctions pures, testées à part.

// --- Révision espacée -------------------------------------------------
// Une question réussie monte d'une « boîte » et revient plus tard ; une
// question ratée redescend à la première boîte et revient le lendemain.
export const INTERVALLES_REVISION_JOURS = [1, 3, 7, 14, 30] as const;

export type LigneRevision = { question_id: string; boite: number; prochaine_le: string; derniere_le: string };

export function jourISO(d: Date): string {
  // Jour civil à Paris, pour que « aujourd'hui » corresponde à celui de l'élève.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function prochaineRevision(boiteActuelle: number | null, juste: boolean, maintenant: Date): { boite: number; prochaine_le: string } {
  const boite = !juste ? 0 : boiteActuelle === null ? 1 : Math.min(INTERVALLES_REVISION_JOURS.length - 1, boiteActuelle + 1);
  const d = new Date(jourISO(maintenant) + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + INTERVALLES_REVISION_JOURS[boite]);
  return { boite, prochaine_le: d.toISOString().slice(0, 10) };
}

// Choisit la question du jour parmi les questions des QCM déjà réussis :
// rien si une révision a déjà été faite aujourd'hui ; sinon la question
// échue depuis le plus longtemps, ou à défaut une question jamais revue.
export function choisirQuestionDuJour(idsQuestions: string[], lignes: LigneRevision[], maintenant: Date): { questionId: string | null; faiteAujourdhui: boolean } {
  const aujourdhui = jourISO(maintenant);
  if (lignes.some((l) => jourISO(new Date(l.derniere_le)) === aujourdhui)) return { questionId: null, faiteAujourdhui: true };
  const disponibles = new Set(idsQuestions);
  const echues = lignes
    .filter((l) => disponibles.has(l.question_id) && l.prochaine_le <= aujourdhui)
    .sort((a, b) => a.prochaine_le.localeCompare(b.prochaine_le));
  if (echues.length > 0) return { questionId: echues[0].question_id, faiteAujourdhui: false };
  const vues = new Set(lignes.map((l) => l.question_id));
  const nouvelles = idsQuestions.filter((id) => !vues.has(id));
  if (nouvelles.length === 0) return { questionId: null, faiteAujourdhui: false };
  const index = Math.floor(maintenant.getTime() / 86400000) % nouvelles.length;
  return { questionId: nouvelles[index], faiteAujourdhui: false };
}

// --- Série de semaines actives ------------------------------------------
function lundi(d: Date): string {
  // Jour civil à Paris, puis recul jusqu'au lundi (calcul en UTC).
  const j = new Date(jourISO(d) + 'T12:00:00Z');
  j.setUTCDate(j.getUTCDate() - ((j.getUTCDay() + 6) % 7));
  return j.toISOString().slice(0, 10);
}

// Nombre de semaines consécutives avec au moins une activité. La série reste
// vivante tant que la semaine en cours OU la précédente est active (on ne la
// casse pas un lundi matin).
export function serieSemaines(datesActivite: string[], maintenant: Date): { semaines: number; activeCetteSemaine: boolean } {
  const semaines = new Set(datesActivite.map((d) => lundi(new Date(d))));
  const courant = new Date(maintenant);
  const activeCetteSemaine = semaines.has(lundi(courant));
  if (!activeCetteSemaine) courant.setDate(courant.getDate() - 7);
  let n = 0;
  while (semaines.has(lundi(courant))) {
    n += 1;
    courant.setDate(courant.getDate() - 7);
  }
  return { semaines: n, activeCetteSemaine };
}

// --- Badges ---------------------------------------------------------------
export type DonneesBadges = {
  nbPerfs: number;
  nbNotesJournal: number;
  nbExercicesValides: number;
  nbQuetesSecondairesValidees: number;
  armureComplete: boolean;
  paliersBranchesValides: number; // 0 à 3
  serieSemaines: number;
  nbRevisionsJustes: number;
};

export type Badge = { id: string; nom: string; description: string; obtenu: boolean };

export function calculerBadges(d: DonneesBadges): Badge[] {
  return [
    { id: 'premiere-perf', nom: 'Premier relevé', description: 'Noter une première perf dans « Mon suivi ».', obtenu: d.nbPerfs >= 1 },
    { id: 'premier-objectif', nom: 'Premier objectif', description: 'Faire valider un premier exercice en vidéo.', obtenu: d.nbExercicesValides >= 1 },
    { id: 'carnet', nom: 'Carnet tenu', description: 'Écrire 10 notes dans le journal.', obtenu: d.nbNotesJournal >= 10 },
    { id: 'regulier', nom: 'Régulier', description: '4 semaines actives d\'affilée.', obtenu: d.serieSemaines >= 4 },
    { id: 'tenace', nom: 'Tenace', description: '12 semaines actives d\'affilée.', obtenu: d.serieSemaines >= 12 },
    { id: 'memoire', nom: 'Mémoire vive', description: '10 révisions de théorie réussies.', obtenu: d.nbRevisionsJustes >= 10 },
    { id: 'quete', nom: 'Hors des sentiers', description: 'Valider une première quête secondaire.', obtenu: d.nbQuetesSecondairesValidees >= 1 },
    { id: 'armure', nom: 'Armure forgée', description: 'Valider l\'Armure Organique en entier.', obtenu: d.armureComplete },
    { id: 'palier-1', nom: 'Cinq branches', description: 'Valider le niveau 1 des cinq branches.', obtenu: d.paliersBranchesValides >= 1 },
    { id: 'palier-3', nom: 'Arbre complet', description: 'Valider le niveau 3 des cinq branches.', obtenu: d.paliersBranchesValides >= 3 },
  ];
}

// --- XP de présence ---------------------------------------------------------
// La présence et la régularité sont récompensées, pas seulement les
// validations : chaque jour où l'élève note au moins un exercice rapporte
// XP_PAR_SEANCE, dans la limite de SEANCES_RECOMPENSEES_PAR_SEMAINE jours par
// semaine (au-delà, on ne pousse pas à en faire plus : 3 à 5 séances suffisent).
export const XP_PAR_SEANCE = 10;
export const SEANCES_RECOMPENSEES_PAR_SEMAINE = 5;

function jourParis(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(iso));
}

export function xpPresence(datesPerfs: string[]): { total: number; parJour: { jour: string; xp: number }[] } {
  const jours = [...new Set(datesPerfs.map(jourParis))].sort();
  const parSemaine = new Map<string, number>();
  const parJour: { jour: string; xp: number }[] = [];
  for (const jour of jours) {
    const d = new Date(`${jour}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // lundi de la semaine
    const cle = d.toISOString().slice(0, 10);
    const deja = parSemaine.get(cle) ?? 0;
    if (deja >= SEANCES_RECOMPENSEES_PAR_SEMAINE) continue;
    parSemaine.set(cle, deja + 1);
    parJour.push({ jour, xp: XP_PAR_SEANCE });
  }
  return { total: parJour.length * XP_PAR_SEANCE, parJour };
}
