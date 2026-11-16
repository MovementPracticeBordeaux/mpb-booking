import { describe, it, expect } from 'vitest';
import { lireObjectif, formaterChrono } from './mentorship-chrono';

describe('lireObjectif', () => {
  it('lit une tenue en minutes avec récupération', () => {
    expect(lireObjectif('3 tenues de 1 minute, 3 min de récupération entre chaque tenue.')).toEqual({ series: 3, effortSec: 60, recupSec: 180, recupLibre: false });
  });
  it('lit le format 3x 30 secondes', () => {
    expect(lireObjectif('3x 30 secondes de Frog, 3 min de récupération entre chaque tenue.')).toEqual({ series: 3, effortSec: 30, recupSec: 180, recupLibre: false });
  });
  it('ne confond pas la récupération avec la tenue', () => {
    const o = lireObjectif('3 séries de 8 répétitions, 3 min de récupération entre chaque série.');
    expect(o.series).toBe(3);
    expect(o.effortSec).toBeNull();
    expect(o.recupSec).toBe(180);
  });
  it('lit une récupération de 5 minutes', () => {
    expect(lireObjectif('3 répétitions strictes, 5 min de récupération entre chaque répétition.').recupSec).toBe(300);
  });
  it('reconnaît la récupération à la demande', () => {
    const o = lireObjectif('2 minutes de mouvement continu sans répétition du même pattern, récupération à la demande.');
    expect(o.recupLibre).toBe(true);
    expect(o.recupSec).toBeNull();
    expect(o.effortSec).toBe(120);
  });
  it('lit une tenue seule', () => {
    expect(lireObjectif('Tenue de 10 secondes.')).toEqual({ series: null, effortSec: 10, recupSec: null, recupLibre: false });
  });
  it('ne trouve rien dans un critère sans chiffre', () => {
    expect(lireObjectif('Contrôle musculaire sur chaque mouvement, rythme lent et contrôlé.')).toEqual({ series: null, effortSec: null, recupSec: null, recupLibre: false });
    expect(lireObjectif(undefined).series).toBeNull();
  });
});

describe('formaterChrono', () => {
  it('formate en minutes:secondes', () => {
    expect(formaterChrono(180)).toBe('3:00');
    expect(formaterChrono(65.4)).toBe('1:05');
    expect(formaterChrono(-3)).toBe('0:00');
  });
});
