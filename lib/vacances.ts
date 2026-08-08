// Calcule de combien de jours une formule doit être prolongée à cause d'une
// période de vacances qui tombe dedans (l'élève paie pour un mois de cours,
// pas pour un mois calendaire pendant lequel une partie est fermée).
//
// Exemple concret (celui donné par Louis) : un abonnement du 15 juillet au
// 15 août, avec des vacances du 1er au 15 août. Les 15 jours de vacances
// tombent entièrement dans la période de la formule (15 juil.-15 août) :
// la nouvelle date de fin devient le 30 août, et l'élève peut réserver un
// cours ce jour-là.

export type PeriodeDates = { date_debut: string; date_fin: string }; // YYYY-MM-DD

// Nombre de jours communs entre deux périodes [debut1, fin1] et
// [debut2, fin2], toutes deux inclusives. Retourne 0 si elles ne se
// chevauchent pas.
export function joursChevauchement(
  debut1: string, fin1: string,
  debut2: string, fin2: string
): number {
  const debutCommun = debut1 > debut2 ? debut1 : debut2;
  const finCommune = fin1 < fin2 ? fin1 : fin2;
  if (debutCommun > finCommune) return 0;

  const msParJour = 24 * 60 * 60 * 1000;
  const debutMs = new Date(debutCommun + 'T00:00:00').getTime();
  const finMs = new Date(finCommune + 'T00:00:00').getTime();
  return Math.round((finMs - debutMs) / msParJour) + 1; // +1 : bornes inclusives
}

// Additionne le chevauchement entre une période de formule et une liste de
// périodes de vacances (au cas où plusieurs périodes tombent dans la même
// formule).
export function joursVacancesDansPeriode(
  dateDebutFormule: string,
  dateFinFormule: string,
  periodesVacances: PeriodeDates[]
): number {
  return periodesVacances.reduce(
    (total, v) => total + joursChevauchement(dateDebutFormule, dateFinFormule, v.date_debut, v.date_fin),
    0
  );
}

// Ajoute un nombre de jours à une date (format YYYY-MM-DD), retourne le
// résultat au même format.
export function ajouterJours(dateISO: string, jours: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}
