import { supabaseAdmin } from '@/lib/supabase-server';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Événements & ateliers — Movement Practice Bordeaux',
  description: 'Ateliers et stages ponctuels à Bordeaux, en plus des cours réguliers : handstand, calisthenics, mobilité et plus.',
};

export default async function EvenementsPage() {
  const admin = supabaseAdmin();
  const { data: evenements } = await admin
    .from('evenements')
    .select('id, titre, description, lieu, date_debut, date_fin, prix')
    .eq('actif', true)
    .gte('date_fin', new Date().toISOString())
    .order('date_debut', { ascending: true });

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, letterSpacing: 0.5 }}>Événements</h1>
      <p style={{ fontSize: 14, color: COULEURS.texteAtt, marginBottom: 24 }}>
        Ateliers et stages ponctuels, en plus des cours réguliers.
      </p>

      {(evenements ?? []).length === 0 && (
        <p style={{ fontSize: 14, color: COULEURS.texteFaible }}>Aucun événement prévu pour le moment.</p>
      )}

      {(evenements ?? []).map((e) => (
        <a
          key={e.id}
          href={`/evenements/${e.id}`}
          style={{
            display: 'block', textDecoration: 'none', color: 'inherit',
            border: `1px solid ${COULEURS.bordure}`, borderRadius: 16, padding: 20, marginBottom: 16,
            background: COULEURS.surface,
          }}
        >
          <p style={{ fontSize: 12, color: '#f0a', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
            {new Date(e.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, margin: '0 0 8px', letterSpacing: 0.3 }}>{e.titre}</h2>
          <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '0 0 10px' }}>
            {new Date(e.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} –{' '}
            {new Date(e.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {e.lieu}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{e.prix} €</p>
        </a>
      ))}
    </main>
  );
}
