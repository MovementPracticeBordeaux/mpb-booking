'use client';

import { useState } from 'react';

export default function SelecteurDiscipline({
  disciplinesExistantes,
  valeurInitiale,
}: {
  disciplinesExistantes: string[];
  valeurInitiale?: string;
}) {
  // Si la valeur actuelle (cas d'une modification) ne fait pas partie de
  // la liste connue, on démarre directement en saisie libre pré-remplie
  // plutôt que de la faire disparaître silencieusement.
  const [nouvelle, setNouvelle] = useState(!!valeurInitiale && !disciplinesExistantes.includes(valeurInitiale));

  if (nouvelle) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <input name="discipline" defaultValue={valeurInitiale} placeholder="Nouvelle discipline (ex: Handstand)" required autoFocus style={{ flex: 1 }} />
        <button type="button" onClick={() => setNouvelle(false)} style={{ fontSize: 11 }}>↩</button>
      </div>
    );
  }

  return (
    <select
      name="discipline"
      required
      defaultValue={valeurInitiale ?? ''}
      onChange={(e) => {
        if (e.target.value === '__nouvelle__') setNouvelle(true);
      }}
    >
      <option value="" disabled>-- Choisir une discipline --</option>
      {disciplinesExistantes.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
      <option value="__nouvelle__">+ Nouvelle discipline...</option>
    </select>
  );
}
