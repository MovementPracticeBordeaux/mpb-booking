'use client';

import { useState } from 'react';
import { GRADIENT } from '@/lib/theme';

export default function BoutonPayerMentorat({ formuleNom }: { formuleNom: string }) {
  const [etat, setEtat] = useState<'pret' | 'envoi'>('pret');
  const [erreur, setErreur] = useState<string | null>(null);

  async function payer() {
    setEtat('envoi');
    setErreur(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formule_nom: formuleNom, retour: 'profil', depart: 'aujourdhui' }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setErreur(data.error ?? 'Une erreur est survenue, réessaie.');
    } catch {
      setErreur('Connexion impossible, réessaie.');
    }
    setEtat('pret');
  }

  return (
    <>
      <button type="button" onClick={payer} disabled={etat === 'envoi'}
        style={{ width: '100%', background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '11px 18px', fontWeight: 600, fontSize: 14, cursor: etat === 'envoi' ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
        {etat === 'envoi' ? 'Redirection…' : 'Choisir et payer'}
      </button>
      {erreur && <p style={{ fontSize: 12, color: '#ff6b6b', margin: '8px 0 0' }}>{erreur}</p>}
    </>
  );
}
