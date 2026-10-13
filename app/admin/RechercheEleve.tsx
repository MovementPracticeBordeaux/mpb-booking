'use client';

import { useState } from 'react';
import { COULEURS } from '@/lib/theme';
import { filtrerEleves, type EleveRecherche } from '@/lib/recherche-eleves';

// Champ "Chercher un élève" : aucune liste affichée tant qu'on n'a rien tapé,
// puis quelques suggestions (prénom, nom ou email). L'élève choisi est envoyé
// au formulaire via un champ caché `name`.
export default function RechercheEleve({
  eleves, name, onChoix, exclure, suffixe, taille = 11,
}: {
  eleves: EleveRecherche[];
  name: string;
  onChoix?: (id: string) => void;
  exclure?: string[];
  suffixe?: (id: string) => string;
  taille?: number;
}) {
  const [requete, setRequete] = useState('');
  const [choisi, setChoisi] = useState<EleveRecherche | null>(null);
  const [surligne, setSurligne] = useState(0);
  const suggestions = choisi ? [] : filtrerEleves(eleves, requete, { exclure });

  const choisir = (e: EleveRecherche | null) => {
    setChoisi(e);
    setRequete('');
    setSurligne(0);
    onChoix?.(e?.id ?? '');
  };

  const champ: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', fontSize: taille, padding: '5px 8px', borderRadius: 6,
    border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte,
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <input type="hidden" name={name} value={choisi?.id ?? ''} />
      {choisi ? (
        <div style={{ ...champ, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {choisi.nom ?? choisi.email}{suffixe?.(choisi.id) ?? ''}
          </span>
          <button
            type="button"
            onClick={() => choisir(null)}
            aria-label="Changer d'élève"
            style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', padding: 0, fontSize: taille + 3, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ) : (
        <input
          type="search"
          value={requete}
          placeholder="Chercher un élève…"
          autoComplete="off"
          onChange={(ev) => { setRequete(ev.target.value); setSurligne(0); }}
          onKeyDown={(ev) => {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); setSurligne((i) => Math.min(i + 1, suggestions.length - 1)); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); setSurligne((i) => Math.max(i - 1, 0)); }
            else if (ev.key === 'Enter') { ev.preventDefault(); if (suggestions[surligne]) choisir(suggestions[surligne]); }
            else if (ev.key === 'Escape') setRequete('');
          }}
          style={champ}
        />
      )}

      {!choisi && requete.trim() !== '' && (
        <div
          style={{
            // Affichée dans le flux (pas en surimpression) : le carrousel du
            // planning défile horizontalement et couperait une liste flottante.
            marginTop: 2, background: '#16161a', border: `1px solid ${COULEURS.bordure}`, borderRadius: 6, overflow: 'hidden',
          }}
        >
          {suggestions.length === 0 ? (
            <div style={{ fontSize: taille, padding: '6px 8px', color: COULEURS.texteFaible }}>Aucun élève trouvé</div>
          ) : (
            suggestions.map((e, i) => (
              <button
                key={e.id}
                type="button"
                // onMouseDown plutôt que onClick : la sélection se fait avant que le champ perde le focus.
                onMouseDown={(ev) => { ev.preventDefault(); choisir(e); }}
                onMouseEnter={() => setSurligne(i)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', fontSize: taille, padding: '6px 8px',
                  border: 'none', cursor: 'pointer', color: COULEURS.texte,
                  background: i === surligne ? 'rgba(255,45,120,0.18)' : 'transparent',
                }}
              >
                {e.nom ?? e.email}{suffixe?.(e.id) ?? ''}
                {e.nom && <span style={{ display: 'block', color: COULEURS.texteFaible, fontSize: taille - 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.email}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
