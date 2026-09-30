'use client';

import { useState } from 'react';

export default function BoutonRenouveler({ formuleNom, libelle }: { formuleNom: string; libelle: string }) {
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
    <>
      <button
        type="button"
        onClick={renouveler}
        disabled={enCours}
        style={{
          padding: '10px 16px', minHeight: 44, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(90deg, #FF3B30, #FF8A00, #FF2D78, #8B5CF6)', color: 'white',
          fontWeight: 700, fontSize: 14, opacity: enCours ? 0.7 : 1,
        }}
      >
        {enCours ? 'Redirection...' : libelle}
      </button>
      {erreur && <p style={{ color: '#ff8a8a', fontSize: 13, margin: '6px 0 0' }}>{erreur}</p>}
    </>
  );
}
