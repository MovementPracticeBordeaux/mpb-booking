import { describe, it, expect } from 'vitest';
import { quotaApresRecredit } from './recredit-seance';

describe('quotaApresRecredit', () => {
  it('rend une séance', () => {
    expect(quotaApresRecredit({ formule_nom: 'mensuel_8', quota_restant: 3, quota_total: 8 })).toBe(4);
  });
  it('ne dépasse jamais le total de la formule', () => {
    expect(quotaApresRecredit({ formule_nom: 'mensuel_8', quota_restant: 8, quota_total: 8 })).toBe(8);
  });
  it('ne touche pas à l\'illimité', () => {
    expect(quotaApresRecredit({ formule_nom: 'illimite', quota_restant: null, quota_total: null })).toBeNull();
  });
});
