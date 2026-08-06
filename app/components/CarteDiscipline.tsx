'use client';

import { useState } from 'react';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { COURS_DETAILS } from '@/lib/cours-details';

export default function CarteDiscipline({ nom, icone, desc }: { nom: string; icone: string; desc: string }) {
  const [ouvert, setOuvert] = useState(false);
  const detail = COURS_DETAILS[nom];

  return (
    <button
      onClick={() => setOuvert((o) => !o)}
      aria-expanded={ouvert}
      style={{
        border: `1px solid ${COULEURS.bordure}`,
        background: COULEURS.surface,
        borderRadius: 14,
        padding: 20,
        textAlign: 'center',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        width: '100%',
      }}
    >
      <img src={icone} alt={nom} style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 12 }} />
      <h3 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.5, margin: '0 0 8px' }}>{nom.toUpperCase()}</h3>
      <p style={{ fontSize: 14, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.5 }}>{desc}</p>

      {detail && (
        <p style={{ fontSize: 12, color: '#FF2D78', margin: '10px 0 0', fontWeight: 600 }}>
          {ouvert ? 'Masquer les détails ▲' : 'Voir les détails ▼'}
        </p>
      )}

      {ouvert && detail && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COULEURS.bordure}`, textAlign: 'left' }}>
          <p style={{ fontSize: 12, letterSpacing: 1, color: COULEURS.texteFaible, margin: '0 0 6px' }}>
            INTENSITÉ : {'🟢'.repeat(detail.intensite)}{'⚪'.repeat(5 - detail.intensite)}
          </p>
          <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 8px' }}>
            {detail.description}
          </p>
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: 0 }}>
            {detail.motsCles.join(' · ')}
          </p>
        </div>
      )}
    </button>
  );
}
