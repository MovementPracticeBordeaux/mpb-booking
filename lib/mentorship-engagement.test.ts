import { describe, it, expect } from 'vitest';
import { prochaineRevision, choisirQuestionDuJour, serieSemaines, calculerBadges } from './mentorship-engagement';

const jeudi = new Date('2026-11-12T10:00:00+01:00');

describe('révision espacée', () => {
  it('fait monter une question réussie et redescendre une question ratée', () => {
    expect(prochaineRevision(null, true, jeudi)).toEqual({ boite: 1, prochaine_le: '2026-11-15' });
    expect(prochaineRevision(1, true, jeudi)).toEqual({ boite: 2, prochaine_le: '2026-11-19' });
    expect(prochaineRevision(4, true, jeudi).boite).toBe(4);
    expect(prochaineRevision(3, false, jeudi)).toEqual({ boite: 0, prochaine_le: '2026-11-13' });
  });
  it('ne propose rien si une révision a déjà été faite aujourd\'hui', () => {
    const lignes = [{ question_id: 'a', boite: 1, prochaine_le: '2026-11-15', derniere_le: '2026-11-12T08:00:00+01:00' }];
    expect(choisirQuestionDuJour(['a', 'b'], lignes, jeudi)).toEqual({ questionId: null, faiteAujourdhui: true });
  });
  it('donne la priorité à la question échue depuis le plus longtemps', () => {
    const lignes = [
      { question_id: 'a', boite: 1, prochaine_le: '2026-11-10', derniere_le: '2026-11-07T08:00:00+01:00' },
      { question_id: 'b', boite: 0, prochaine_le: '2026-11-08', derniere_le: '2026-11-07T08:00:00+01:00' },
    ];
    expect(choisirQuestionDuJour(['a', 'b', 'c'], lignes, jeudi).questionId).toBe('b');
  });
  it('propose une question jamais revue quand rien n\'est échu', () => {
    const lignes = [{ question_id: 'a', boite: 4, prochaine_le: '2026-12-10', derniere_le: '2026-11-10T08:00:00+01:00' }];
    expect(choisirQuestionDuJour(['a', 'b'], lignes, jeudi).questionId).toBe('b');
    expect(choisirQuestionDuJour(['a'], lignes, jeudi)).toEqual({ questionId: null, faiteAujourdhui: false });
  });
});

describe('série de semaines actives', () => {
  it('compte les semaines consécutives jusqu\'à la semaine en cours', () => {
    const r = serieSemaines(['2026-11-10T09:00:00Z', '2026-11-04T09:00:00Z', '2026-10-28T09:00:00Z', '2026-10-07T09:00:00Z'], jeudi);
    expect(r).toEqual({ semaines: 3, activeCetteSemaine: true });
  });
  it('garde la série vivante si seule la semaine précédente est active', () => {
    expect(serieSemaines(['2026-11-04T09:00:00Z', '2026-10-28T09:00:00Z'], jeudi)).toEqual({ semaines: 2, activeCetteSemaine: false });
  });
  it('retombe à zéro après une semaine vide', () => {
    expect(serieSemaines(['2026-10-28T09:00:00Z'], jeudi).semaines).toBe(0);
  });
});

describe('badges', () => {
  it('ne débloque que ce qui est mérité', () => {
    const b = calculerBadges({ nbPerfs: 1, nbNotesJournal: 9, nbExercicesValides: 0, nbQuetesSecondairesValidees: 0, armureComplete: false, paliersBranchesValides: 0, serieSemaines: 4, nbRevisionsJustes: 0 });
    expect(b.filter((x) => x.obtenu).map((x) => x.id)).toEqual(['premiere-perf', 'regulier']);
  });
});
