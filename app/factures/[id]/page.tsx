import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { ENTREPRISE } from '@/lib/entreprise';
import { redirect, notFound } from 'next/navigation';
import BoutonImprimer from '../BoutonImprimer';

export default async function FacturePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: paiement } = await supabase
    .from('paiements')
    .select('*, profiles!paiements_eleve_id_fkey(nom, email)')
    .eq('id', params.id)
    .single();

  if (!paiement) notFound();
  // Un élève ne peut voir que sa propre facture (les policies RLS l'empêchent déjà,
  // mais on double-vérifie ici pour un message clair)
  if (paiement.eleve_id !== user.id) {
    return <main style={{ padding: 20 }}>Cette facture ne t'appartient pas.</main>;
  }

  const formule = FORMULES[paiement.formule_nom];
  const numeroFacture = `MPB-${new Date(paiement.created_at).getFullYear()}-${paiement.id.slice(0, 8).toUpperCase()}`;

  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{ENTREPRISE.nom}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>{ENTREPRISE.adresse}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#555' }}>SIRET : {ENTREPRISE.siret}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{ENTREPRISE.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Facture</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>N° {numeroFacture}</p>
            <p style={{ margin: 0, fontSize: 13 }}>{new Date(paiement.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>Facturé à</p>
          <p style={{ margin: '2px 0 0' }}>{paiement.profiles?.nom ?? paiement.profiles?.email}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111', textAlign: 'left' }}>
              <th style={{ padding: '8px 0' }}>Désignation</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0' }}>{formule?.nom ?? paiement.formule_nom}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{paiement.montant.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginBottom: 32 }}>
          <p style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>Total : {paiement.montant.toFixed(2)} €</p>
          <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0' }}>{ENTREPRISE.mentionTva}</p>
        </div>

        <BoutonImprimer />
      </main>
    </div>
  );
}
