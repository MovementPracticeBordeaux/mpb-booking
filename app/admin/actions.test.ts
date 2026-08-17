import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ajouterVacances, decompterCoaching, degelerPass, rembourserPaiement, suspendreAcces } from './actions';

vi.mock('@/lib/supabase-server', () => ({
  supabaseServer: vi.fn(),
  supabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { retrieve: vi.fn() } },
    refunds: { create: vi.fn() },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function makeChainable(result: { data?: any; error?: any }) {
  const chainable: any = {
    then: (resolve: any) => resolve(result),
  };
  for (const methode of ['select', 'eq', 'update', 'insert', 'upsert', 'single', 'order', 'in', 'not', 'lte', 'gte']) {
    chainable[methode] = vi.fn(() => chainable);
  }
  return chainable;
}

function mockAdminClient(fromResults: Array<{ data?: any; error?: any }>) {
  let i = 0;
  return { from: vi.fn(() => makeChainable(fromResults[i++])) };
}

const ADMIN_USER = { id: 'admin-1' };

function mockAdminAuth() {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: ADMIN_USER } })) },
    from: vi.fn(() => makeChainable({ data: { role: 'admin' }, error: null })),
  };
}

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(supabaseServer).mockReturnValue(mockAdminAuth() as any);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('decompterCoaching', () => {
  it("refuse de décompter plus que le quota restant", async () => {
    vi.mocked(supabaseAdmin).mockReturnValue(
      mockAdminClient([{ data: { quota_restant: 2 }, error: null }]) as any
    );

    await expect(
      decompterCoaching(formData({ eleve_id: 'e1', quantite: '3' }))
    ).rejects.toThrow(/REDIRECT:\/admin\/eleves\?erreur=/);
  });

  it('décompte correctement le quota restant', async () => {
    const admin = mockAdminClient([
      { data: { quota_restant: 5 }, error: null },
      { error: null },
    ]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(decompterCoaching(formData({ eleve_id: 'e1', quantite: '2' }))).rejects.toThrow(
      /REDIRECT:\/admin\/eleves\?succes=/
    );

    const updateChain = admin.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalledWith({ quota_restant: 3 });
    expect(revalidatePath).toHaveBeenCalledWith('/admin/eleves');
  });
});

describe('suspendreAcces', () => {
  it("coupe l'abonnement de l'élève", async () => {
    const admin = mockAdminClient([{ error: null }]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(suspendreAcces(formData({ eleve_id: 'e1' }))).rejects.toThrow(/REDIRECT:\/admin\/eleves\?succes=/);

    const updateChain = admin.from.mock.results[0].value;
    expect(updateChain.update).toHaveBeenCalledWith({ abonnement_actif: false });
    expect(revalidatePath).toHaveBeenCalledWith('/admin/eleves');
  });
});

describe('degelerPass', () => {
  it('prolonge la date d\'expiration du nombre de jours passés gelé', async () => {
    vi.setSystemTime(new Date('2026-08-06T00:00:00Z'));
    const admin = mockAdminClient([
      { data: { date_gel_debut: '2026-08-01', date_expiration: '2026-08-20' }, error: null },
      { error: null },
    ]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(degelerPass(formData({ eleve_id: 'e1' }))).rejects.toThrow(/REDIRECT:\/admin\/eleves\?succes=/);

    const updateChain = admin.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalledWith({
      gele: false,
      date_gel_debut: null,
      date_fin_gel_prevue: null,
      date_expiration: '2026-08-25', // +5 jours
    });
  });

  it("refuse si le pass n'est pas gelé", async () => {
    vi.mocked(supabaseAdmin).mockReturnValue(
      mockAdminClient([{ data: { date_gel_debut: null, date_expiration: '2026-08-20' }, error: null }]) as any
    );

    await expect(degelerPass(formData({ eleve_id: 'e1' }))).rejects.toThrow(/REDIRECT:\/admin\/eleves\?erreur=/);
  });
});

describe('rembourserPaiement', () => {
  function setupStripeSuccess() {
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({ payment_intent: 'pi_123' } as any);
    vi.mocked(stripe.refunds.create).mockResolvedValue({} as any);
  }

  it('refuse si déjà remboursé', async () => {
    vi.mocked(supabaseAdmin).mockReturnValue(
      mockAdminClient([
        { data: { id: 'p1', rembourse: true, stripe_session_id: 'sess_1' }, error: null },
      ]) as any
    );

    await expect(rembourserPaiement(formData({ paiement_id: 'p1' }))).rejects.toThrow(
      /REDIRECT:\/admin\/eleves\?erreur=/
    );
  });

  it("coupe l'accès de l'élève quand la formule remboursée est sa formule active", async () => {
    setupStripeSuccess();
    const admin = mockAdminClient([
      { data: { id: 'p1', eleve_id: 'e1', formule_nom: 'mensuel_4', rembourse: false, stripe_session_id: 'sess_1' }, error: null },
      { error: null }, // update paiements.rembourse
      { data: { formule_nom: 'mensuel_4', abonnement_actif: true }, error: null }, // select profil
      { error: null }, // update profiles.abonnement_actif = false
    ]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(rembourserPaiement(formData({ paiement_id: 'p1' }))).rejects.toThrow(
      /REDIRECT:\/admin\/eleves\?succes=/
    );

    expect(admin.from).toHaveBeenCalledTimes(4);
    const coupureChain = admin.from.mock.results[3].value;
    expect(coupureChain.update).toHaveBeenCalledWith({ abonnement_actif: false });
  });

  it("ne coupe pas l'accès si l'élève a changé de formule depuis", async () => {
    setupStripeSuccess();
    const admin = mockAdminClient([
      { data: { id: 'p1', eleve_id: 'e1', formule_nom: 'mensuel_4', rembourse: false, stripe_session_id: 'sess_1' }, error: null },
      { error: null }, // update paiements.rembourse
      { data: { formule_nom: 'illimite', abonnement_actif: true }, error: null }, // select profil (formule différente désormais)
    ]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(rembourserPaiement(formData({ paiement_id: 'p1' }))).rejects.toThrow(
      /REDIRECT:\/admin\/eleves\?succes=/
    );

    expect(admin.from).toHaveBeenCalledTimes(3); // pas d'appel de coupure supplémentaire
  });
});

describe('ajouterVacances', () => {
  it("ne cible que les formules mensuelles (4/8 cours et illimité), pas les carnets — et prolonge selon l'exemple de Louis (15 jours -> 30 août)", async () => {
    const admin = mockAdminClient([
      { error: null }, // insertion de la période de vacances
      { data: [{ id: 'e1', date_debut_formule: '2026-07-15', date_expiration: '2026-08-15' }], error: null }, // profils actifs concernés
      { error: null }, // mise à jour de la date d'expiration de e1
    ]);
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);

    await expect(ajouterVacances(formData({ date_debut: '2026-08-01', date_fin: '2026-08-15' }))).rejects.toThrow(
      /REDIRECT:\/admin\/planning\?succes=/
    );

    const chaineSelect = admin.from.mock.results[1].value;
    expect(chaineSelect.in).toHaveBeenCalledWith('formule_nom', ['mensuel_4', 'mensuel_8', 'illimite']);

    const chaineUpdate = admin.from.mock.results[2].value;
    expect(chaineUpdate.update).toHaveBeenCalledWith({ date_expiration: '2026-08-30' });
  });
});
