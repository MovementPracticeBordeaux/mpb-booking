import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { annulerReservation, reserverCours } from './actions';

vi.mock('@/lib/supabase-server', () => ({
  supabaseServer: vi.fn(),
  supabaseAdmin: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/resend', () => ({
  envoyerEmail: vi.fn(async () => {}),
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

const USER = { id: 'user-1', email: 'eleve@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reserverCours', () => {
  function mockAdminRpc(resultat: { data?: any; error?: any }) {
    const admin = { rpc: vi.fn(async () => resultat) };
    vi.mocked(supabaseAdmin).mockReturnValue(admin as any);
    return admin;
  }

  it("redirige vers /login si l'utilisateur n'est pas connecté", async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: null, fromResults: [] }) as any);

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      'REDIRECT:/login'
    );
  });

  it('appelle la fonction SQL atomique reserver_creneau avec les bons paramètres, puis envoie un email de confirmation', async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    const admin = mockAdminRpc({ data: 'ok', error: null }) as any;
    admin.from = vi.fn(() => makeChainable({
      data: { discipline: 'Handstand', heure_debut: '18:00:00', heure_fin: '19:00:00', lieu: 'Darwin' },
      error: null,
    }));

    await reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }));

    expect(admin.rpc).toHaveBeenCalledWith('reserver_creneau', {
      p_eleve_id: 'user-1',
      p_cours_id: 'c1',
      p_date_seance: '2026-08-10',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/planning');
    expect(envoyerEmail).toHaveBeenCalledWith(
      'eleve@example.com',
      expect.stringContaining('Handstand'),
      expect.stringContaining('Handstand')
    );
  });

  it("redirige vers /tarifs si l'élève n'a pas de pass actif (pas_abonne)", async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: 'pas_abonne', error: null });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('redirige vers /planning si le pass est gelé', async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: 'gele', error: null });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/planning/
    );
  });

  it('redirige vers /tarifs si le pass est expiré', async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: 'expire', error: null });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('redirige vers /tarifs si le quota est épuisé', async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: 'quota_epuise', error: null });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/tarifs/
    );
  });

  it('redirige vers /planning si la séance est déjà réservée (double-clic / double-onglet)', async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: 'deja_reserve', error: null });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/planning/
    );
  });

  it("propage une erreur inattendue de la fonction SQL vers /planning", async () => {
    vi.mocked(supabaseServer).mockReturnValue(mockClient({ user: USER, fromResults: [] }) as any);
    mockAdminRpc({ data: null, error: { message: 'boom' } });

    await expect(reserverCours(formData({ cours_id: 'c1', date_seance: '2026-08-10' }))).rejects.toThrow(
      /REDIRECT:\/planning/
    );
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

  it('refuse si le cours commence dans moins de 1h30', async () => {
    const dansUneHeure = new Date(Date.now() + 60 * 60000); // 1h avant le cours, sous le délai de 1h30
    const dateSeance = `${dansUneHeure.getFullYear()}-${String(dansUneHeure.getMonth() + 1).padStart(2, '0')}-${String(dansUneHeure.getDate()).padStart(2, '0')}`;
    const heureDebut = `${String(dansUneHeure.getHours()).padStart(2, '0')}:${String(dansUneHeure.getMinutes()).padStart(2, '0')}:00`;

    vi.mocked(supabaseServer).mockReturnValue(
      mockClient({
        user: USER,
        fromResults: [{ data: { heure_debut: heureDebut }, error: null }],
      }) as any
    );

    await expect(
      annulerReservation(formData({ cours_id: 'c1', date_seance: dateSeance }))
    ).rejects.toThrow(/REDIRECT:\/planning\?erreur=/);
  });

  it('autorise l\'annulation si le cours commence dans plus de 1h30', async () => {
    const dansDeuxHeures = new Date(Date.now() + 120 * 60000);
    const dateSeance = `${dansDeuxHeures.getFullYear()}-${String(dansDeuxHeures.getMonth() + 1).padStart(2, '0')}-${String(dansDeuxHeures.getDate()).padStart(2, '0')}`;
    const heureDebut = `${String(dansDeuxHeures.getHours()).padStart(2, '0')}:${String(dansDeuxHeures.getMinutes()).padStart(2, '0')}:00`;

    const client = mockClient({
      user: USER,
      fromResults: [
        { data: { heure_debut: heureDebut }, error: null }, // cours dans 2h, annulable
        { data: { id: 'r1' }, error: null }, // réservation trouvée
        { error: null }, // update statut annulee
        { data: { formule_nom: 'illimite', quota_restant: null }, error: null }, // profil
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    await annulerReservation(formData({ cours_id: 'c1', date_seance: dateSeance }));

    expect(redirect).not.toHaveBeenCalled();
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
      ],
    });
    vi.mocked(supabaseServer).mockReturnValue(client as any);

    // La restitution du crédit passe volontairement par le client admin
    // (bypass RLS), pas par la session de l'élève — voir le commentaire dans
    // actions.ts. On mocke donc un second client dédié à cet appel.
    const adminClient = { from: vi.fn(() => makeChainable({ error: null })) };
    vi.mocked(supabaseAdmin).mockReturnValue(adminClient as any);

    await annulerReservation(formData({ cours_id: 'c1', date_seance: '2099-01-01' }));

    const annulationChain = client.from.mock.results[2].value;
    expect(annulationChain.update).toHaveBeenCalledWith({ statut: 'annulee' });
    const quotaChain = adminClient.from.mock.results[0].value;
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
