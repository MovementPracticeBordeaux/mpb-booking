import { describe, it, expect } from 'vitest';
import { xpPresence, XP_PAR_SEANCE } from './mentorship-engagement';
import { phraseDuJour, PHRASES } from './mentorship-phrases';

describe('xpPresence', () => {
  it('compte un jour de pratique une seule fois', () => {
    expect(xpPresence(['2026-11-23T08:00:00Z', '2026-11-23T09:00:00Z']).total).toBe(XP_PAR_SEANCE);
  });
  it('plafonne à 5 séances par semaine', () => {
    const semaine = ['23', '24', '25', '26', '27', '28', '29'].map((j) => `2026-11-${j}T10:00:00Z`);
    expect(xpPresence(semaine).total).toBe(5 * XP_PAR_SEANCE);
    expect(xpPresence([...semaine, '2026-11-30T10:00:00Z']).total).toBe(6 * XP_PAR_SEANCE);
  });
  it('compte le jour à l\'heure de Paris', () => {
    // 23 h 30 UTC le 23 = 00 h 30 le 24 à Paris : deux jours distincts.
    expect(xpPresence(['2026-11-23T10:00:00Z', '2026-11-23T23:30:00Z']).parJour.map((p) => p.jour)).toEqual(['2026-11-23', '2026-11-24']);
  });
  it('vaut zéro sans pratique', () => {
    expect(xpPresence([])).toEqual({ total: 0, parJour: [] });
  });
});

describe('phraseDuJour', () => {
  it('reste stable dans la journée et varie selon l\'emplacement', () => {
    const matin = new Date('2026-11-26T07:00:00Z');
    const soir = new Date('2026-11-26T21:00:00Z');
    expect(phraseDuJour(0, matin)).toBe(phraseDuJour(0, soir));
    expect(phraseDuJour(0, matin)).not.toBe(phraseDuJour(1, matin));
    expect(PHRASES).toContain(phraseDuJour(2, matin));
  });
});
