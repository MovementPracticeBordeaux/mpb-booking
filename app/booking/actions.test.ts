import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { annulerReservation, reserverCours } from './actions';

vi.mock('@/lib/supabase-server', () => ({
  supabaseServer: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Construit un client Supabase mocké qui répond aux appels .from(...) dans
// l'ordre où ils surviennent dans le code testé (un résultat par appel).
function makeChainable(result: { data?: any; error?: any }) {
  const chainable: any = {
    then: (resolve: any) => resolve(result),
  };
  for (const methode of ['select', 'eq', 'update', 'insert', 'upsert', 'single', 'order']) {
    chainable[methode] = vi.fn(() => chainable);
  }
  return chainable;
}

function mockClient({ user, fromResults }: { user: any; fromResults: Array<{ data?: any; error?: any }> }) {
  let i = 0;
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    from: vi.fn(() => makeChainable(fromResults[i++])),
  };
}

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const USER = { id: 'user-1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reserverCours', () => {
  it("redirige vers /login si l'utilisateur n'est pas connecté", async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: null, fromResults: [] }) as any);

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      'REDIRECT:/login'
    );
  });

  it("redirige vers /tarifs si l'élève n'a pas de pass actif", async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [{ data: { abonnement_actif: false, formule_nom: null }, error: null }],
      }) as any
    );

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('redirige vers /planning si le pass est gelé', async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [{ data: { abonnement_actif: true, formule_nom: 'illimite', gele: true }, error: null }],
      }) as any
    );

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/planning/
    );
  });

  it('redirige vers /tarifs si le pass est expiré', async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [
          {
            data: { abonnement_actif: true, formule_nom: 'illimite', gele: false, date_expiration: '2020-01-01' },
            error: null,
          },
        ],
      }) as any
    );

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('redirige vers /tarifs si le quota est épuisé (formule non illimitée)', async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [
          {
            data: {
              abonnement_actif: true,
              formule_nom: 'mensuel_4',
              gele: false,
              date_expiration: '2099-01-01',
              quota_restant: 0,
            },
            error: null,
          },
        ],
      }) as any
    );

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('décompte le quota puis crée la réservation pour une formule non illimitée', async () => {
    const client = mockClient({
      user: USER,
      fromResults: [
        {
          data: {
            abonnement_actif: true,
            formule_nom: 'mensuel_4',
            gele: false,
            date_expiration: '2099-01-01',
            quota_restant: 3,
          },
          error: null,
        },
        { error: null }, // update quota_restant
        { error: null }, // insert reservation
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    await reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }));

    const updateChain = client.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalledWith({ quota_restant: 2 });
    const insertChain = client.from.mock.results[2].value;
    expect(insertChain.insert).toHaveBeenCalledWith({
      eleve_id: 'user-1',
      cours_id: 'c1',
      date_seance: '2026-08-10',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/planning');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ne décompte pas le quota pour la formule illimitée', async () => {
    const client = mockClient({
      user: USER,
      fromResults: [
        {
          data: { abonnement_actif: true, formule_nom: 'illimite', gele: false, date_expiration: '2099-01-01' },
          error: null,
        },
        { error: null }, // insert reservation
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    await reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }));

    expect(client.from).toHaveBeenCalledTimes(2); // pas d'appel update entre les deux
    expect(revalidatePath).toHaveBeenCalledWith('/planning');
  });
});

describe('annulerReservation', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-06T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirige vers /login si l'utilisateur n'est pas connecté", async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: null, fromResults: [] }) as any);

    await expect(
      annulerReservation(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))
    ).rejects.toThrow('REDIRECT:/login');
  });

  it('refuse si le cours a déjà commencé', async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [{ data: { heure_debut: '09:00:00' }, error: null }],
      }) as any
    );

    await expect(
      annulerReservation(formData({ cours_id: 'c1', date_seance: '2026-08-06' }))
    ).rejects.toThrow(/REDIRECT:\/planning\?erreur=/);
  });

  it('refuse si la réservation est introuvable', async () => {
    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [
          { data: { heure_debut: '18:00:00' }, error: null }, // cours pas encore commencé
          { data: null, error: null }, // aucune réservation confirmée trouvée
        ],
      }) as any
    );

    await expect(
      annulerReservation(formData({ cours_id: 'c1', date_seance: '2099-01-01' }))
    ).rejects.toThrow(/REDIRECT:\/planning\?erreur=/);
  });

  it('annule la réservation et restitue le crédit pour une formule non illimitée', async () => {
    const client = mockClient({
      user: USER,
      fromResults: [
        { data: { heure_debut: '18:00:00' }, error: null }, // cours
        { data: { id: 'r1' }, error: null }, // réservation trouvée
        { error: null }, // update statut annulee
        { data: { formule_nom: 'mensuel_4', quota_restant: 2 }, error: null }, // profil
        { error: null }, // update quota_restant
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    await annulerReservation(formData({ cours_id: 'c1', date_seance: '2099-01-01' }));

    const annulationChain = client.from.mock.results[2].value;
    expect(annulationChain.update).toHaveBeenCalledWith({ statut: 'annulee' });
    const quotaChain = client.from.mock.results[4].value;
    expect(quotaChain.update).toHaveBeenCalledWith({ quota_restant: 3 });
    expect(revalidatePath).toHaveBeenCalledWith('/planning');
    expect(revalidatePath).toHaveBeenCalledWith('/profil');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ne touche pas au quota pour une formule illimitée', async () => {
    const client = mockClient({
      user: USER,
      fromResults: [
        { data: { heure_debut: '18:00:00' }, error: null }, // cours
        { data: { id: 'r1' }, error: null }, // réservation trouvée
        { error: null }, // update statut annulee
        { data: { formule_nom: 'illimite', quota_restant: null }, error: null }, // profil
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    await annulerReservation(formData({ cours_id: 'c1', date_seance: '2099-01-01' }));

    expect(client.from).toHaveBeenCalledTimes(4); // pas d'appel update quota supplémentaire
  });
});
