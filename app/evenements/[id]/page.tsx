import { supabaseAdmin } from '@/lib/supabase-server';
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

  const messageWhatsApp = `Bonjour, j'ai une question sur "${e.titre}" le ${new Date(e.date_debut).toLocaleDateString('fr-FR')}.`;

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
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{e.prix} €</p>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 28 }}>{e.description}</p>

      {e.stripe_price_id ? (
        <>
          <BoutonPayerEvenement evenementId={e.id} prix={e.prix} />
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', marginTop: 10 }}>
            Une question avant de réserver ?{' '}
            <a href={`https://wa.me/33620477064?text=${encodeURIComponent(messageWhatsApp)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#f0a' }}>
              Contacte Sylvain sur WhatsApp
            </a>
          </p>
        </>
      ) : (
        <a
          href={`https://wa.me/33620477064?text=${encodeURIComponent(`Bonjour, je souhaite réserver ma place pour "${e.titre}" le ${new Date(e.date_debut).toLocaleDateString('fr-FR')} (${e.prix} €).`)}`}
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
