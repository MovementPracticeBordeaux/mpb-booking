import { describe, it, expect } from 'vitest';
import { motsDuCoach, brancheDelaissee, type DonneesCoach } from './mentorship-coach';

const maintenant = new Date('2026-11-28T10:00:00Z');
const base: DonneesCoach = {
  maintenant, aRetravailler: [], qcmEnAttente: [], perfsParExercice: [],
  branchesOuvertes: [], seancesSemaine: 0, derniereActivite: '2026-11-27T10:00:00Z', bilan: null,
};
const p = (jour: string, valeur: number) => ({ cree_le: `2026-11-${jour}T10:00:00Z`, valeur, series: 3, unite: 'reps' });

describe('motsDuCoach', () => {
  it('ne dit rien sans signal', () => {
    expect(motsDuCoach(base)).toEqual([]);
  });
  it('garde les deux messages les plus importants', () => {
    const m = motsDuCoach({ ...base, aRetravailler: [{ nom: 'Pont bas', commentaire: 'Ouvre les épaules' }], qcmEnAttente: ['Armure Organique niveau 2'], seancesSemaine: 3 });
    expect(m.map((x) => x.id)).toEqual(['retravailler', 'qcm']);
  });
  it('salue un retour après une longue absence', () => {
    expect(motsDuCoach({ ...base, derniereActivite: '2026-11-10T10:00:00Z' })[0].id).toBe('retour');
  });
  it('repère un record et une stagnation', () => {
    const record = motsDuCoach({ ...base, perfsParExercice: [{ nom: 'Dips', perfs: [p('27', 10), p('24', 8), p('20', 7)] }] });
    expect(record[0].id).toBe('record-Dips');
    // 3 séances : trop peu pour parler de stagnation.
    expect(motsDuCoach({ ...base, perfsParExercice: [{ nom: 'Dips', perfs: [p('27', 8), p('24', 8), p('20', 9)] }] })).toEqual([]);
    // 6 séances sur plus de 4 semaines, sans progrès : stagnation.
    const q = (date: string, valeur: number) => ({ cree_le: `${date}T10:00:00Z`, valeur, series: 3, unite: 'reps' });
    const longue = [q('2026-11-27', 8), q('2026-11-20', 9), q('2026-11-13', 8), q('2026-11-06', 9), q('2026-10-30', 8), q('2026-10-23', 7)];
    expect(motsDuCoach({ ...base, perfsParExercice: [{ nom: 'Dips', perfs: longue }] })[0].id).toBe('stagne-Dips');
    // Même durée, mais un progrès récent : pas de stagnation.
    const progres = [q('2026-11-27', 10), ...longue.slice(1)];
    expect(motsDuCoach({ ...base, perfsParExercice: [{ nom: 'Dips', perfs: progres }] }).map((m) => m.id)).not.toContain('stagne-Dips');
  });
});

describe('brancheDelaissee', () => {
  it('propose la branche la moins travaillée, hors Connexion', () => {
    const d: DonneesCoach = { ...base, branchesOuvertes: [
      { domaine: 'force', label: 'Force', dernierePerf: '2026-11-27T10:00:00Z' },
      { domaine: 'flexibilite', label: 'Flexibilité', dernierePerf: '2026-11-15T10:00:00Z' },
      { domaine: 'connexion', label: 'Connexion', dernierePerf: null },
    ] };
    expect(brancheDelaissee(d)).toEqual({ domaine: 'flexibilite', label: 'Flexibilité', jours: 13 });
  });
  it('ne relance pas un élève absent depuis plus d\'une semaine', () => {
    expect(brancheDelaissee({ ...base, derniereActivite: '2026-11-15T10:00:00Z', branchesOuvertes: [
      { domaine: 'force', label: 'Force', dernierePerf: '2026-11-15T10:00:00Z' },
      { domaine: 'figures', label: 'Figures', dernierePerf: null },
    ] })).toBeNull();
  });
});
