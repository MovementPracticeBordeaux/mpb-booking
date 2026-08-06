import { describe, expect, it } from 'vitest';
import { calculerSemaine } from './semaine';

// Lundi de référence connu : 2026-01-05.
const REF = new Date('2026-01-05');

describe('calculerSemaine', () => {
  it('retourne la semaine de référence pour le lundi de référence lui-même', () => {
    expect(calculerSemaine(new Date('2026-01-05'), REF, 'A')).toBe('A');
  });

  it('retourne la même semaine pour un autre jour de la même semaine (mercredi)', () => {
    expect(calculerSemaine(new Date('2026-01-07'), REF, 'A')).toBe('A');
  });

  it("retourne la même semaine pour le dimanche de la semaine de référence", () => {
    expect(calculerSemaine(new Date('2026-01-11'), REF, 'A')).toBe('A');
  });

  it('inverse la semaine pour la semaine suivante', () => {
    expect(calculerSemaine(new Date('2026-01-12'), REF, 'A')).toBe('B');
  });

  it('retourne la même semaine deux semaines plus tard (parité paire)', () => {
    expect(calculerSemaine(new Date('2026-01-19'), REF, 'A')).toBe('A');
  });

  it('inverse la semaine pour la semaine précédente', () => {
    expect(calculerSemaine(new Date('2025-12-29'), REF, 'A')).toBe('B');
  });

  it('le dimanche juste avant le lundi de référence appartient à la semaine précédente', () => {
    expect(calculerSemaine(new Date('2026-01-04'), REF, 'A')).toBe('B');
  });

  it('fonctionne symétriquement quand la semaine de référence est B', () => {
    expect(calculerSemaine(new Date('2026-01-05'), REF, 'B')).toBe('B');
    expect(calculerSemaine(new Date('2026-01-12'), REF, 'B')).toBe('A');
  });
});
