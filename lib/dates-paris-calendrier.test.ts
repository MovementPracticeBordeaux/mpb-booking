import { describe, it, expect } from 'vitest';
import { aujourdhuiParis, ajouterJoursISO, ajouterMoisISO, joursEntre, anneeParis, midiUTC } from './dates-paris';
import { calculerSemaine } from './semaine';

describe('dates calendrier à Paris', () => {
  it("après minuit à Paris, c'est déjà le lendemain (hiver, UTC+1)", () => {
    expect(aujourdhuiParis(new Date('2026-11-20T23:30:00Z'))).toBe('2026-11-21');
  });
  it("après minuit à Paris, c'est déjà le lendemain (été, UTC+2)", () => {
    expect(aujourdhuiParis(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15');
  });
  it('ajoute des jours et des mois sans effet de fuseau', () => {
    expect(ajouterJoursISO('2026-10-24', 2)).toBe('2026-10-26'); // passage à l'heure d'hiver
    expect(ajouterMoisISO('2026-11-20', 1)).toBe('2026-12-20');
    expect(joursEntre('2026-10-24', '2026-10-26')).toBe(2);
  });
  it("année d'une facture créée le 31/12 à 23h30 heure de Paris", () => {
    expect(anneeParis('2026-12-31T22:30:00Z')).toBe(2026);
    expect(anneeParis('2026-12-31T23:30:00Z')).toBe(2027);
  });
  it('semaine A/B identique quel que soit le fuseau de la machine', () => {
    const ref = new Date('2026-01-05');
    expect(calculerSemaine(midiUTC('2026-01-11'), ref, 'A')).toBe('A');
    expect(calculerSemaine(midiUTC('2026-01-12'), ref, 'A')).toBe('B');
  });
});
