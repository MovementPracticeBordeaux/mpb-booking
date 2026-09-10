'use client';

import { useState } from 'react';

export default function BoutonPayerEvenement({ evenementId, prix }: { evenementId: string; prix: number }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function payer() {
    setEnCours(true);
    setErreur('');
    try {
      const res = await fetch('/api/stripe/checkout-evenement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evenement_id: evenementId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErreur(data.error ?? "Impossible de lancer le paiement, réessaie dans un instant.");
        setEnCours(false);
      }
    } catch {
      setErreur('Une erreur est survenue, réessaie dans un instant.');
      setEnCours(false);
    }
  }

  return (
    <div>
      <button
        onClick={payer}
        disabled={enCours}
        style={{
          display: 'block', width: '100%', textAlign: 'center', padding: '14px 20px', borderRadius: 12,
          background: 'linear-gradient(90deg, #FF3B30, #FF8A00, #FF2D78, #8B5CF6)', border: 'none',
          color: 'white', fontWeight: 700, fontSize: 15, cursor: enCours ? 'default' : 'pointer', opacity: enCours ? 0.7 : 1,
        }}
      >
        {enCours ? 'Redirection vers le paiement...' : `Réserver ma place — ${prix} €`}
      </button>
      {erreur && <p style={{ color: '#f88', fontSize: 13, marginTop: 8 }}>{erreur}</p>}
    </div>
  );
}
