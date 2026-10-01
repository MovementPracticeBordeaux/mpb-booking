'use client';

import { useState } from 'react';

// Bandeau affiché en haut de toutes les pages tant qu'un élève a une
// formule attribuée "à régler" : il ne peut pas l'oublier.
export default function RappelReglement({
  reglements,
}: {
  reglements: { paiementId: string; formule: string; prixEnLigne: number; prixEspeces: number; enLigne: boolean }[];
}) {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');

  async function payer(paiementId: string) {
    setEnCours(paiementId);
    setErreur('');
    try {
      const res = await fetch('/api/stripe/regler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paiement_id: paiementId }),
      });
      const donnees = await res.json();
      if (donnees.url) {
        window.location.href = donnees.url;
        return;
      }
      setErreur(donnees.error ?? 'Paiement impossible pour le moment.');
    } catch {
      setErreur('Paiement impossible, vérifie ta connexion.');
    }
    setEnCours(null);
  }

  return (
    <div style={{ background: 'rgba(255,138,0,0.12)', borderBottom: '1px solid rgba(255,138,0,0.45)', padding: '10px 20px' }}>
      {reglements.map((r) => (
        <div key={r.paiementId} style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <span>
            💳 Ta formule <strong>{r.formule}</strong> est à régler :{' '}
            {r.enLigne ? `${r.prixEnLigne} € en ligne, ou ` : ''}
            <strong>{r.prixEspeces} € en espèces</strong> à Sylvain au prochain cours.
          </span>
          {r.enLigne && (
            <button
              type="button"
              onClick={() => payer(r.paiementId)}
              disabled={enCours === r.paiementId}
              style={{ padding: '7px 14px', borderRadius: 999, border: 'none', background: '#FF8A00', color: '#111', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              {enCours === r.paiementId ? 'Redirection...' : `Payer en ligne (${r.prixEnLigne} €)`}
            </button>
          )}
        </div>
      ))}
      {erreur && <p style={{ maxWidth: 1160, margin: '6px auto 0', color: '#ff8a8a', fontSize: 13 }}>{erreur}</p>}
    </div>
  );
}
