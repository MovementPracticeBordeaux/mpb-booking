'use client';

// Retour « à retravailler » : réponses types à insérer d'un geste dans le
// commentaire (modifiable avant envoi). Les réponses déjà écrites par Sylvain
// passent en premier ; les modèles généraux viennent ensuite.

import { useState } from 'react';
import { COULEURS } from '@/lib/theme';

export default function FormulaireRefus({ action, eleveId, moduleId, reponses }: {
  action: (formData: FormData) => void | Promise<void>;
  eleveId: string;
  moduleId: string;
  reponses: string[];
}) {
  const [commentaire, setCommentaire] = useState('');
  const champ: React.CSSProperties = { fontSize: 13, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, fontFamily: 'inherit', boxSizing: 'border-box' };

  function inserer(texte: string) {
    setCommentaire((c) => (c.trim() ? `${c.trim()} ${texte}` : texte));
  }

  return (
    <form action={action} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input type="hidden" name="eleve_id" value={eleveId} />
      <input type="hidden" name="module_id" value={moduleId} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {reponses.map((r) => (
          <button key={r} type="button" onClick={() => inserer(r)} title={r} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer', fontFamily: 'inherit', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            + {r.length > 60 ? `${r.slice(0, 58)}…` : r}
          </button>
        ))}
      </div>
      <textarea name="commentaire" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} placeholder="Ce qu'il faut retravailler..." style={{ ...champ, width: '100%', resize: 'vertical', lineHeight: 1.5 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="text" name="theme" placeholder="Thème qui coince (optionnel)" style={{ ...champ, flexGrow: 1, minWidth: 160 }} />
        <button type="submit" style={{ fontSize: 13, padding: '8px 16px', borderRadius: 999, border: '1px solid #ff6b6b', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontFamily: 'inherit' }}>
          Envoyer le retour
        </button>
      </div>
    </form>
  );
}
