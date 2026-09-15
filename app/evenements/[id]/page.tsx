import { supabaseAdmin, supabaseServer } from '@/lib/supabase-server';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { notFound } from 'next/navigation';
import BoutonPayerEvenement from '../BoutonPayerEvenement';

export const dynamic = 'force-dynamic';

export default async function EvenementDetailPage({ params }: { params: { id: string } }) {
  const admin = supabaseAdmin();
  const { data: e } = await admin
    .from('evenements')
    .select('*')
    .eq('id', params.id)
    .eq('actif', true)
    .maybeSingle();

  if (!e) notFound();

  // Tarif abonné (-50%) : tout élève ayant un abonnement actif, sauf le
  // cours découverte (qui n'est pas vraiment un statut d'abonné). Le
  // vrai contrôle qui compte se fait côté serveur dans la route de
  // paiement — cet indicateur ici ne sert qu'à l'affichage du prix.
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let estAbonne = false;
  if (user) {
    const { count } = await admin
      .from('abonnements')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', user.id)
      .eq('abonnement_actif', true)
      .neq('formule_nom', 'cours_decouverte');
    estAbonne = (count ?? 0) > 0;
  }
  const prixAffiche = estAbonne ? e.prix / 2 : e.prix;

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <a href="/evenements" style={{ fontSize: 13, color: COULEURS.texteAtt, textDecoration: 'none' }}>← Tous les événements</a>

      <p style={{ fontSize: 12, color: '#f0a', fontWeight: 700, letterSpacing: 0.5, margin: '16px 0 6px', textTransform: 'uppercase' }}>
        {new Date(e.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 style={{ fontFamily: POLICE_DISPLAY, letterSpacing: 0.5, margin: '0 0 16px' }}>{e.titre}</h1>

      <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 16, padding: 20, marginBottom: 20, background: COULEURS.surface }}>
        <p style={{ fontSize: 14, margin: '0 0 8px' }}>
          🕐 {new Date(e.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} –{' '}
          {new Date(e.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p style={{ fontSize: 14, margin: '0 0 8px' }}>📍 {e.lieu}</p>
        {estAbonne ? (
          <p style={{ margin: 0 }}>
            <span style={{ fontSize: 14, opacity: 0.5, textDecoration: 'line-through', marginRight: 8 }}>{e.prix} €</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{prixAffiche.toFixed(2)} €</span>
            <span style={{ fontSize: 12, color: '#f0a', fontWeight: 700, marginLeft: 8 }}>-50% tarif abonné</span>
          </p>
        ) : (
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{e.prix} €</p>
        )}
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 28 }}>{e.description}</p>

      {e.stripe_price_id ? (
        <BoutonPayerEvenement evenementId={e.id} prix={prixAffiche} />
      ) : (
        <a
          href={`https://wa.me/33620477064?text=${encodeURIComponent(`Bonjour, je souhaite réserver ma place pour "${e.titre}" le ${new Date(e.date_debut).toLocaleDateString('fr-FR')} (${prixAffiche} €).`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', padding: '14px 20px', borderRadius: 12,
            background: '#25D366', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}
        >
          💬 Réserver ma place sur WhatsApp
        </a>
      )}
    </main>
  );
}
