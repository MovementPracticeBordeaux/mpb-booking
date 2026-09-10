import { describe, it, expect } from 'vitest';
import { parisVersUTC, utcVersParisInput } from './dates-paris';

describe('parisVersUTC', () => {
  it("convertit une heure d'été (CEST, UTC+2) - exemple de l'atelier du 26 septembre", () => {
    // 26 septembre 2026, 14h à Bordeaux = 12h UTC.
    expect(parisVersUTC('2026-09-26T14:00')).toBe('2026-09-26T12:00:00.000Z');
  });

  it("convertit une heure d'hiver (CET, UTC+1)", () => {
    // 15 janvier 2026, 14h à Bordeaux = 13h UTC.
    expect(parisVersUTC('2026-01-15T14:00')).toBe('2026-01-15T13:00:00.000Z');
  });
});

describe('utcVersParisInput', () => {
  it("reconvertit correctement en heure d'été", () => {
    expect(utcVersParisInput('2026-09-26T12:00:00.000Z')).toBe('2026-09-26T14:00');
  });

  it("reconvertit correctement en heure d'hiver", () => {
    expect(utcVersParisInput('2026-01-15T13:00:00.000Z')).toBe('2026-01-15T14:00');
  });

  it('fait un aller-retour cohérent (parisVersUTC puis utcVersParisInput)', () => {
    const original = '2026-09-26T14:00';
    expect(utcVersParisInput(parisVersUTC(original))).toBe(original);
  });
});
