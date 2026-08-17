'use client';

import { useState } from 'react';
import { definirPreferencesNotif } from './push-actions';

export default function EmailPreferences({
  preferencesInitiales,
}: {
  preferencesInitiales: { rappel: boolean; confirmation: boolean };
}) {
  const [rappel, setRappel] = useState(preferencesInitiales.rappel);
  const [confirmation, setConfirmation] = useState(preferencesInitiales.confirmation);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer(type: 'emailRappel' | 'emailConfirmation', valeur: boolean) {
    setErreur(null);
    if (type === 'emailRappel') setRappel(valeur); else setConfirmation(valeur);
    const resultat = await definirPreferencesNotif({ [type]: valeur });
    if (!resultat.ok) {
      if (type === 'emailRappel') setRappel(!valeur); else setConfirmation(!valeur);
      setErreur(resultat.erreur ?? 'Impossible d\'enregistrer cette préférence.');
    }
  }

  return (
    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={rappel} onChange={(e) => basculer('emailRappel', e.target.checked)} />
        Rappels de cours (la veille)
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={confirmation} onChange={(e) => basculer('emailConfirmation', e.target.checked)} />
        Confirmations de réservation
      </label>
      {erreur && <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{erreur}</p>}
    </div>
  );
}
