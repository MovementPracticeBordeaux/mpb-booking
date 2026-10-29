'use client';

// Briques communes aux deux journaux (journal complet et journal d'un nœud) :
// - un éditeur qui laisse choisir entre une note en texte libre et une liste
//   de points (un point = une ligne en base, format = 'liste') ;
// - le rendu d'une note selon son format.

import { useRef } from 'react';
import { COULEURS } from '@/lib/theme';

import type { FormatNote } from './noteJournalFormat';
export type { FormatNote } from './noteJournalFormat';

export { encoderNote, decoderNote } from './noteJournalFormat';

export function pointsDepuisContenu(contenu: string): string[] {
  return contenu.split('\n').map((l) => l.trim()).filter(Boolean);
}

export function RenduNote({ contenu, format, taille = 14, couleur = COULEURS.texte }: { contenu: string; format?: string | null; taille?: number; couleur?: string }) {
  if (format === 'liste') {
    return (
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {pointsDepuisContenu(contenu).map((p, i) => (
          <li key={i} style={{ fontSize: taille, color: couleur, lineHeight: 1.45 }}>{p}</li>
        ))}
      </ul>
    );
  }
  return <p style={{ fontSize: taille, color: couleur, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{contenu}</p>;
}

// Contenu prêt à enregistrer (texte nettoyé, ou points non vides joints par
// des retours à la ligne). Chaîne vide = rien à enregistrer.
export function contenuAEnregistrer(format: FormatNote, texte: string, points: string[]): string {
  if (format === 'liste') return points.map((p) => p.trim()).filter(Boolean).join('\n');
  return texte.trim();
}

export function EditeurNote({
  format, setFormat, texte, setTexte, points, setPoints, lignesTexte = 6, placeholder,
}: {
  format: FormatNote;
  setFormat: (f: FormatNote) => void;
  texte: string;
  setTexte: (t: string) => void;
  points: string[];
  setPoints: (p: string[]) => void;
  lignesTexte?: number;
  placeholder?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit' };

  // Passer d'un format à l'autre conserve ce qui a déjà été écrit.
  function changerFormat(f: FormatNote) {
    if (f === format) return;
    if (f === 'liste') {
      const lignes = pointsDepuisContenu(texte);
      setPoints(lignes.length > 0 ? lignes : ['']);
    } else {
      setTexte(points.filter((p) => p.trim()).join('\n'));
    }
    setFormat(f);
  }

  function modifierPoint(i: number, valeur: string) {
    setPoints(points.map((p, j) => (j === i ? valeur : p)));
  }
  function ajouterPoint(apres: number) {
    const suivants = [...points.slice(0, apres + 1), '', ...points.slice(apres + 1)];
    setPoints(suivants);
    requestAnimationFrame(() => refs.current[apres + 1]?.focus());
  }
  function retirerPoint(i: number) {
    const restants = points.filter((_, j) => j !== i);
    setPoints(restants.length > 0 ? restants : ['']);
    requestAnimationFrame(() => refs.current[Math.max(0, i - 1)]?.focus());
  }

  const bouton = (actif: boolean): React.CSSProperties => ({
    flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${actif ? '#f0a' : COULEURS.bordure}`, background: actif ? 'rgba(255,0,170,0.12)' : 'transparent',
    color: actif ? '#f0a' : COULEURS.texteFaible, fontWeight: actif ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Format de la note">
        <button type="button" onClick={() => changerFormat('texte')} style={bouton(format === 'texte')}>Texte libre</button>
        <button type="button" onClick={() => changerFormat('liste')} style={bouton(format === 'liste')}>Liste de points</button>
      </div>

      {format === 'texte' ? (
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={lignesTexte}
          placeholder={placeholder ?? "Ex. : 3 tractions strictes aujourd'hui, ressenti correct, encore un peu de tremblement en fin de série."}
          style={{ ...champ, resize: 'vertical', lineHeight: 1.5 }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {points.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#f0a', fontSize: 16, flexShrink: 0, width: 12, textAlign: 'center' }}>•</span>
              <input
                ref={(el) => { refs.current[i] = el; }}
                value={p}
                onChange={(e) => modifierPoint(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); ajouterPoint(i); }
                  if (e.key === 'Backspace' && p === '' && points.length > 1) { e.preventDefault(); retirerPoint(i); }
                }}
                placeholder={i === 0 ? 'Premier point (Entrée pour passer au suivant)' : 'Point suivant'}
                style={{ ...champ, padding: '8px 10px' }}
              />
              {points.length > 1 && (
                <button type="button" onClick={() => retirerPoint(i)} aria-label="Retirer ce point" style={{ flexShrink: 0, background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => ajouterPoint(points.length - 1)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#f0a', cursor: 'pointer', fontSize: 13, padding: '2px 0', fontFamily: 'inherit' }}>
            + Ajouter un point
          </button>
        </div>
      )}
    </div>
  );
}
