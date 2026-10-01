import { describe, it, expect } from 'vitest';
import { joursChevauchement, joursVacancesDansPeriode, ajouterJours } from './vacances';

describe('joursChevauchement', () => {
  it("calcule l'exemple de Louis : formule 15 juil.-15 août, vacances 1er-15 août -> 15 jours", () => {
    expect(joursChevauchement('2026-07-15', '2026-08-15', '2026-08-01', '2026-08-15')).toBe(15);
  });

  it('retourne 0 si les périodes ne se chevauchent pas', () => {
    expect(joursChevauchement('2026-07-01', '2026-07-10', '2026-08-01', '2026-08-15')).toBe(0);
  });

  it('gère un chevauchement partiel', () => {
    // Formule du 20 juillet au 20 août, vacances du 1er au 15 août -> tout le mois de vacances tombe dedans
    expect(joursChevauchement('2026-07-20', '2026-08-20', '2026-08-01', '2026-08-15')).toBe(15);
    // Vacances qui débordent après la fin de la formule : seule la partie commune compte
    expect(joursChevauchement('2026-07-20', '2026-08-10', '2026-08-01', '2026-08-15')).toBe(10);
  });

  it('compte un seul jour quand début = fin', () => {
    expect(joursChevauchement('2026-08-01', '2026-08-01', '2026-08-01', '2026-08-01')).toBe(1);
  });
});

describe('joursVacancesDansPeriode', () => {
  it('additionne plusieurs périodes de vacances distinctes', () => {
    const periodes = [
      { date_debut: '2026-08-01', date_fin: '2026-08-05' }, // 5 jours dans la formule
      { date_debut: '2026-08-20', date_fin: '2026-08-22' }, // 3 jours dans la formule
      { date_debut: '2026-09-01', date_fin: '2026-09-05' }, // hors formule, ignoré
    ];
    expect(joursVacancesDansPeriode('2026-07-15', '2026-08-31', periodes)).toBe(8);
  });
});

describe("ajouterJours (exemple de Louis)", () => {
  it('15 août + 15 jours = 30 août', () => {
    expect(ajouterJours('2026-08-15', 15)).toBe('2026-08-30');
  });
});

import { premierJourDeCours } from './vacances';

describe('premierJourDeCours', () => {
  // Planning type de Sylvain : semaine A du mardi au vendredi, semaine B du lundi au jeudi.
  const cours = [2, 3, 4, 5].map((j) => ({ jour_semaine: j, semaine: 'A' })).concat([1, 2, 3, 4].map((j) => ({ jour_semaine: j, semaine: 'B' })));
  const semaineA = () => 'A' as const;
  const semaineB = () => 'B' as const;

  it("vacances du samedi 3 au dimanche 11 octobre 2026, semaine A : le gel démarre le mardi 6", () => {
    expect(premierJourDeCours('2026-10-03', '2026-10-11', cours, semaineA)).toBe('2026-10-06');
  });
  it('en semaine B, il démarre dès le lundi', () => {
    expect(premierJourDeCours('2026-10-03', '2026-10-11', cours, semaineB)).toBe('2026-10-05');
  });
  it("rien à geler si aucun cours n'était prévu", () => {
    expect(premierJourDeCours('2026-10-03', '2026-10-04', cours, semaineA)).toBeNull();
  });
});
