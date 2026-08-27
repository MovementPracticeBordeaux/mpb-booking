import { supabaseAdmin } from '@/lib/supabase-server';
import { creerFactureManuelle, envoyerFactureEmail } from '../actions';
import FormulaireFactureManuelle from './FormulaireFactureManuelle';

export const dynamic = 'force-dynamic';

// Construit un lien WhatsApp pré-rempli (pas d'envoi automatique : ouvre
// WhatsApp avec le message déjà écrit, prêt à être vérifié puis envoyé).
function lienWhatsApp(telephone: string, message: string): string {
  const numero = telephone.replace(/[^0-9+]/g, '').replace(/^0/, '33'); // suppose un numéro français
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

export default async function AdminFacturesPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();
  const { data: factures } = await admin
    .from('factures_manuelles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Factures</h1>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Pour les prestations hors catalogue (interventions à l'extérieur, ateliers ponctuels...). Renseigne au moins
        un email ou un téléphone pour pouvoir l'envoyer ensuite.
      </p>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>⚠️ {searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a3a1a', color: '#b4ffb4', padding: 12, borderRadius: 8 }}>✓ {searchParams.succes}</p>
      )}

      <section style={{ marginBottom: 32 }}>
        <FormulaireFactureManuelle creerFactureManuelle={creerFactureManuelle} />
      </section>

      <section>
        <h2>Factures créées</h2>
        {(factures ?? []).length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Aucune facture pour le moment.</p>}
        {(factures ?? []).map((f) => {
          const lien = `${process.env.NEXT_PUBLIC_SITE_URL}/facture-externe/${f.id}`;
          const messageWhatsApp = `Bonjour ${f.nom_client}, voici ta facture Movement Practice Bordeaux (${Number(f.total).toFixed(2)} €) : ${lien}`;
          return (
            <details key={f.id} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
              <summary style={{ fontSize: 13, cursor: 'pointer' }}>
                {new Date(f.created_at).toLocaleDateString('fr-FR')} · {f.nom_client} · {Number(f.total).toFixed(2)} €
                {f.envoyee_le && ' · ✓ envoyée'}
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <a href={lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#f0a' }}>
                  Voir la facture ↗
                </a>
                {f.email_client && (
                  <form action={envoyerFactureEmail}>
                    <input type="hidden" name="facture_id" value={f.id} />
                    <button type="submit" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid #333', background: 'none', color: 'inherit', cursor: 'pointer' }}>
                      Envoyer par email
                    </button>
                  </form>
                )}
                {f.telephone_client && (
                  <a
                    href={lienWhatsApp(f.telephone_client, messageWhatsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: '1px solid #333', color: 'inherit', textDecoration: 'none' }}
                  >
                    Envoyer par WhatsApp
                  </a>
                )}
              </div>
            </details>
          );
        })}
      </section>
    </main>
  );
}
