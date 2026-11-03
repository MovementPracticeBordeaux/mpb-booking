'use client';

import { useState } from 'react';

type Option = { cle: string; libelle: string; montant: number };

export default function FormReglementSeances({ action, eleveId, options, formuleParDefaut }: {
  action: (fd: FormData) => void;
  eleveId: string;
  options: Option[];
  formuleParDefaut: string;
}) {
  const [formule, setFormule] = useState(formuleParDefaut);
  const [montant, setMontant] = useState(String(options.find((o) => o.cle === formuleParDefaut)?.montant ?? ''));
  const champ = { padding: '8px 10px', borderRadius: 8, border: '1px solid #2a2a30', background: '#1a1a1e', color: '#eee', fontSize: 14 };

  return (
    <form action={action} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input type="hidden" name="eleve_id" value={eleveId} />
      <select
        name="formule_nom"
        value={formule}
        onChange={(e) => {
          setFormule(e.target.value);
          setMontant(String(options.find((o) => o.cle === e.target.value)?.montant ?? ''));
        }}
      >
        {options.map((o) => <option key={o.cle} value={o.cle}>{o.libelle}</option>)}
      </select>
      <select name="moyen_paiement" defaultValue="especes">
        <option value="especes">💶 Espèces</option>
        <option value="virement">🏦 Virement</option>
        <option value="carte">💳 Carte (TPE)</option>
        <option value="offert">🎁 Offert</option>
      </select>
      <input type="number" name="montant" step="0.01" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} style={{ ...champ, width: 80 }} />
      <button type="submit">Encaissé</button>
    </form>
  );
}
