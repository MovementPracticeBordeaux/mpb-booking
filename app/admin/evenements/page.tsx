import { supabaseAdmin } from '@/lib/supabase-server';
import { creerEvenement, modifierEvenement, desactiverEvenement, reactiverEvenement, supprimerEvenement } from '../actions';
import { utcVersParisInput } from '@/lib/dates-paris';

export const dynamic = 'force-dynamic';

export default async function AdminEvenementsPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();
  const { data: evenements } = await admin
    .from('evenements')
    .select('*')
    .order('date_debut', { ascending: true });

  const { data: reservationsBrut } = await admin
    .from('evenement_reservations')
    .select('*')
    .order('created_at', { ascending: false });
  const reservationsParEvenement = new Map<string, typeof reservationsBrut>();
  for (const r of reservationsBrut ?? []) {
    const liste = reservationsParEvenement.get(r.evenement_id) ?? [];
    liste.push(r);
    reservationsParEvenement.set(r.evenement_id, liste);
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <h1>Événements</h1>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Ateliers, stages ou événements ponctuels (distincts des cours réguliers) — affichés en évidence sur la page
        d'accueil et sur /evenements tant qu'ils sont actifs.
      </p>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>⚠️ {searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>✅ {searchParams.succes}</p>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Publier un événement</h2>
        <form action={creerEvenement} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
          <input name="titre" placeholder="Titre (ex. Atelier découverte Handstand)" required />
          <textarea name="description" placeholder="Description, déroulé, à qui ça s'adresse..." rows={4} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
          <input name="lieu" placeholder="Lieu" required />
          <label style={{ fontSize: 12, opacity: 0.7 }}>Début</label>
          <input name="date_debut" type="datetime-local" required />
          <label style={{ fontSize: 12, opacity: 0.7 }}>Fin</label>
          <input name="date_fin" type="datetime-local" required />
          <label style={{ fontSize: 12, opacity: 0.7 }}>Prix (€)</label>
          <input name="prix" type="number" min="0" step="0.01" placeholder="49" required />
          <label style={{ fontSize: 12, opacity: 0.7 }}>ID du prix Stripe (créé dans ton dashboard Stripe) — optionnel, sans lui le paiement en ligne n'est pas actif</label>
          <input name="stripe_price_id" placeholder="price_..." />
          <button type="submit">Publier</button>
        </form>
      </section>

      <section>
        <h2>Événements existants</h2>
        {(evenements ?? []).length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Aucun événement pour le moment.</p>}
        {(evenements ?? []).map((e) => {
          const inscrits = reservationsParEvenement.get(e.id) ?? [];
          return (
          <details key={e.id} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>
              {new Date(e.date_debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {e.titre} · {e.prix} €
              {' · '}{inscrits.length} inscrit{inscrits.length !== 1 ? 's' : ''}
              {!e.actif && ' · (masqué)'}
              {!e.stripe_price_id && ' · ⚠️ paiement en ligne non configuré'}
            </summary>

            {inscrits.length > 0 && (
              <div style={{ margin: '10px 0', fontSize: 12 }}>
                <p style={{ opacity: 0.6, marginBottom: 4 }}>Inscrits payés :</p>
                {inscrits.map((r) => (
                  <p key={r.id} style={{ margin: '2px 0' }}>
                    {r.nom ? `${r.nom} — ` : ''}{r.email} · {Number(r.montant).toFixed(2)} €
                  </p>
                ))}
              </div>
            )}

            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12, cursor: 'pointer', color: '#f0a' }}>✏️ Modifier</summary>
              <form action={modifierEvenement} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginTop: 10 }}>
                <input type="hidden" name="id" value={e.id} />
                <input name="titre" defaultValue={e.titre} required />
                <textarea name="description" defaultValue={e.description} rows={4} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
                <input name="lieu" defaultValue={e.lieu} required />
                <label style={{ fontSize: 12, opacity: 0.7 }}>Début</label>
                <input name="date_debut" type="datetime-local" defaultValue={utcVersParisInput(e.date_debut)} required />
                <label style={{ fontSize: 12, opacity: 0.7 }}>Fin</label>
                <input name="date_fin" type="datetime-local" defaultValue={utcVersParisInput(e.date_fin)} required />
                <label style={{ fontSize: 12, opacity: 0.7 }}>Prix (€)</label>
                <input name="prix" type="number" min="0" step="0.01" defaultValue={e.prix} required />
                <label style={{ fontSize: 12, opacity: 0.7 }}>ID du prix Stripe — optionnel, sans lui le paiement en ligne n'est pas actif</label>
                <input name="stripe_price_id" defaultValue={e.stripe_price_id ?? ''} placeholder="price_..." />
                <button type="submit">Enregistrer les modifications</button>
              </form>
            </details>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {e.actif ? (
                <form action={desactiverEvenement}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid #666', background: 'none', color: '#ccc', cursor: 'pointer' }}>
                    Masquer du site
                  </button>
                </form>
              ) : (
                <form action={reactiverEvenement}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid #4a4', background: 'none', color: '#8f8', cursor: 'pointer' }}>
                    Réafficher sur le site
                  </button>
                </form>
              )}
              <details>
                <summary style={{ fontSize: 12, cursor: 'pointer', color: '#f88' }}>🗑️ Supprimer définitivement</summary>
                <form action={supprimerEvenement} style={{ marginTop: 6 }}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #a44', background: 'none', color: '#f88', cursor: 'pointer' }}>
                    Confirmer la suppression
                  </button>
                </form>
              </details>
            </div>
          </details>
          );
        })}
      </section>
    </main>
  );
}
