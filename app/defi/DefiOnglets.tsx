'use client';

import { useState } from 'react';

export default function DefiOnglets({
  ongletDefi,
  ongletClassement,
}: {
  ongletDefi: React.ReactNode;
  ongletClassement: React.ReactNode;
}) {
  const [actif, setActif] = useState<'defi' | 'classement'>('defi');

  const boutonStyle = (onglet: 'defi' | 'classement'): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    borderBottom: actif === onglet ? '2px solid #f0a' : '2px solid #333',
    background: 'none',
    color: actif === onglet ? '#f0a' : 'inherit',
    opacity: actif === onglet ? 1 : 0.6,
  });

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 20 }}>
        <button type="button" onClick={() => setActif('defi')} style={boutonStyle('defi')}>
          🏆 Défi du mois
        </button>
        <button type="button" onClick={() => setActif('classement')} style={boutonStyle('classement')}>
          🌟 Classement total
        </button>
      </div>
      {actif === 'defi' ? ongletDefi : ongletClassement}
    </div>
  );
}
