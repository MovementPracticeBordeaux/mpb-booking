import { supabaseAdmin } from '@/lib/supabase-server';
import { ENTREPRISE } from '@/lib/entreprise';
import { notFound } from 'next/navigation';
import BoutonImprimer from '../../factures/BoutonImprimer';

export default async function FactureExternePage({ params }: { params: { id: string } }) {
  // Consultation publique par id (le lien fait office de secret, comme un
  // lien de partage classique) : la personne qui reçoit cette facture n'a
  // souvent pas de compte sur le site (intervention ponctuelle à
  // l'extérieur), donc pas d'authentification requise ici.
  const admin = supabaseAdmin();
  const { data: facture } = await admin.from('factures_manuelles').select('*').eq('id', params.id).single();

  if (!facture) notFound();

  const lignes = facture.lignes as { description: string; prix: number }[];
  const numeroFacture = `MPB-${new Date(facture.created_at).getFullYear()}-${facture.id.slice(0, 8).toUpperCase()}`;

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
            <p style={{ margin: 0, fontSize: 13 }}>{new Date(facture.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>Facturé à</p>
          <p style={{ margin: '2px 0 0' }}>{facture.nom_client}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111', textAlign: 'left' }}>
              <th style={{ padding: '8px 0' }}>Désignation</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px 0' }}>{l.description}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{l.prix.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginBottom: 32 }}>
          <p style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>Total : {facture.total.toFixed(2)} €</p>
          <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0' }}>{ENTREPRISE.mentionTva}</p>
        </div>

        <BoutonImprimer />
      </main>
    </div>
  );
}
