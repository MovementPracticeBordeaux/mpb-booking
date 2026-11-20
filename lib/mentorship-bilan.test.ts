import { describe, it, expect } from 'vitest';
import { etapeEnCours, bilanDepuis, lundiDeLaSemaine } from './mentorship-bilan';
import { TRONC, moduleIdExercice } from './mentorship-modules';

describe('etapeEnCours', () => {
  it('commence à l\'Armure niveau 1', () => {
    expect(etapeEnCours([])).toBe('Armure Organique · niveau 1');
  });
  it('passe aux branches une fois l\'Armure complète', () => {
    const lignes = TRONC.flatMap((n) => (n.exercices?.length ? n.exercices.map((e) => moduleIdExercice(n, e)) : [n.id])).map((module_id) => ({ module_id, statut: 'acquis' }));
    expect(etapeEnCours(lignes)).toBe('Branches · palier 1 (0/5 niveaux validés)');
  });
});

describe('bilanDepuis', () => {
  const depuis = new Date('2026-11-09T00:00:00Z');
  it('compte les séances par jour distinct et trie les statuts', () => {
    const b = bilanDepuis(
      [
        { module_id: 'a', statut: 'acquis', reviewed_at: '2026-11-10T10:00:00Z' },
        { module_id: 'b', statut: 'acquis', reviewed_at: '2026-10-01T10:00:00Z' },
        { module_id: 'c', statut: 'refuse', reviewed_at: '2026-11-11T10:00:00Z' },
        { module_id: 'd', statut: 'en_attente', submitted_at: '2026-11-12T10:00:00Z' },
      ],
      [{ cree_le: '2026-11-10T09:00:00Z' }, { cree_le: '2026-11-10T09:30:00Z' }, { cree_le: '2026-11-12T09:00:00Z' }, { cree_le: '2026-11-01T09:00:00Z' }],
      depuis,
    );
    expect(b.seances).toBe(2);
    expect(b.perfsNotees).toBe(3);
    expect(b.validees).toEqual(['a']);
    expect(b.aRetravailler).toEqual(['c']);
    expect(b.enAttente).toEqual(['d']);
    expect(b.derniereActivite).toBe('2026-11-12T10:00:00Z');
  });
  it('renvoie un bilan vide sans données', () => {
    expect(bilanDepuis([], [], depuis)).toEqual({ seances: 0, perfsNotees: 0, validees: [], aRetravailler: [], enAttente: [], derniereActivite: null });
  });
});

describe('lundiDeLaSemaine', () => {
  it('revient au lundi', () => {
    const jourParis = (d: Date) => d.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' });
    expect(jourParis(lundiDeLaSemaine(new Date('2026-11-15T13:00:00Z')))).toBe('2026-11-09 00:00:00'); // dimanche 15 -> lundi 9, minuit à Paris
    expect(jourParis(lundiDeLaSemaine(new Date('2026-11-16T13:00:00Z')))).toBe('2026-11-16 00:00:00');
    // Dimanche 23h30 UTC = lundi 0h30 à Paris : déjà la nouvelle semaine.
    expect(jourParis(lundiDeLaSemaine(new Date('2026-11-15T23:30:00Z')))).toBe('2026-11-16 00:00:00');
  });
});
