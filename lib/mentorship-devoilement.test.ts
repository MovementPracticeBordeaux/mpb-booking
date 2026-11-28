import { describe, it, expect } from 'vitest';
import { ongletsVisibles, aDecouvrirPlusLoin } from './mentorship-devoilement';

describe('dévoilement progressif', () => {
  it('ne montre que l’essentiel au départ', () => {
    expect([...ongletsVisibles({ qcmReussi: false, joursDePratique: 0, niveauxValides: 0 })].sort()).toEqual(['arbre', 'progression', 'theorie']);
    expect(aDecouvrirPlusLoin({ qcmReussi: false, joursDePratique: 0, niveauxValides: 0 })).toBe(false);
  });
  it('ouvre les onglets au fil de la pratique', () => {
    const v = ongletsVisibles({ qcmReussi: true, joursDePratique: 1, niveauxValides: 0 });
    expect(v.has('validation') && v.has('journal')).toBe(true);
    expect(v.has('seances') || v.has('outils')).toBe(false);
    expect(ongletsVisibles({ qcmReussi: true, joursDePratique: 3, niveauxValides: 1 }).size).toBe(7);
  });
});
