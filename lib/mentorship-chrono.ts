// Lecture de l'objectif chiffré d'un exercice (texte du critère de validation)
// pour régler le chrono : nombre de séries, durée d'une tenue, récupération.
// Rien n'est inventé : ce qui n'est pas écrit dans le critère reste absent,
// et le chrono retombe alors sur ses réglages par défaut, modifiables.

export type ObjectifChiffre = {
  series: number | null; // nombre de séries / tenues / sets demandés
  effortSec: number | null; // durée d'une tenue ou d'un temps de travail
  recupSec: number | null; // récupération imposée entre les séries
  recupLibre: boolean; // "récupération à la demande"
};

// (?![a-zà-ÿ]) plutôt que \b : en JavaScript, \b voit une fin de mot avant « é »
// et lirait « 3 séries » comme « 3 s ».
const DUREE = /(\d+)\s*(secondes?|sec|minutes?|min|s)(?![a-zà-ÿ])/g;

function enSecondes(n: number, unite: string): number {
  return /^(m)/.test(unite) ? n * 60 : n;
}

export function lireObjectif(critere?: string | null): ObjectifChiffre {
  const c = (critere ?? '').toLowerCase().replace(/ /g, ' ');
  const vide: ObjectifChiffre = { series: null, effortSec: null, recupSec: null, recupLibre: false };
  if (!c) return vide;

  const recupLibre = /récupération (à la demande|autorisée)/.test(c);

  let recupSec: number | null = null;
  const r = c.match(/(\d+)\s*(minutes?|min|secondes?|s)\s*de récupération/);
  if (r) recupSec = enSecondes(parseInt(r[1], 10), r[2]);

  let series: number | null = null;
  const s = c.match(/(\d+)\s*(?:à\s*\d+\s*)?(?:séries?|tenues?|sets?)\b/) ?? c.match(/(\d+)\s*x\s*\d+/);
  if (s) series = parseInt(s[1], 10);

  // Durée de l'effort : la première durée du texte qui n'est pas la récupération.
  let effortSec: number | null = null;
  for (const m of c.matchAll(DUREE)) {
    const suite = c.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 20);
    if (/^\s*de récupération/.test(suite)) continue;
    effortSec = enSecondes(parseInt(m[1], 10), m[2]);
    break;
  }

  return { series, effortSec, recupSec, recupLibre };
}

export function formaterChrono(totalSec: number): string {
  const t = Math.max(0, Math.round(totalSec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
