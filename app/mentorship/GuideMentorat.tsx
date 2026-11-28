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

// Écrit pour quelqu'un qui découvre tout : chaque mot propre au Mentorat
// (niveau, Armure, branche, QCM, essentiel, XP) est expliqué la première fois.
function etapes(branchesOuvertes: boolean): Etape[] {
  return [
    {
      titre: 'Bienvenue dans ton Mentorat',
      texte: "Le Mentorat est un programme d'entraînement guidé, à suivre à ton rythme. Tu avances étape par étape, et Sylvain vérifie chaque étape en regardant une vidéo de toi. Ce guide t'explique en quelques écrans comment tout fonctionne.",
    },
    {
      cible: 'arbre',
      titre: 'Ton programme : un arbre',
      texte: "Ton programme est dessiné comme un arbre. Chaque rond est un niveau, c'est-à-dire une étape. En bas, les racines : l'Armure Organique, 3 niveaux qui préparent ton corps. Au-dessus, 5 branches, une par thème de pratique : Force, Figures, Locomotion, Connexion, Flexibilité. Les branches restent fermées tant que l'Armure n'est pas validée, puis s'ouvrent toutes en même temps. Touche un rond pour voir ce qu'il contient.",
    },
    {
      titre: "Ce qu'il y a dans un niveau",
      texte: "Chaque niveau contient trois choses. La théorie : des textes courts qui expliquent ce que tu travailles et pourquoi. Un QCM : quelques questions à choix multiples sur cette théorie. Des exercices : chacun a un objectif chiffré à atteindre, par exemple « 3 séries de 8 répétitions ».",
    },
    {
      cible: 'onglets',
      titre: 'Comment valider un niveau',
      texte: "1. Lis la théorie du niveau, dans l'onglet Théorie. 2. Réponds au QCM, juste en dessous : il faut 80 % de bonnes réponses. Tant qu'il n'est pas réussi, l'onglet Théorie clignote. 3. Entraîne-toi sur les exercices. 4. Quand tu atteins l'objectif d'un exercice, filme-toi et envoie la vidéo. Sylvain la regarde et te répond : validé, ou à retravailler, avec ses conseils. Le niveau est validé quand tous ses exercices le sont.",
    },
    {
      cible: 'present',
      titre: 'Ta séance du jour',
      texte: (branchesOuvertes
        ? "Chaque jour, on te demande d'abord ta priorité : la branche sur laquelle tu veux mettre l'accent aujourd'hui. "
        : "Pas besoin d'inventer tes entraînements : ")
        + "le site te propose chaque jour une séance avec les exercices de ton niveau en cours. Commence par ceux marqués « L'essentiel » : s'ils sont faits, ta séance est réussie, et les autres sont un bonus. Avant de commencer, règle la durée de ta séance (60 minutes conseillées). Pendant la séance, note ce que tu fais : séries, répétitions, temps.",
    },
    {
      cible: 'onglets',
      titre: 'Les onglets, en haut',
      texte: "Tableau de bord : ta séance du jour et ton arbre, l'écran où tu es. Théorie : les textes et les QCM de tes niveaux. Séances : comment se construit un bon entraînement. Journal : ton carnet de notes. Outils : rechercher un exercice, des minuteurs. Validation : les vidéos que tu as envoyées et les réponses de Sylvain.",
    },
    {
      cible: 'xp',
      titre: "L'XP, tes points d'expérience",
      texte: "Comme dans un jeu, tu gagnes des points d'expérience (XP) en validant des niveaux, mais aussi simplement en venant t'entraîner régulièrement. Ils font monter ton niveau général. Touche ce badge pour voir ta progression, ta régularité et tes badges.",
    },
    {
      titre: 'Par où commencer ?',
      texte: (branchesOuvertes
        ? "Choisis ta priorité du jour, ouvre ta séance, et pense à réussir le QCM de chaque nouveau niveau dans l'onglet Théorie."
        : "Ouvre l'onglet Théorie, lis le premier niveau de l'Armure Organique et réponds à son QCM. Ensuite, lance ta séance du jour.")
        + " Tu n'as pas besoin de tout faire d'un coup : reviens souvent, fais l'essentiel, note ce que tu fais. Tu peux relancer ce guide à tout moment avec le bouton « ? Guide ».",
    },
  ];
}

export default function GuideMentorat({ ouvert, onFermer, avantEtape, branchesOuvertes = false }: {
  ouvert: boolean;
  branchesOuvertes?: boolean;
  onFermer: () => void;
  avantEtape?: (cible: string | undefined) => void; // ex. déplier l'arbre avant de le montrer
}) {
  const [i, setI] = useState(0);
  const ETAPES = etapes(branchesOuvertes);
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
