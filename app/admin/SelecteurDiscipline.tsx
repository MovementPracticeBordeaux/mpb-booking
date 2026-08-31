'use client';

import { useState } from 'react';

export default function SelecteurDiscipline({ disciplinesExistantes }: { disciplinesExistantes: string[] }) {
  const [nouvelle, setNouvelle] = useState(false);

  if (nouvelle) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <input name="discipline" placeholder="Nouvelle discipline (ex: Handstand)" required autoFocus style={{ flex: 1 }} />
        <button type="button" onClick={() => setNouvelle(false)} style={{ fontSize: 11 }}>↩</button>
      </div>
    );
  }

  return (
    <select
      name="discipline"
      required
      defaultValue=""
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
