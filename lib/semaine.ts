// Détermine si une date donnée tombe sur une "semaine A" ou "semaine B",
// à partir d'un lundi de référence connu et de la semaine qu'il représente.
export function calculerSemaine(
  date: Date,
  lundiReference: Date,
  semaineDeCeLundi: 'A' | 'B'
): 'A' | 'B' {
  const lundiDeLaDate = getLundiDeLaSemaine(date);
  const joursEcoules = Math.round(
    (lundiDeLaDate.getTime() - getLundiDeLaSemaine(lundiReference).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const semainesEcoulees = Math.round(joursEcoules / 7);
  const estMemeParite = semainesEcoulees % 2 === 0;
  if (estMemeParite) return semaineDeCeLundi;
  return semaineDeCeLundi === 'A' ? 'B' : 'A';
}

function getLundiDeLaSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay(); // 0 = dimanche
  const diff = jour === 0 ? -6 : 1 - jour; // recule jusqu'au lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
