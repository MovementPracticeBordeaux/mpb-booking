'use client';

// Révision espacée : une question de QCM déjà passé revient sur l'accueil,
// une par jour. La correction se fait côté serveur (repondreRevision) ;
// une bonne réponse espace la question, une erreur la ramène au lendemain.

import { useState, useTransition } from 'react';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { repondreRevision } from './actions';

export type QuestionRevision = { id: string; question: string; choix: string[]; libelleNiveau: string; couleur: string };

export default function RevisionDuJour({ question, faiteAujourdhui, carte, onRelire }: {
  question: QuestionRevision | null;
  faiteAujourdhui: boolean;
  carte: React.CSSProperties;
  onRelire?: () => void;
}) {
  const [choisi, setChoisi] = useState<number | null>(null);
  const [resultat, setResultat] = useState<{ juste: boolean; bonneReponse: number; prochaineDansJours: number } | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!question) {
    if (!faiteAujourdhui) return null;
    return (
      <div style={carte}>
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>Révision du jour</p>
        <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: 0 }}>✓ Faite pour aujourd'hui. La prochaine question arrive demain.</p>
      </div>
    );
  }

  function repondre(index: number) {
    if (resultat || enCours || !question) return;
    setChoisi(index);
    demarrer(async () => {
      const r = await repondreRevision(question.id, index);
      if (r.ok) setResultat({ juste: r.juste, bonneReponse: r.bonneReponse, prochaineDansJours: r.prochaineDansJours });
      else setChoisi(null);
    });
  }

  return (
    <div style={{ ...carte, borderLeft: `3px solid ${question.couleur}` }}>
      <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 2px', color: COULEURS.texte }}>Révision du jour</p>
      <p style={{ fontSize: 11, color: question.couleur, letterSpacing: 0.8, fontWeight: 600, margin: '0 0 8px' }}>{question.libelleNiveau.toUpperCase()}</p>
      <p style={{ fontSize: 14, lineHeight: 1.45, color: COULEURS.texte, margin: '0 0 10px', fontWeight: 500 }}>{question.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {question.choix.map((c, i) => {
          const estBonne = resultat?.bonneReponse === i;
          const estErreur = resultat && choisi === i && !resultat.juste;
          const bordure = estBonne ? '#00FF91' : estErreur ? '#ff6b6b' : choisi === i ? question.couleur : COULEURS.bordure;
          return (
            <button
              key={i} type="button" onClick={() => repondre(i)} disabled={!!resultat || enCours}
              style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.45, padding: '9px 12px', borderRadius: 10, border: `1px solid ${bordure}`, background: estBonne ? 'rgba(0,255,145,0.08)' : estErreur ? 'rgba(255,107,107,0.08)' : 'transparent', color: resultat && !estBonne && !estErreur ? COULEURS.texteFaible : COULEURS.texte, cursor: resultat ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {estBonne ? '✓ ' : estErreur ? '✗ ' : ''}{c}
            </button>
          );
        })}
      </div>
      {resultat && (
        <p style={{ fontSize: 12, color: resultat.juste ? '#00FF91' : '#ff6b6b', margin: '10px 0 0', lineHeight: 1.5 }}>
          {resultat.juste
            ? `Juste. Cette question reviendra dans ${resultat.prochaineDansJours} jour${resultat.prochaineDansJours > 1 ? 's' : ''}.`
            : 'Pas cette fois : la bonne réponse est en vert. La question reviendra demain.'}
          {!resultat.juste && onRelire && (
            <> <button type="button" onClick={onRelire} style={{ background: 'none', border: 'none', padding: 0, color: question.couleur, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Relire la théorie →</button></>
          )}
        </p>
      )}
    </div>
  );
}
