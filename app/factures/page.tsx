import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FacturesPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: paiements } = await supabase
    .from('paiements')
    .select('*')
    .eq('eleve_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mes factures</h1>
      {(!paiements || paiements.length === 0) && <p>Aucun paiement enregistré pour le moment.</p>}
      {(paiements ?? []).map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 8,
          }}
        >
          <div>
            <p style={{ margin: 0 }}>{FORMULES[p.formule_nom]?.nom ?? p.formule_nom}</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
              {new Date(p.created_at).toLocaleDateString('fr-FR')} · {p.montant.toFixed(2)} €
            </p>
          </div>
          <a href={`/factures/${p.id}`} style={{ color: '#f0a' }}>Voir la facture</a>
        </div>
      ))}
    </main>
  );
}
