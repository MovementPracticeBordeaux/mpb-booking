'use client';

// Visite guidée du Mentorat : affichée automatiquement à la première
// ouverture (mémorisée sur l'appareil), relançable avec le bouton « Guide ».
// Chaque étape peut viser un élément de la page (attribut data-guide) : il
// est amené à l'écran et entouré, la bulle d'explication reste en bas.

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';

export const CLE_GUIDE_VU = 'mentorat-guide-vu';

type Etape = { cible?: string; titre: string; texte: string };

const ETAPES: Etape[] = [
  {
    titre: 'Bienvenue dans ton Mentorat',
    texte: "C'est ton parcours de pratique guidé : quoi travailler, dans quel ordre, et comment savoir que tu progresses. Voici une visite rapide, en une minute.",
  },
  {
    cible: 'present',
    titre: 'Ta séance du jour',
    texte: "Tout commence ici. Une fois les branches ouvertes, choisis chaque jour ta priorité, puis ouvre ta séance : l'essentiel d'abord, le reste en bonus. Règle sa durée (60 min recommandées) et note ce que tu fais.",
  },
  {
    cible: 'arbre',
    titre: "L'arbre de compétences",
    texte: "C'est ton chemin de progression. Tu commences par l'Armure Organique, en bas : 3 niveaux qui préparent le corps. Une fois validée, les 5 branches s'ouvrent ensemble, niveau par niveau. Touche une pastille pour voir sa théorie, son QCM et ses exercices.",
  },
  {
    titre: 'Comment valider un niveau',
    texte: "1. Lis la théorie du niveau. 2. Réussis son QCM : il ouvre l'envoi des vidéos. 3. Entraîne-toi sur chaque exercice, puis envoie une vidéo quand tu atteins l'objectif. Sylvain la regarde et te répond : validé, ou à retravailler avec ses conseils.",
  },
  {
    cible: 'onglets',
    titre: 'Les onglets',
    texte: "Théorie : tout ce que tu as débloqué, à relire, et la bibliographie. Séances : comment structurer un entraînement. Journal : tes notes. Outils : la recherche d'objectifs et des minuteurs. Validation : tes vidéos envoyées et les retours de Sylvain.",
  },
  {
    cible: 'xp',
    titre: 'Ton XP et ta régularité',
    texte: "Tu gagnes de l'XP en validant des niveaux, mais aussi simplement en venant t'entraîner : la présence compte. Touche ce badge pour voir ta progression, ta régularité et tes badges.",
  },
  {
    titre: 'À toi de jouer',
    texte: "Pas besoin de tout faire : reviens souvent, fais l'essentiel, note ce que tu fais. Tu peux relancer ce guide à tout moment avec le bouton « Guide ».",
  },
];

export default function GuideMentorat({ ouvert, onFermer, avantEtape }: {
  ouvert: boolean;
  onFermer: () => void;
  avantEtape?: (cible: string | undefined) => void; // ex. déplier l'arbre avant de le montrer
}) {
  const [i, setI] = useState(0);
  const etape = ETAPES[i];

  useEffect(() => { if (ouvert) setI(0); }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    avantEtape?.(etape.cible);
    if (!etape.cible) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    let el: HTMLElement | null = null;
    // Laisse le temps à l'élément d'apparaître (ex. arbre déplié juste avant).
    const t = setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-guide="${etape.cible}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '3px solid #029FD6';
      el.style.outlineOffset = '6px';
      el.style.borderRadius = el.style.borderRadius || '12px';
    }, 80);
    return () => {
      clearTimeout(t);
      if (el) { el.style.outline = ''; el.style.outlineOffset = ''; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, i]);

  function fermer() {
    try { localStorage.setItem(CLE_GUIDE_VU, '1'); } catch { /* stockage indisponible */ }
    onFermer();
  }

  if (!ouvert) return null;
  const derniere = i === ETAPES.length - 1;
  const bouton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div role="dialog" aria-modal="false" aria-label="Visite guidée du Mentorat"
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000, padding: '0 12px 16px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 520, background: '#0C2040', border: '1px solid #029FD6', borderRadius: 16, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#029FD6', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Guide · {i + 1} / {ETAPES.length}</span>
          <button type="button" onClick={fermer} aria-label="Fermer le guide" style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', padding: 4, lineHeight: 0 }}><X size={18} /></button>
        </div>
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '6px 0 6px', color: COULEURS.texte }}>{etape.titre}</p>
        <p style={{ fontSize: 14, color: COULEURS.texteAtt, lineHeight: 1.55, margin: '0 0 14px' }}>{etape.texte}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} style={{ ...bouton, background: 'transparent', border: `1px solid ${COULEURS.bordure}`, color: COULEURS.texteAtt }}>
              <ChevronLeft size={15} /> Précédent
            </button>
          )}
          {!derniere && (
            <button type="button" onClick={fermer} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', marginLeft: i > 0 ? 0 : 'auto' }}>
              Passer
            </button>
          )}
          <button type="button" onClick={() => (derniere ? fermer() : setI(i + 1))} style={{ ...bouton, marginLeft: 'auto', background: GRADIENT, border: 'none', color: 'white' }}>
            {derniere ? "C'est parti" : <>Suivant <ChevronRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
