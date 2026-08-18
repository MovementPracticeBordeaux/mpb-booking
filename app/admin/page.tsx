import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = supabaseAdmin();

  // Un élève peut avoir plusieurs abonnements actifs à la fois (une
  // catégorie chacun) — ces compteurs comptent des ABONNEMENTS, pas des
  // élèves distincts (un élève avec collectif + mentorat compte dans les
  // deux catégories).
  const { data: abonnements } = await admin.from('abonnements').select('categorie, gele').eq('abonnement_actif', true);

  const nbAbonnementsActifs = (abonnements ?? []).length;
  const nbActifsCollectif = (abonnements ?? []).filter((a) => a.categorie === 'planning').length;
  const nbActifsCoaching = (abonnements ?? []).filter((a) => a.categorie === 'coaching').length;
  const nbActifsMentorat = (abonnements ?? []).filter((a) => a.categorie === 'mentorat').length;
  const nbGeles = (abonnements ?? []).filter((a) => a.gele).length;

  const { count: soumissionsMentorshipEnAttente } = await admin
    .from('mentorship_progression')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'en_attente');

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Vue d'ensemble</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbAbonnementsActifs}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>abonnements actifs</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsCollectif}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>sur cours collectifs</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsCoaching}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>coaching individuel</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsMentorat}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>mentorat</p>
        </div>
        {nbGeles > 0 && (
          <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbGeles}</p>
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>pass gelés</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a
          href="/admin/planning"
          style={{ display: 'block', border: '1px solid #333', borderRadius: 10, padding: 16, textDecoration: 'none', color: 'inherit' }}
        >
          <strong>📅 Planning collectif</strong>
          <p style={{ fontSize: 13, opacity: 0.7, margin: '4px 0 0' }}>Semaine de référence, vacances, créneaux.</p>
        </a>
        <a
          href="/admin/eleves"
          style={{ display: 'block', border: '1px solid #333', borderRadius: 10, padding: 16, textDecoration: 'none', color: 'inherit' }}
        >
          <strong>👥 Élèves & paiements</strong>
          <p style={{ fontSize: 13, opacity: 0.7, margin: '4px 0 0' }}>Formules, quotas, gel de pass, remboursements.</p>
        </a>
        <a
          href="/admin/mentorship"
          style={{ display: 'block', border: '1px solid #333', borderRadius: 10, padding: 16, textDecoration: 'none', color: 'inherit' }}
        >
          <strong>📹 Mentorship</strong>
          <p style={{ fontSize: 13, opacity: 0.7, margin: '4px 0 0' }}>
            Valider les vidéos soumises par les élèves.
            {soumissionsMentorshipEnAttente ? ` — ${soumissionsMentorshipEnAttente} en attente` : ''}
          </p>
        </a>
        <a
          href="/admin/statistiques"
          style={{ display: 'block', border: '1px solid #333', borderRadius: 10, padding: 16, textDecoration: 'none', color: 'inherit' }}
        >
          <strong>📊 Statistiques</strong>
          <p style={{ fontSize: 13, opacity: 0.7, margin: '4px 0 0' }}>Revenus, fréquentation, historique Wix.</p>
        </a>
      </div>
    </main>
  );
}
