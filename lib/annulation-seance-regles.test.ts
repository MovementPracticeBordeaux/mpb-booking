import { describe, it, expect } from 'vitest';
import { casPourInscrit, texteCas, expirationPourNouvelleReservation } from './annulation-seance-regles';

describe('casPourInscrit', () => {
  it('séance à régler : rien à rendre', () => {
    expect(casPourInscrit(true, { formule_nom: 'mensuel_4', quota_restant: 2 })).toBe('a_regler');
  });
  it('formule à séances : recréditée', () => {
    expect(casPourInscrit(false, { formule_nom: 'mensuel_8', quota_restant: 3 })).toBe('recredite');
    expect(casPourInscrit(false, { formule_nom: 'carnet_10', quota_restant: 0 })).toBe('recredite');
  });
  it('cours découverte ou à l\'unité : on propose de réserver un autre cours', () => {
    expect(casPourInscrit(false, { formule_nom: 'cours_decouverte', quota_restant: 0 })).toBe('une_seance');
    expect(casPourInscrit(false, { formule_nom: 'cours_unite', quota_restant: 0 })).toBe('une_seance');
    expect(texteCas('une_seance')).toContain('réserve un autre cours');
  });
  it('illimité : rien à recréditer', () => {
    expect(casPourInscrit(false, { formule_nom: 'illimite', quota_restant: null })).toBe('illimite');
    expect(texteCas('illimite')).toBe('');
  });
  it('sans formule active', () => {
    expect(casPourInscrit(false, null)).toBe('sans_formule');
  });
});

describe('expirationPourNouvelleReservation', () => {
  it('laisse au moins un mois pour réserver un autre cours', () => {
    expect(expirationPourNouvelleReservation('2026-10-25', '2026-10-22')).toBe('2026-11-22');
  });
  it('ne raccourcit jamais une date plus lointaine', () => {
    expect(expirationPourNouvelleReservation('2026-12-31', '2026-10-22')).toBe('2026-12-31');
  });
  it('pas de date : inchangé', () => {
    expect(expirationPourNouvelleReservation(null, '2026-10-22')).toBeNull();
  });
});
