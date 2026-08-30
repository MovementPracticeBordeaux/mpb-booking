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

  // Factures manuelles (interventions extérieures, prestations
  // ponctuelles...) créées par Sylvain avec cette même adresse email —
  // aucun lien technique direct avec le compte (la table ne connaît que
  // l'email en texte libre), on les fait juste correspondre à l'affichage
  // pour que l'élève retrouve tout au même endroit. Lecture publique déjà
  // autorisée par la policy RLS de cette table, pas besoin de droits admin.
  const { data: facturesManuelles } = user.email
    ? await supabase
        .from('factures_manuelles')
        .select('id, total, created_at')
        .ilike('email_client', user.email)
        .order('created_at', { ascending: false })
    : { data: [] };

  type Ligne = { id: string; date: string; libelle: string; montant: number; lien: string };
  const lignes: Ligne[] = [
    ...(paiements ?? []).map((p) => ({
      id: p.id,
      date: p.created_at,
      libelle: FORMULES[p.formule_nom]?.nom ?? p.formule_nom,
      montant: p.montant,
      lien: `/factures/${p.id}`,
    })),
    ...(facturesManuelles ?? []).map((f) => ({
      id: f.id,
      date: f.created_at,
      libelle: 'Prestation Movement Practice Bordeaux',
      montant: Number(f.total),
      lien: `/facture-externe/${f.id}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mes factures</h1>
      {lignes.length === 0 && <p>Aucune facture enregistrée pour le moment.</p>}
      {lignes.map((l) => (
        <div
          key={l.id}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 8,
          }}
        >
          <div>
            <p style={{ margin: 0 }}>{l.libelle}</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
              {new Date(l.date).toLocaleDateString('fr-FR')} · {l.montant.toFixed(2)} €
            </p>
          </div>
          <a href={l.lien} style={{ color: '#f0a' }}>Voir la facture</a>
        </div>
      ))}
    </main>
  );
}
