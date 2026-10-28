import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: vi.fn() }));
import { expirationEffective } from './seances-a-regler';

describe('expirationEffective', () => {
  it('formule normale : sa date de fin', () => {
    expect(expirationEffective({ date_expiration: '2026-10-27' })).toBe('2026-10-27');
  });
  it('une séance du lendemain de la fin n\'est plus couverte', () => {
    expect('2026-10-28' > expirationEffective({ date_expiration: '2026-10-27' })!).toBe(true);
  });
  it('formule gelée : fin repoussée de la durée du gel', () => {
    expect(expirationEffective({ date_expiration: '2026-10-27', gele: true, date_gel_debut: '2026-10-10', date_fin_gel_prevue: '2026-10-20' })).toBe('2026-11-06');
  });
  it('sans date de fin', () => {
    expect(expirationEffective({ date_expiration: null })).toBeNull();
  });
});
