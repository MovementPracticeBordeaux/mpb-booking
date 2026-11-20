// Un input HTML datetime-local ("2026-09-26T14:00") ne porte aucune
// information de fuseau horaire : le navigateur envoie l'heure telle que
// tapée, sans plus de contexte. Comme le serveur (Vercel) tourne en UTC,
// stocker cette chaîne telle quelle dans une colonne timestamptz la ferait
// interpréter comme 14h UTC — soit 16h à Bordeaux en été (CEST, UTC+2),
// un décalage de 2h bien réel sur l'horaire affiché aux visiteurs.
//
// Ces deux fonctions convertissent explicitement en tenant compte du
// changement heure d'été/hiver (déterminé dynamiquement via Intl, pas une
// valeur fixe qui se tromperait à la moitié de l'année).

const FUSEAU = 'Europe/Paris';

function decoupePartiesDate(date: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  // Intl peut renvoyer "24" pour minuit selon l'environnement : on ramène à 0.
  const heure = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  return { annee: Number(parts.year), mois: Number(parts.month), jour: Number(parts.day), heure, minute: Number(parts.minute) };
}

// "2026-09-26T14:00" (heure de Paris, saisie dans le formulaire admin) ->
// ISO UTC correct à stocker en base.
export function parisVersUTC(datetimeLocal: string): string {
  const [datePart, heurePart] = datetimeLocal.split('T');
  const [annee, mois, jour] = datePart.split('-').map(Number);
  const [heure, minute] = heurePart.split(':').map(Number);

  // Estimation initiale : et si cette heure était déjà de l'UTC ? Ça donne
  // un instant de référence assez proche pour déterminer le VRAI décalage
  // de Paris à ce moment précis (été ou hiver).
  const estimationUTC = Date.UTC(annee, mois - 1, jour, heure, minute);
  const vuDeParis = decoupePartiesDate(new Date(estimationUTC));
  const commeParisMs = Date.UTC(vuDeParis.annee, vuDeParis.mois - 1, vuDeParis.jour, vuDeParis.heure, vuDeParis.minute);
  const decalageMs = commeParisMs - estimationUTC;

  return new Date(estimationUTC - decalageMs).toISOString();
}

// ISO UTC (stocké en base) -> "2026-09-26T14:00" (heure de Paris, pour
// pré-remplir un input datetime-local dans le formulaire de modification).
export function utcVersParisInput(iso: string): string {
  const { annee, mois, jour, heure, minute } = decoupePartiesDate(new Date(iso));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${annee}-${p(mois)}-${p(jour)}T${p(heure)}:${p(minute)}`;
}

// --- Dates "calendrier" à l'heure de Paris -------------------------------
// Le serveur tourne en UTC : entre minuit et 1h (2h en été) à Paris,
// new Date().toISOString() donne encore la date de la veille. Toute notion
// de "aujourd'hui", "demain", "dans un mois" passe donc par ces fonctions.

// Date du jour à Paris, "YYYY-MM-DD".
export function aujourdhuiParis(maintenant: Date = new Date()): string {
  return maintenant.toLocaleDateString('sv-SE', { timeZone: FUSEAU });
}

// "YYYY-MM-DD" -> Date à midi UTC ce jour-là : jour de la semaine
// (getUTCDay) et calculs de dates sans aucun effet de fuseau.
export function midiUTC(dateISO: string): Date {
  return new Date(dateISO + 'T12:00:00Z');
}

export function ajouterJoursISO(dateISO: string, jours: number): string {
  const d = midiUTC(dateISO);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function ajouterMoisISO(dateISO: string, mois: number): string {
  const d = midiUTC(dateISO);
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString().slice(0, 10);
}

// Nombre de jours entre deux dates "YYYY-MM-DD" (b - a).
export function joursEntre(a: string, b: string): number {
  return Math.round((midiUTC(b).getTime() - midiUTC(a).getTime()) / 86400000);
}

// Année à Paris d'un instant (numéros de facture).
export function anneeParis(instant: string | Date): number {
  return Number(new Date(instant).toLocaleDateString('sv-SE', { timeZone: FUSEAU }).slice(0, 4));
}
