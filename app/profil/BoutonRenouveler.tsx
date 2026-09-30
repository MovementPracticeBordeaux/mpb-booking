'use client';

import { useState } from 'react';

type Depart = 'aujourdhui' | 'suite';

// choix : proposé uniquement pour les formules à nombre de séances (voir le
// profil) — l'élève décide si la nouvelle période démarre tout de suite ou
// à la suite de l'actuelle. Sans choix : toujours à la suite.
export default function BoutonRenouveler({
  formuleNom,
  prix,
  choix,
}: {
  formuleNom: string;
  prix: number;
  choix: { finAujourdhui: string; finSuite: string } | null;
}) {
  const [depart, setDepart] = useState<Depart>('aujourdhui');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function renouveler() {
    setEnCours(true);
    setErreur('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formule_nom: formuleNom, retour: 'profil', depart: choix ? depart : 'suite' }),
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

  const option = (valeur: Depart, titre: string, detail: string) => (
    <label
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${depart === valeur ? '#FF2D78' : 'rgba(255,255,255,0.15)'}`,
        background: depart === valeur ? 'rgba(255,45,120,0.08)' : 'transparent',
      }}
    >
      <input type="radio" name={`depart-${formuleNom}`} checked={depart === valeur} onChange={() => setDepart(valeur)} style={{ marginTop: 3 }} />
      <span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{titre}</span>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.75 }}>{detail}</span>
      </span>
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {choix && (
        <>
          {option('aujourdhui', 'Démarrer aujourd’hui', `Valable jusqu’au ${choix.finAujourdhui}`)}
          {option('suite', 'À la suite de ma formule actuelle', `Valable jusqu’au ${choix.finSuite}`)}
        </>
      )}
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
