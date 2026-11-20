// Bilan d'un élève du Mentorat à partir de ses lignes de progression et de
// son suivi chiffré : étape en cours et activité sur une période. Sert à la
// vue d'ensemble du coach et au récap hebdomadaire envoyé à l'élève.
import { TRONC, BRANCHES, estNoeudAcquisDepuisProgression } from '@/lib/mentorship-modules';
import { parisVersUTC } from '@/lib/dates-paris';

export type LigneProgression = {
  module_id: string;
  statut: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};
export type LignePerf = { cree_le: string };

export function etapeEnCours(lignes: LigneProgression[]): string {
  const acquis = new Set(lignes.filter((l) => l.statut === 'acquis').map((l) => l.module_id));
  const estAcquis = (id: string) => acquis.has(id);
  for (const noeud of [...TRONC].sort((a, b) => a.niveau - b.niveau)) {
    if (!estNoeudAcquisDepuisProgression(noeud, estAcquis)) return `Armure Organique · niveau ${noeud.niveau}`;
  }
  for (const palier of [1, 2, 3]) {
    const noeuds = BRANCHES.filter((n) => n.niveau === palier);
    const faits = noeuds.filter((n) => estNoeudAcquisDepuisProgression(n, estAcquis)).length;
    if (faits < noeuds.length) return `Branches · palier ${palier} (${faits}/${noeuds.length} niveaux validés)`;
  }
  return 'Parcours terminé';
}

export type Bilan = {
  seances: number; // jours distincts avec au moins une perf notée
  perfsNotees: number;
  validees: string[]; // module_id validés sur la période
  aRetravailler: string[]; // retours « à retravailler » reçus sur la période, encore en l'état
  enAttente: string[]; // vidéos envoyées, pas encore regardées (toutes périodes)
  derniereActivite: string | null; // ISO, toutes périodes
};

export function bilanDepuis(lignes: LigneProgression[], perfs: LignePerf[], depuis: Date): Bilan {
  const apres = (iso?: string | null) => !!iso && new Date(iso) >= depuis;
  const recentes = perfs.filter((p) => apres(p.cree_le));
  const jours = new Set(recentes.map((p) => new Date(p.cree_le).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })));
  const dates = [
    ...perfs.map((p) => p.cree_le),
    ...lignes.map((l) => l.submitted_at ?? ''),
  ].filter(Boolean).sort();
  return {
    seances: jours.size,
    perfsNotees: recentes.length,
    validees: lignes.filter((l) => l.statut === 'acquis' && apres(l.reviewed_at)).map((l) => l.module_id),
    aRetravailler: lignes.filter((l) => l.statut === 'refuse' && apres(l.reviewed_at)).map((l) => l.module_id),
    enAttente: lignes.filter((l) => l.statut === 'en_attente').map((l) => l.module_id),
    derniereActivite: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

// Lundi 00:00 (heure de Paris) de la semaine de `maintenant`.
export function lundiDeLaSemaine(maintenant: Date): Date {
  const jour = maintenant.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const d = new Date(jour + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return new Date(parisVersUTC(`${d.toISOString().slice(0, 10)}T00:00`));
}
