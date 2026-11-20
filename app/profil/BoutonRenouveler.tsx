'use client';

import { useState } from 'react';

// Rachat de la formule actuelle : si elle a encore des séances, la nouvelle
// est mise en attente (voir le webhook Stripe), sinon elle démarre tout de suite.
export default function BoutonRenouveler({
  formuleNom,
  prix,
}: {
  formuleNom: string;
  prix: number;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function renouveler() {
    setEnCours(true);
    setErreur('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formule_nom: formuleNom, retour: 'profil' }),
      });
      const donnees = await res.json();
      if (donnees.url) {
        window.location.href = donnees.url;
        return;
      }
      setErreur(donnees.error ?? 'Impossible de lancer le paiement.');
    } catch {
      setErreur('Impossible de lancer le paiement, vérifie ta connexion.');
    }
    setEnCours(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={renouveler}
        disabled={enCours}
        style={{
          alignSelf: 'flex-start', padding: '10px 16px', minHeight: 44, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(90deg, #FF3B30, #FF8A00, #FF2D78, #8B5CF6)', color: 'white',
          fontWeight: 700, fontSize: 14, opacity: enCours ? 0.7 : 1,
        }}
      >
        {enCours ? 'Redirection...' : `Renouveler — ${prix} €`}
      </button>
      {erreur && <p style={{ color: '#ff8a8a', fontSize: 13, margin: 0 }}>{erreur}</p>}
    </div>
  );
}
