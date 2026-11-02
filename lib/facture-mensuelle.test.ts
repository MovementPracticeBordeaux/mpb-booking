import { describe, it, expect } from 'vitest';
import { seancesTenuesDuMois, moisPrecedent, libelleMois } from './facture-mensuelle';

// Planning réel : Handstand mardi 19h30 en semaine A et B, Calisthenics mardi midi.
const COURS = [
  { id: 'cal-a', jour_semaine: 2, semaine: 'A', heure_debut: '12:15:00', actif: true },
  { id: 'hs-a', jour_semaine: 2, semaine: 'A', heure_debut: '19:30:00', actif: true },
  { id: 'cal-b', jour_semaine: 2, semaine: 'B', heure_debut: '12:15:00', actif: true },
  { id: 'hs-b', jour_semaine: 2, semaine: 'B', heure_debut: '19:30:00', actif: true },
];
const BASE = { cours: COURS, lundiReference: '2026-08-17', semaineCeLundi: 'B' as const, annulations: [] };

describe('seancesTenuesDuMois', () => {
  it('septembre 2026 : 5 mardis soir (comme la facture de septembre)', () => {
    expect(seancesTenuesDuMois({ ...BASE, mois: '2026-09', vacances: [] })).toHaveLength(5);
  });
  it('octobre 2026 : le mardi 6 est en vacances -> 3 cours', () => {
    expect(seancesTenuesDuMois({ ...BASE, mois: '2026-10', vacances: [{ date_debut: '2026-10-03', date_fin: '2026-10-11' }] }))
      .toEqual(['2026-10-13', '2026-10-20', '2026-10-27']);
  });
  it('une séance annulée ponctuellement ne compte pas', () => {
    const r = seancesTenuesDuMois({ ...BASE, mois: '2026-09', vacances: [], annulations: [{ cours_id: 'hs-b', date_seance: '2026-09-15' }, { cours_id: 'hs-a', date_seance: '2026-09-15' }] });
    expect(r).not.toContain('2026-09-15');
    expect(r).toHaveLength(4);
  });
  it('les cours du midi ne comptent pas', () => {
    const r = seancesTenuesDuMois({ ...BASE, cours: COURS.filter((c) => c.id.startsWith('cal')), mois: '2026-09', vacances: [] });
    expect(r).toHaveLength(0);
  });
});

describe('dates', () => {
  it('mois précédent', () => {
    expect(moisPrecedent('2026-11-01')).toBe('2026-10');
    expect(moisPrecedent('2027-01-01')).toBe('2026-12');
  });
  it('libellé', () => { expect(libelleMois('2026-10')).toBe('octobre 2026'); });
});
