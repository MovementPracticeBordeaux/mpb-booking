import { calculerSemaine } from '@/lib/semaine';

// Facture mensuelle automatique d'Anne Laudoyer (Le Bivouac) : un cours
// de handstand du mardi soir = 20 €. Le 1er de chaque mois, on compte les
// séances du mardi soir qui ont eu lieu le mois précédent : tout cours resté
// au planning (pas en vacances, pas annulé ponctuellement) est considéré
// comme donné.
export const CLIENT_FACTURE_MENSUELLE = {
  nom: 'Anne Laudoyer',
  email: 'anne.laudoyer@bivouac-darwin.camp',
  telephone: '+33 6 33 19 48 34',
  description: 'Cours de handstand',
  prixUnitaire: 20,
  jourSemaine: 2, // mardi
  heureMinimum: '18:00', // "mardi soir"
};

export type CoursRecurrent = { id: string; jour_semaine: number; semaine: string; heure_debut: string; actif: boolean };
export type Periode = { date_debut: string; date_fin: string };

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// "2026-10" -> "octobre 2026"
export function libelleMois(mois: string): string {
  const [a, m] = mois.split('-').map(Number);
  return `${MOIS[m - 1]} ${a}`;
}

// Mois précédent (YYYY-MM) par rapport à une date YYYY-MM-DD.
export function moisPrecedent(aujourdhuiISO: string): string {
  const [a, m] = aujourdhuiISO.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

// Dates (YYYY-MM-DD) des séances du mardi soir réellement tenues dans le mois.
export function seancesTenuesDuMois(params: {
  mois: string; // YYYY-MM
  cours: CoursRecurrent[];
  lundiReference: string;
  semaineCeLundi: 'A' | 'B';
  vacances: Periode[];
  annulations: { cours_id: string; date_seance: string }[];
  jourSemaine?: number;
  heureMinimum?: string;
}): string[] {
  const jour = params.jourSemaine ?? CLIENT_FACTURE_MENSUELLE.jourSemaine;
  const heureMin = params.heureMinimum ?? CLIENT_FACTURE_MENSUELLE.heureMinimum;
  const [a, m] = params.mois.split('-').map(Number);
  const nbJours = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const lundiRef = new Date(params.lundiReference + 'T12:00:00Z');
  const annulees = new Set(params.annulations.map((x) => `${x.cours_id}::${x.date_seance}`));
  const resultat: string[] = [];

  for (let j = 1; j <= nbJours; j++) {
    const dateISO = `${params.mois}-${String(j).padStart(2, '0')}`;
    const d = new Date(dateISO + 'T12:00:00Z');
    if (d.getUTCDay() !== jour) continue;
    if (params.vacances.some((v) => dateISO >= v.date_debut && dateISO <= v.date_fin)) continue;
    const semaine = calculerSemaine(d, lundiRef, params.semaineCeLundi);
    const tenu = params.cours.some(
      (c) => c.actif && c.jour_semaine === jour && c.semaine === semaine
        && c.heure_debut.slice(0, 5) >= heureMin && !annulees.has(`${c.id}::${dateISO}`)
    );
    if (tenu) resultat.push(dateISO);
  }
  return resultat;
}
