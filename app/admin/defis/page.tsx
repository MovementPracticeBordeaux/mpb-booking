import { supabaseAdmin } from '@/lib/supabase-server';
import { creerDefiMensuel, supprimerDefiMensuel } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminDefisPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();
  const { data: defis } = await admin
    .from('defis_mensuels')
    .select('*')
    .order('created_at', { ascending: false });

  const defiActuel = defis?.[0] ?? null;

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Défi du mois</h1>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Un seul défi partagé par tous les élèves ayant un abonnement actif, quel que soit leur forfait. L'envoi de la
        vidéo se fait par WhatsApp comme d'habitude — cette page sert juste à publier et changer le défi affiché sur
        leur profil.
      </p>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>⚠️ {searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>✅ {searchParams.succes}</p>
      )}

      {defiActuel && (
        <div style={{ border: '1px solid #f0a', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, margin: '0 0 6px', textTransform: 'uppercase' }}>
            Défi actuellement affiché
          </p>
          <h3 style={{ margin: '0 0 6px' }}>{defiActuel.titre}</h3>
          <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{defiActuel.description}</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>Publié le {new Date(defiActuel.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Publier un nouveau défi</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>Remplace immédiatement celui affiché sur le profil des élèves.</p>
        <form action={creerDefiMensuel} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
          <input name="titre" placeholder="Titre (ex. Dead hang 90 secondes)" required />
          <textarea
            name="description"
            placeholder="Description (consignes, comment envoyer la preuve...)"
            rows={4}
            required
            style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }}
          />
          <button type="submit">Publier ce défi</button>
        </form>
      </section>

      <section>
        <h2>Historique</h2>
        {(defis ?? []).length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Aucun défi publié pour le moment.</p>}
        {(defis ?? []).map((d, i) => (
          <details key={d.id} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>
              {new Date(d.created_at).toLocaleDateString('fr-FR')} · {d.titre}
              {i === 0 && ' · (actuel)'}
            </summary>
            <p style={{ fontSize: 13, opacity: 0.8, margin: '8px 0', whiteSpace: 'pre-wrap' }}>{d.description}</p>
            {i !== 0 && (
              <form action={supprimerDefiMensuel}>
                <input type="hidden" name="defi_id" value={d.id} />
                <button type="submit" style={{ fontSize: 12, color: '#f88' }}>Supprimer de l'historique</button>
              </form>
            )}
          </details>
        ))}
      </section>
    </main>
  );
}
