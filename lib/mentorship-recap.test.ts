import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/resend', () => ({ envoyerEmail: async () => {} }));
vi.mock('@/lib/push', () => ({ envoyerPushAEleve: async () => {} }));
vi.mock('@/lib/alerte-admin', () => ({ alerterAdminPush: async () => {} }));

import { composerRecap, estDimancheAParis } from './mentorship-recap';

const maintenant = new Date('2026-11-15T18:00:00Z'); // dimanche soir

describe('composerRecap', () => {
  it('n\'envoie rien à un élève sans activité', () => {
    expect(composerRecap('Léa', [], [], maintenant)).toBeNull();
    expect(composerRecap('Léa', [{ module_id: 'force-1::x', statut: 'acquis', reviewed_at: '2026-09-01T10:00:00Z' }], [{ cree_le: '2026-10-01T10:00:00Z' }], maintenant)).toBeNull();
  });
  it('résume la semaine', () => {
    const r = composerRecap('Léa <b>', [{ module_id: 'armure-x', statut: 'refuse', reviewed_at: '2026-11-13T10:00:00Z' }], [{ cree_le: '2026-11-12T10:00:00Z' }, { cree_le: '2026-11-14T10:00:00Z' }], maintenant);
    expect(r).not.toBeNull();
    expect(r!.html).toContain('2 séances');
    expect(r!.html).toContain('À retravailler');
    expect(r!.html).toContain('Armure Organique · niveau 1');
    expect(r!.html).toContain('Léa &lt;b&gt;');
  });
});

describe('estDimancheAParis', () => {
  it('reconnaît le dimanche à l\'heure de Paris', () => {
    expect(estDimancheAParis(maintenant)).toBe(true);
    expect(estDimancheAParis(new Date('2026-11-16T18:00:00Z'))).toBe(false);
    expect(estDimancheAParis(new Date('2026-11-15T23:30:00Z'))).toBe(false); // déjà lundi à Paris
  });
});
