'use client';

import { useState } from 'react';

type Paiement = {
  id: string;
  created_at: string;
  montant: number;
  formule_nom: string;
  origine: string;
  rembourse: boolean;
  email: string | null;
  formuleNom: string;
};

export default function ListePaiementsRepliable({
  paiements,
  rembourserPaiement,
}: {
  paiements: Paiement[];
  rembourserPaiement: (formData: FormData) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');

  const filtres = paiements.filter((p) => {
    const cible = `${p.email ?? ''} ${p.formuleNom}`.toLowerCase();
    return cible.includes(recherche.toLowerCase());
  });

  return (
    <div>
      <button
        onClick={() => setOuvert((o) => !o)}
        style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span>{ouvert ? '▾' : '▸'}</span> Paiements récents ({paiements.length})
      </button>

      {ouvert && (
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="Rechercher un paiement (email, formule)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ width: '100%', maxWidth: 320, marginBottom: 10, padding: '6px 10px', fontSize: 13 }}
          />
          {filtres.length === 0 && <p style={{ fontSize: 13, opacity: 0.6 }}>Aucun paiement ne correspond.</p>}
          {filtres.map((p) => (
            <details key={p.id} style={{ borderBottom: '1px solid #333', padding: 8 }}>
              <summary style={{ fontSize: 13, cursor: 'pointer' }}>
                {new Date(p.created_at).toLocaleDateString('fr-FR')} · {p.email} · {Number(p.montant).toFixed(2)} €
                {p.rembourse && ' · ↩️ remboursé'}
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <span>
                  {p.formuleNom}
                  {' · '}{p.origine === 'manuel' ? 'manuel' : 'Stripe'}
                </span>
                {p.origine === 'stripe' && !p.rembourse && Number(p.montant) > 0 && (
                  <form action={rembourserPaiement}>
                    <input type="hidden" name="paiement_id" value={p.id} />
                    <button type="submit">Rembourser</button>
                  </form>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
