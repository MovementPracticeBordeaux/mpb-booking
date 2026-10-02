'use client';

import { useState } from 'react';

// Rangée de boutons d'action en haut d'une page admin : un seul panneau
// ouvert à la fois, tout est replié par défaut pour laisser la place au
// contenu principal.
export default function PanneauxActions({ panneaux }: { panneaux: { id: string; libelle: string; contenu: React.ReactNode }[] }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const actif = panneaux.find((p) => p.id === ouvert);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {panneaux.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOuvert(ouvert === p.id ? null : p.id)}
            style={{
              fontSize: 14, fontWeight: 600, padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid #FF2D78', color: ouvert === p.id ? 'white' : '#FF2D78',
              background: ouvert === p.id ? '#FF2D78' : 'none',
            }}
          >
            {ouvert === p.id ? '× ' : '+ '}
            {p.libelle}
          </button>
        ))}
      </div>
      {actif && <div style={{ marginTop: 16 }}>{actif.contenu}</div>}
    </div>
  );
}
