'use client';

import { useState } from 'react';
import { COULEURS } from '@/lib/theme';

type Ligne = { description: string; prix: string };
type Eleve = { nom: string | null; email: string | null };

export default function FormulaireFactureManuelle({
  creerFactureManuelle,
  eleves,
}: {
  creerFactureManuelle: (formData: FormData) => void;
  eleves: Eleve[];
}) {
  const [lignes, setLignes] = useState<Ligne[]>([{ description: '', prix: '' }]);
  const [nomClient, setNomClient] = useState('');
  const [emailClient, setEmailClient] = useState('');

  const total = lignes.reduce((somme, l) => somme + (parseFloat(l.prix) || 0), 0);

  function modifierLigne(i: number, champ: keyof Ligne, valeur: string) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, [champ]: valeur } : l)));
  }

  function ajouterLigne() {
    setLignes((prev) => [...prev, { description: '', prix: '' }]);
  }

  function retirerLigne(i: number) {
    setLignes((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Si le nom saisi correspond exactement à un élève connu (choisi dans la
  // liste suggérée), on pré-remplit son email automatiquement — mais on ne
  // force rien, l'admin peut toujours corriger ou taper autre chose à la main.
  function surChangementNom(valeur: string) {
    setNomClient(valeur);
    const correspondance = eleves.find((e) => e.nom === valeur);
    if (correspondance?.email) setEmailClient(correspondance.email);
  }

  function surSoumission(formData: FormData) {
    const lignesValides = lignes
      .filter((l) => l.description.trim() && parseFloat(l.prix) > 0)
      .map((l) => ({ description: l.description.trim(), prix: parseFloat(l.prix) }));
    formData.set('lignes', JSON.stringify(lignesValides));
    creerFactureManuelle(formData);
  }

  const champStyle: React.CSSProperties = {
    background: COULEURS.surfaceForte,
    border: `1px solid ${COULEURS.bordure}`,
    borderRadius: 6,
    padding: '8px 10px',
    color: COULEURS.texte,
    fontSize: 13,
    fontFamily: 'inherit',
  };

  return (
    <form action={surSoumission} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
      <input
        name="nom_client"
        placeholder="Nom du client"
        list="suggestions-noms-eleves"
        value={nomClient}
        onChange={(e) => surChangementNom(e.target.value)}
        required
        style={champStyle}
      />
      <input
        name="email_client"
        type="email"
        placeholder="Email (pour l'envoi par email)"
        list="suggestions-emails-eleves"
        value={emailClient}
        onChange={(e) => setEmailClient(e.target.value)}
        style={champStyle}
      />
      {/* Listes de suggestion natives du navigateur : proposent les élèves déjà
          référencés sur le site, sans jamais empêcher de taper un nom ou un
          email libre pour quelqu'un qui n'a pas de compte. */}
      <datalist id="suggestions-noms-eleves">
        {eleves.filter((e) => e.nom).map((e) => <option key={e.email} value={e.nom!} />)}
      </datalist>
      <datalist id="suggestions-emails-eleves">
        {eleves.filter((e) => e.email).map((e) => <option key={e.email} value={e.email!} />)}
      </datalist>
      <input name="telephone_client" placeholder="Téléphone (pour l'envoi par WhatsApp, ex. 0612345678)" style={champStyle} />

      <p style={{ fontSize: 12, opacity: 0.7, margin: '6px 0 0' }}>Prestations</p>
      {lignes.map((ligne, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            placeholder="Description (ex. Atelier calisthenics 2h)"
            value={ligne.description}
            onChange={(e) => modifierLigne(i, 'description', e.target.value)}
            style={{ ...champStyle, flex: 1 }}
          />
          <input
            type="number" min="0" step="0.01" placeholder="Prix €"
            value={ligne.prix}
            onChange={(e) => modifierLigne(i, 'prix', e.target.value)}
            style={{ ...champStyle, width: 90 }}
          />
          {lignes.length > 1 && (
            <button type="button" onClick={() => retirerLigne(i)} style={{ background: 'none', border: 'none', color: '#f88', cursor: 'pointer', fontSize: 16, padding: 4 }}>
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={ajouterLigne} style={{ alignSelf: 'flex-start', background: 'none', border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '5px 12px', color: COULEURS.texteAtt, fontSize: 12, cursor: 'pointer' }}>
        + Ajouter une ligne
      </button>

      <p style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 0' }}>Total : {total.toFixed(2)} €</p>

      <button type="submit" style={{ background: '#f0a', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
        Créer la facture
      </button>
    </form>
  );
}
