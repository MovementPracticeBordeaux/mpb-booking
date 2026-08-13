'use client';

import { useState, useMemo } from 'react';
import {
  ORDRE_DOMAINES,
  DOMAINE_LABELS,
  DOMAINE_COULEURS,
  DOMAINE_ACCROCHES,
  COULEUR_TRONC,
  COULEUR_FLAMME,
  Domaine,
  DomaineOuTronc,
  NoeudMentorshipPublic,
  ExerciceMentorship,
  PalierFlamme,
  XP_BONUS_DEFI_QUOTIDIEN,
  estNoeudAcquisDepuisProgression,
  moduleIdExercice,
  pourcentageFlammeNoeud,
  palierFlamme,
  badgeEleve,
} from '@/lib/mentorship-modules';
import { COULEURS, POLICE_DISPLAY, POLICE_CORPS } from '@/lib/theme';
import { soumettreVideo, repondreQCM, validerDefiQuotidien, soumettreVideoExercice } from './actions';

type Progression = {
  module_id: string;
  statut: 'en_attente' | 'acquis' | 'refuse' | null;
  quiz_reussi: boolean;
  quiz_score: number | null;
  video_url: string | null;
  commentaire_coach: string | null;
};
type StatutAffiche = 'locked' | 'unlocked' | 'qcm_reussi' | 'en_attente' | 'acquis' | 'refuse';
type EntreeBilan = {
  domaine: string;
  exercice_ou_theme: string;
  statut: 'acquis' | 'en_cours' | 'difficulte_recurrente';
  commentaire: string | null;
  updated_at: string;
};
type Niveau = { niveau: number; titre: string; xpDansPalier: number; xpProchainPalier: number };

// Coordonnées en pourcentage (0-100), façon "racine en bas, branches en
// haut" : le tronc descend jusqu'à la base, les 5 branches partent de son
// sommet et s'élèvent plus haut encore.
const BRANCH_LEVEL_Y: Record<1 | 2 | 3, number> = { 3: 5, 2: 21, 1: 38 };
const JUNCTION_Y = 50;
const TRUNK_LEVEL_Y: Record<1 | 2 | 3, number> = { 3: 62, 2: 80, 1: 97 };
const TRUNK_X = 50;
const BRANCH_X: Record<Domaine, number> = { connexion: 10, flexibilite: 30, force: 50, figures: 70, locomotion: 90 };

const STATUT_META: Record<Exclude<StatutAffiche, 'unlocked' | 'locked'>, { label: string; fill: string; border: string; dash?: string }> = {
  qcm_reussi: { label: 'QCM validé — vidéo à envoyer', fill: `linear-gradient(${COULEURS.surfaceForte}, ${COULEURS.surfaceForte}), ${COULEURS.fond}`, border: '#FF8A00' },
  en_attente: { label: 'Vidéo envoyée — en attente', fill: `linear-gradient(${COULEURS.surfaceForte}, ${COULEURS.surfaceForte}), ${COULEURS.fond}`, border: '#FFC24B', dash: '3 3' },
  refuse: { label: 'À retravailler', fill: `linear-gradient(rgba(255,107,107,0.12), rgba(255,107,107,0.12)), ${COULEURS.fond}`, border: '#ff6b6b' },
  acquis: { label: 'Acquis', fill: '', border: '' },
};

// Fond systématiquement OPAQUE (fond de page + teinte de branche en
// surcouche) : les nœuds sont posés sur les traits de l'arbre (dessinés
// dans le SVG juste en-dessous), un fond translucide les laisserait
// traverser visuellement par le trait.
function metaPour(statut: StatutAffiche, couleurBranche: string) {
  if (statut === 'locked') return { label: 'Verrouillé', fill: `linear-gradient(${couleurBranche}14, ${couleurBranche}14), ${COULEURS.fond}`, border: `${couleurBranche}55` };
  if (statut === 'unlocked') return { label: 'Débloqué', fill: COULEURS.fond, border: couleurBranche };
  if (statut === 'acquis') return { label: 'Acquis', fill: couleurBranche, border: couleurBranche };
  return STATUT_META[statut];
}

// --- Pictogrammes simplifiés par domaine ---------------------------------
// Volontairement minimalistes (Sylvain remplacera par ses propres visuels
// plus tard) : un symbole simple par domaine, dessiné en trait.
function Pictogramme({ domaine, taille = 12, couleur }: { domaine: DomaineOuTronc; taille?: number; couleur: string }) {
  const props = { width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none', stroke: couleur, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (domaine) {
    case 'force':
      return <svg {...props}><path d="M4 12h2M18 12h2M6 8v8M18 8v8M8 12h8" /></svg>;
    case 'flexibilite':
      return <svg {...props}><path d="M4 18c3-6 6 6 9 0s6-6 7-3" /></svg>;
    case 'locomotion':
      return <svg {...props}><circle cx="15" cy="5" r="2" /><path d="M13 8l-3 4 2 2-1 6M10 12l-4 1M15 10l3 3-2 6" /></svg>;
    case 'connexion':
      return <svg {...props}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 6h8M7 8l4 8M17 8l-4 8" /></svg>;
    case 'figures':
      return <svg {...props}><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" /></svg>;
    case 'tronc':
    default:
      return <svg {...props}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /></svg>;
  }
}

const PALIER_LABEL: Record<PalierFlamme, string> = {
  aucune: '', normal: 'Normal', epique: 'Épique', legendaire: 'Légendaire', mythique: 'Mythique',
};

// Petit badge flamme animé, superposé en coin d'un nœud (palier local) ou
// affiché dans l'en-tête XP (palier global de l'élève).
function IconeFlamme({ palier }: { palier: PalierFlamme }) {
  if (palier === 'aucune') return null;
  const mythique = palier === 'mythique';
  const couleur = COULEUR_FLAMME[palier];
  return (
    <span
      aria-hidden
      title={`Flamme ${PALIER_LABEL[palier]}`}
      style={{
        position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        background: mythique ? 'linear-gradient(270deg, #FF3B30, #FF2D78, #8B5CF6, #FF3B30)' : '#161618',
        backgroundSize: mythique ? '400% 100%' : undefined,
        animation: mythique ? 'flame-shift 3s linear infinite' : 'pulse-noeud 2.4s ease-in-out infinite',
        border: `2px solid ${mythique ? 'transparent' : couleur}`,
        boxShadow: `0 0 6px ${mythique ? '#FF2D78' : couleur}`,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={mythique ? '#fff' : couleur}>
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
      </svg>
    </span>
  );
}

// Cadre luminescent de la boîte XP, selon le badge de dépassement de
// l'élève. 'normal'/'aucune' = pas d'effet (peu de nœuds acquis, rien à
// mettre en avant) — l'effet monte en intensité avec le palier.
const CADRE_BADGE: Record<PalierFlamme, { border: string; boxShadow: string; anime?: string }> = {
  aucune: { border: '', boxShadow: '' },
  normal: { border: '', boxShadow: '' },
  epique: { border: '#8B5CF6', boxShadow: '0 0 14px #8B5CF680' },
  legendaire: { border: '#FFD700', boxShadow: '0 0 16px #FFD70080' },
  mythique: { border: '#FF2D78', boxShadow: '0 0 10px #FF3B30bb, 0 0 20px #FF2D78bb, 0 0 32px #8B5CF6aa', anime: 'glow-acquis 2.4s ease-in-out infinite' },
};

// --- En-tête XP / niveau — compact, avec titre du pratiquant et barre vers le niveau suivant --
function EnTeteXP({ xpTotal, niveau, badge }: { xpTotal: number; niveau: Niveau; badge?: PalierFlamme }) {
  const cadre = CADRE_BADGE[badge ?? 'aucune'];
  const aCadre = cadre.border !== '';
  return (
    <div style={{
      background: COULEURS.surface, borderRadius: 12, padding: '14px 16px', minWidth: 150,
      border: `1px solid ${aCadre ? cadre.border : COULEURS.bordure}`,
      boxShadow: aCadre ? cadre.boxShadow : 'none',
      animation: cadre.anime,
      transition: 'box-shadow 0.6s ease, border-color 0.6s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#flamme)" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="flamme" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3B30" /><stop offset="100%" stopColor="#FF8A00" />
            </linearGradient>
          </defs>
          <path d="M8.5 15.5A3 3 0 0012 12.5c0-1.5-.6-2.4-1.2-3.6-1.3-2.6-.3-4.9 2.4-7.2.6 3 2.4 5.9 4.8 7.8 2.4 1.9 3.6 4.2 3.6 6.6a8.4 8.4 0 11-16.8 0c0-1.4.5-2.75 1.2-3.6a3 3 0 003 3z" />
        </svg>
        <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, color: COULEURS.texte, whiteSpace: 'nowrap' }}>{xpTotal.toLocaleString('fr-FR')} XP</p>
      </div>
      <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 17, letterSpacing: 0.3, color: '#ff00aa' }}>Niveau {niveau.niveau}</p>
      <p style={{ margin: '1px 0 8px', fontSize: 11, color: COULEURS.texteFaible, whiteSpace: 'nowrap' }}>{niveau.titre}</p>
      <div style={{ height: 5, borderRadius: 3, background: COULEURS.surfaceForte, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(niveau.xpDansPalier / niveau.xpProchainPalier) * 100}%`, background: 'linear-gradient(90deg,#FF3B30,#8B5CF6)', borderRadius: 3 }} />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 10, color: COULEURS.texteFaible }}>{niveau.xpDansPalier}/{niveau.xpProchainPalier} XP avant le niveau {niveau.niveau + 1}</p>
      {aCadre && (
        <p style={{ margin: '8px 0 0', fontSize: 10, color: cadre.border, textAlign: 'right', fontWeight: 600, letterSpacing: 0.3 }}>
          Dépassement {PALIER_LABEL[badge!]}
        </p>
      )}
    </div>
  );
}

// --- Courbe XP dans le temps ------------------------------------------------
// Aperçu illustratif utilisé tant qu'il n'y a pas encore de vrais points sur
// plusieurs jours différents — clairement marqué "Exemple" pour ne jamais
// être confondu avec une vraie progression.
const COURBE_EXEMPLE: { jour: string; xp: number }[] = [
  { jour: '01', xp: 30 }, { jour: '03', xp: 100 }, { jour: '04', xp: 145 },
  { jour: '07', xp: 210 }, { jour: '09', xp: 290 }, { jour: '10', xp: 310 },
  { jour: '13', xp: 420 }, { jour: '14', xp: 510 },
];

function CourbeXP({ points }: { points: { jour: string; xp: number }[] }) {
  const exemple = points.length < 2;
  const recents = (exemple ? COURBE_EXEMPLE : points).slice(-14);
  const svgW = 600, svgH = 220, padG = 36, padD = 12, padH = 16, padB = 28;
  const maxXP = Math.max(...recents.map((p) => p.xp));
  const coords = recents.map((p, i) => ({
    x: recents.length > 1 ? padG + (i / (recents.length - 1)) * (svgW - padG - padD) : svgW / 2,
    y: padH + (1 - p.xp / maxXP) * (svgH - padH - padB),
    ...p,
  }));
  const aire = `M ${coords[0].x} ${svgH - padB} ` + coords.map((c) => `L ${c.x} ${c.y}`).join(' ') + ` L ${coords[coords.length - 1].x} ${svgH - padB} Z`;
  const ligne = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  return (
    <div style={{ position: 'relative' }}>
      {exemple && (
        <span style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: COULEURS.texteFaible, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '2px 8px' }}>
          Exemple
        </span>
      )}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block', opacity: exemple ? 0.55 : 1 }}>
        <defs>
          <linearGradient id="aire-xp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff00aa" stopOpacity="0.35" /><stop offset="100%" stopColor="#ff00aa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padG} y1={svgH - padB} x2={svgW - padD} y2={svgH - padB} stroke={COULEURS.bordure} strokeWidth={1} />
        <path d={aire} fill="url(#aire-xp)" />
        <path d={ligne} fill="none" stroke="#ff00aa" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={exemple ? '6 5' : undefined} />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={3.5} fill="#ff00aa" />
            {!exemple && (i === coords.length - 1 || i === 0) && <text x={c.x} y={c.y - 10} fontSize={12} fill={COULEURS.texte} textAnchor="middle">{c.xp} XP</text>}
            {!exemple && (
              <text x={c.x} y={svgH - 8} fontSize={10} fill={COULEURS.texteFaible} textAnchor="middle">
                {new Date(c.jour + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </text>
            )}
          </g>
        ))}
      </svg>
      {exemple && (
        <p style={{ fontSize: 12, color: COULEURS.texteFaible, lineHeight: 1.6, marginTop: 8 }}>
          Aperçu à quoi ressemblera ta courbe — la vraie apparaît dès que tu gagnes des points sur plusieurs jours différents (QCM réussi, vidéo validée, entraînement du jour coché).
        </p>
      )}
    </div>
  );
}

// --- Petit menu d'onglets — pour du contenu qui n'est PAS déjà sur le
// dashboard (le dashboard lui-même reste tout sur un seul écran) ----------
type Onglet = 'arbre' | 'theorie' | 'validation' | 'seances';
const ONGLETS: { id: Onglet; label: string; icone: (c: string) => React.ReactNode }[] = [
  { id: 'arbre', label: 'Tableau de bord', icone: (c) => <path d="M12 2l3 6h-2l3 6h-2l3 6H7l3-6H8l3-6H9l3-6z" stroke={c} strokeWidth={1.6} fill="none" strokeLinejoin="round" /> },
  { id: 'theorie', label: 'Théorie', icone: (c) => <><path d="M4 5a2 2 0 012-2h9v18H6a2 2 0 01-2-2V5z" stroke={c} strokeWidth={2} fill="none" /><path d="M9 8h6M9 12h6" stroke={c} strokeWidth={1.6} strokeLinecap="round" /></> },
  { id: 'validation', label: 'Validation', icone: (c) => <><rect x="3" y="6" width="18" height="13" rx="2" stroke={c} strokeWidth={2} fill="none" /><path d="M3 8l9 6 9-6" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></> },
  { id: 'seances', label: 'Séances', icone: (c) => <><rect x="4" y="5" width="16" height="15" rx="2" stroke={c} strokeWidth={2} fill="none" /><path d="M4 9h16M8 3v4M16 3v4" stroke={c} strokeWidth={2} strokeLinecap="round" /></> },
];

function MenuOnglets({ actif, onChange }: { actif: Onglet; onChange: (o: Onglet) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: `1px solid ${COULEURS.bordure}`, overflowX: 'auto' }}>
      {ONGLETS.map((o) => {
        const est = o.id === actif;
        const c = est ? '#ff00aa' : COULEURS.texteFaible;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px', fontSize: 13, fontFamily: POLICE_DISPLAY, letterSpacing: 0.3, color: c,
              borderBottom: `2px solid ${est ? '#ff00aa' : 'transparent'}`, whiteSpace: 'nowrap',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">{o.icone(c)}</svg>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ArbreCompetences({
  tronc,
  branches,
  progression: progressionReelle,
  bilan,
  xpTotal,
  niveau,
  badge,
  defisValidesAujourdhui,
  courbeXP,
  structureSeance,
  estAdmin,
}: {
  tronc: NoeudMentorshipPublic[];
  branches: NoeudMentorshipPublic[];
  progression: Map<string, Progression>;
  bilan: EntreeBilan[];
  xpTotal: number;
  niveau: Niveau;
  badge?: PalierFlamme;
  defisValidesAujourdhui: Set<string>;
  courbeXP: { jour: string; xp: number }[];
  structureSeance: readonly { etape: string; detail: string }[];
  estAdmin?: boolean;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [reponsesQCM, setReponsesQCM] = useState<Record<string, number>>({});
  const [onglet, setOnglet] = useState<Onglet>('arbre');
  const [apercu, setApercu] = useState<'reel' | 'tronc-1' | 'tronc-complet' | 'branches-en-cours'>('reel');

  const NOEUD_ACQUIS: Progression = { module_id: '', statut: 'acquis', quiz_reussi: true, quiz_score: 100, video_url: null, commentaire_coach: null };

  // Aperçu (admin uniquement) : simule différents états d'avancement sans
  // toucher aux vraies données, pour visualiser le rendu à chaque étape.
  const progression = useMemo(() => {
    if (apercu === 'reel') return progressionReelle;
    const m = new Map<string, Progression>();
    const marquer = (id: string) => m.set(id, { ...NOEUD_ACQUIS, module_id: id });
    if (apercu === 'tronc-1') {
      marquer(tronc.find((n) => n.niveau === 1)!.id);
    } else if (apercu === 'tronc-complet' || apercu === 'branches-en-cours') {
      tronc.forEach((n) => marquer(n.id));
      if (apercu === 'branches-en-cours') {
        branches.filter((n) => n.niveau === 1).forEach((n) => marquer(n.id));
        branches.filter((n) => n.domaine === 'force' && n.niveau === 2).forEach((n) => marquer(n.id));
      }
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apercu, progressionReelle, tronc, branches]);

  const idsAcquis = new Set(
    [...tronc, ...branches].filter((n) => estNoeudAcquisDepuisProgression(n, estModuleAcquisDansMap)).map((n) => n.id)
  );
  const troncComplet = tronc.every((n) => idsAcquis.has(n.id));

  // Badge affiché dans l'en-tête XP : en mode aperçu (admin), on simule le
  // badge à partir des nœuds fictivement acquis, pour prévisualiser le
  // cadre luminescent. En mode réel, on garde le badge calculé côté
  // serveur à partir des vraies données de l'élève.
  const badgeAffiche: PalierFlamme = useMemo(() => {
    if (apercu === 'reel') return badge ?? 'aucune';
    const noeudsAcquisApercu = [...tronc, ...branches].filter((n) => idsAcquis.has(n.id));
    const flammes = noeudsAcquisApercu.map((n) => pourcentageFlammeNoeud(n, estModuleAcquisDansMap));
    return badgeEleve(flammes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apercu, idsAcquis.size, badge]);

  // Généralise "ce module (nœud entier OU exercice précis) est-il acquis ?"
  // pour les deux modèles. En mode aperçu (admin), la carte fictive ne
  // marque que l'id du nœud lui-même — on considère alors ses exercices
  // comme tous acquis, pour simuler correctement le rendu.
  function estModuleAcquisDansMap(moduleId: string): boolean {
    if (progression.get(moduleId)?.statut === 'acquis') return true;
    if (apercu !== 'reel') {
      const idNoeud = moduleId.split('::')[0];
      return progression.get(idNoeud)?.statut === 'acquis';
    }
    return false;
  }

  function estDeverrouille(noeud: NoeudMentorshipPublic): boolean {
    if (noeud.domaine === 'tronc') {
      if (noeud.niveau === 1) return true;
      const precedent = tronc.find((n) => n.niveau === noeud.niveau - 1);
      return precedent ? idsAcquis.has(precedent.id) : true;
    }
    if (!troncComplet) return false;
    if (noeud.niveau === 1) return true;
    const precedent = branches.find((n) => n.domaine === noeud.domaine && n.niveau === noeud.niveau - 1);
    return precedent ? idsAcquis.has(precedent.id) : true;
  }

  function statutAffiche(noeud: NoeudMentorshipPublic): StatutAffiche {
    if (!estDeverrouille(noeud)) return 'locked';
    if (noeud.exercices && noeud.exercices.length > 0) {
      return idsAcquis.has(noeud.id) ? 'acquis' : 'unlocked';
    }
    const prog = progression.get(noeud.id);
    if (!prog) return 'unlocked';
    if (prog.statut === 'acquis') return 'acquis';
    if (prog.statut === 'refuse') return 'refuse';
    if (prog.statut === 'en_attente') return 'en_attente';
    if (prog.quiz_reussi) return 'qcm_reussi';
    return 'unlocked';
  }

  // Flamme locale d'un nœud à exercices : % de progressions bonus validées
  // sur CE nœud précis (0 si le nœud n'a pas ce modèle ou pas de bonus).
  function flammeDuNoeud(noeud: NoeudMentorshipPublic): PalierFlamme {
    if (!noeud.exercices || noeud.exercices.length === 0) return 'aucune';
    return palierFlamme(pourcentageFlammeNoeud(noeud, estModuleAcquisDansMap));
  }

  function pourcentageBranche(branche: DomaineOuTronc) {
    const noeuds = branche === 'tronc' ? tronc : branches.filter((n) => n.domaine === branche);
    const acquis = noeuds.filter((n) => idsAcquis.has(n.id)).length;
    return Math.round((acquis / noeuds.length) * 100);
  }

  const pourcentageTronc = pourcentageBranche('tronc');

  // Entraînement du jour : la programmation des compétences débloquées mais
  // pas encore acquises (tronc + branches) — un résumé du travail à faire.
  const defisDuJour = useMemo(() => {
    const candidats = [...tronc, ...branches].filter((n) => estDeverrouille(n) && !idsAcquis.has(n.id) && n.programmation.length > 0);
    return candidats.flatMap((n) =>
      n.programmation.map((p, i) => ({
        id: n.programmation.length > 1 ? `${n.id}-${i}` : n.id,
        titre: `${n.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[n.domaine as Domaine]} · niveau ${n.niveau}`,
        cible: p.cible,
        couleur: n.domaine === 'tronc' ? COULEUR_TRONC : DOMAINE_COULEURS[n.domaine as Domaine],
        domaine: n.domaine,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tronc, branches, idsAcquis.size, troncComplet]);

  const lignes = useMemo(() => {
    const segs: { x1: number; y1: number; x2: number; y2: number; active: boolean; key: string }[] = [];
    ORDRE_DOMAINES.forEach((d) => {
      segs.push({ x1: BRANCH_X[d], y1: BRANCH_LEVEL_Y[1], x2: BRANCH_X[d], y2: BRANCH_LEVEL_Y[3], active: troncComplet, key: `branche-${d}` });
      segs.push({ x1: BRANCH_X[d], y1: BRANCH_LEVEL_Y[1], x2: BRANCH_X[d], y2: JUNCTION_Y, active: troncComplet, key: `jonction-${d}` });
    });
    segs.push({ x1: BRANCH_X.connexion, y1: JUNCTION_Y, x2: BRANCH_X.locomotion, y2: JUNCTION_Y, active: troncComplet, key: 'barre-jonction' });
    return segs;
  }, [troncComplet]);

  const noeudSelectionne = selection ? [...tronc, ...branches].find((n) => n.id === selection) ?? null : null;
  const ORDRE_VISUEL: Domaine[] = ['connexion', 'flexibilite', 'force', 'figures', 'locomotion'];

  return (
    <div style={{ fontFamily: POLICE_CORPS }}>
      <style>{`
        @keyframes pulse-noeud { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes glow-acquis { 0%, 100% { filter: drop-shadow(0 0 3px currentColor); } 50% { filter: drop-shadow(0 0 8px currentColor); } }
        @keyframes flame-shift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      `}</style>

      <MenuOnglets actif={onglet} onChange={setOnglet} />

      {estAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20, padding: '8px 12px', border: `1px dashed ${COULEURS.bordure}`, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5 }}>Aperçu (admin) :</span>
          {([
            ['reel', 'Réel'],
            ['tronc-1', 'Tronc niveau 1'],
            ['tronc-complet', 'Tronc complet'],
            ['branches-en-cours', 'Branches en cours'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setApercu(id)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${apercu === id ? '#ff00aa' : COULEURS.bordure}`,
                background: apercu === id ? 'rgba(255,0,170,0.12)' : 'transparent',
                color: apercu === id ? '#ff00aa' : COULEURS.texteFaible,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {onglet === 'arbre' && (
        <>
          {/* Tes compétences (vignette compacte) + XP (compact, largeur fixe), comme sur le croquis */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
            <div style={{ flex: '0 1 260px', background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: 0.3, margin: '0 0 8px', color: COULEURS.texte }}>Tes compétences</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <LigneProgression compact label="Armure Organique" pourcentage={pourcentageTronc} couleur={COULEUR_TRONC} domaine="tronc" entrees={bilan.filter((b) => b.domaine === 'tronc')} />
                {ORDRE_DOMAINES.map((d) => (
                  <LigneProgression compact key={d} label={DOMAINE_LABELS[d]} pourcentage={pourcentageBranche(d)} couleur={DOMAINE_COULEURS[d]} domaine={d} entrees={bilan.filter((b) => b.domaine === d)} />
                ))}
              </div>
            </div>
            <div style={{ flex: '0 1 190px' }}>
              <EnTeteXP xpTotal={xpTotal} niveau={niveau} badge={badgeAffiche} />
            </div>
          </div>

          {/* En-têtes de branches — icône, nom, accroche, avant l'arbre lui-même */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, maxWidth: 460, marginInline: 'auto', marginBottom: 4 }}>
            {ORDRE_VISUEL.map((d) => (
              <div key={d} style={{ textAlign: 'center', padding: '0 2px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', marginInline: 'auto', marginBottom: 6,
                  border: `2px solid ${DOMAINE_COULEURS[d]}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 10px ${DOMAINE_COULEURS[d]}55`, background: `${DOMAINE_COULEURS[d]}14`,
                }}>
                  <Pictogramme domaine={d} taille={16} couleur={DOMAINE_COULEURS[d]} />
                </div>
                <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: DOMAINE_COULEURS[d] }}>{DOMAINE_LABELS[d]}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: COULEURS.texteFaible, lineHeight: 1.3 }}>{DOMAINE_ACCROCHES[d]}</p>
              </div>
            ))}
          </div>

          {/* Arbre — en vedette, section large */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 460, marginInline: 'auto', aspectRatio: '3 / 4' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }}>
              <defs>
                <linearGradient id="gradient-lignes" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="0">
                  <stop offset="0%" stopColor="#FF3B30" /><stop offset="35%" stopColor="#FF8A00" /><stop offset="70%" stopColor="#FF2D78" /><stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              {lignes.map((l) => (
                <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.active ? 'url(#gradient-lignes)' : COULEURS.texteFaible} strokeWidth={l.active ? 0.9 : 0.6} opacity={l.active ? 0.9 : 0.7} />
              ))}
              {/* Ligne du tronc — couleur pleine dédiée (pas le gradient partagé),
                  pour être toujours visible quel que soit l'état des branches */}
              <line x1={TRUNK_X} y1={JUNCTION_Y} x2={TRUNK_X} y2={TRUNK_LEVEL_Y[1]} stroke="#ff00aa" strokeWidth={1.3} opacity={0.9} />
            </svg>

            {/* Nœuds des branches */}
            {ORDRE_DOMAINES.map((d) =>
              ([1, 2, 3] as const).map((lvl) => {
                const noeud = branches.find((n) => n.domaine === d && n.niveau === lvl);
                if (!noeud) return null;
                return (
                  <Noeud
                    key={noeud.id}
                    x={BRANCH_X[d]} y={BRANCH_LEVEL_Y[lvl]}
                    statut={statutAffiche(noeud)}
                    couleur={DOMAINE_COULEURS[d]}
                    domaine={d}
                    flamme={flammeDuNoeud(noeud)}
                    image={noeud.image}
                    onClick={() => setSelection(noeud.id)}
                  />
                );
              })
            )}

            {/* Nœuds du tronc (les 2 premiers, en montant) */}
            {tronc.filter((n) => n.niveau < 3).map((noeud) => (
              <Noeud
                key={noeud.id}
                x={TRUNK_X} y={TRUNK_LEVEL_Y[noeud.niveau]}
                statut={statutAffiche(noeud)}
                couleur={COULEUR_TRONC}
                domaine="tronc"
                onClick={() => setSelection(noeud.id)}
              />
            ))}

            {/* Tronc niveau 3 : le grand rond qui se remplit selon l'avancement global du tronc */}
            <NoeudTroncPrincipal
              x={TRUNK_X} y={TRUNK_LEVEL_Y[3]}
              pourcentage={pourcentageTronc}
              statut={statutAffiche(tronc.find((n) => n.niveau === 3)!)}
              onClick={() => setSelection(tronc.find((n) => n.niveau === 3)!.id)}
            />
          </div>
          <p style={{ textAlign: 'center', fontFamily: POLICE_DISPLAY, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#ff00aa', marginTop: 8 }}>
            Armure Organique
          </p>

          {!troncComplet && (
            <p style={{ textAlign: 'center', fontSize: 13, color: COULEURS.texteFaible, marginTop: 4, marginBottom: 8 }}>
              Les branches restent verrouillées tant que l'Armure Organique n'est pas validée en entier (niveau 3).
            </p>
          )}

          {/* Ta progression (courbe) + Entraînement du jour, comme sur le croquis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
            <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>Ta progression</p>
              <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: '0 0 12px' }}>Points Mouvement gagnés au fil des jours.</p>
              <CourbeXP points={courbeXP} />
            </div>

            <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>Entraînement du jour</p>
              <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: '0 0 4px' }}>Le travail à faire aujourd'hui ou en prévision.</p>
              {defisDuJour.length === 0 ? (
                <p style={{ fontSize: 13, color: COULEURS.texteFaible, marginTop: 10 }}>
                  Rien de débloqué pour l'instant — ça se remplira dès que tu auras une compétence en cours.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {defisDuJour.map((d) => {
                    const fait = defisValidesAujourdhui.has(d.id);
                    return (
                      <form key={d.id} action={validerDefiQuotidien} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${COULEURS.bordure}` }}>
                        <input type="hidden" name="noeud_id" value={d.id} />
                        <button
                          type="submit"
                          disabled={fait}
                          aria-label={fait ? 'Fait aujourd\'hui' : 'Marquer comme fait'}
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: fait ? 'default' : 'pointer',
                            border: `2px solid ${fait ? '#9ef29e' : d.couleur}`, background: fait ? '#9ef29e' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >
                          {fait && <span style={{ color: '#0b0b0d', fontSize: 13, lineHeight: 1 }}>✓</span>}
                        </button>
                        <div style={{ flexGrow: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, color: COULEURS.texte }}>{d.cible}</p>
                          <p style={{ margin: '1px 0 0', fontSize: 11, color: COULEURS.texteFaible }}>{d.titre}</p>
                        </div>
                        <span style={{ fontSize: 11, color: fait ? COULEURS.texteFaible : '#FF8A00', flexShrink: 0 }}>+{XP_BONUS_DEFI_QUOTIDIEN} XP</span>
                      </form>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {onglet === 'theorie' && (
        <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '24px 20px' }}>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>Théorie déjà débloquée</p>
          <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '0 0 20px' }}>
            Tout le contenu théorique des niveaux que tu as atteints, à relire à volonté.
          </p>
          {(() => {
            const noeudsAvecTheorie = [...tronc, ...branches].filter((n) => estDeverrouille(n) && n.theorie.length > 0);
            if (noeudsAvecTheorie.length === 0) {
              return <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>Rien à lire pour l'instant — la théorie apparaît ici au fil de ta progression.</p>;
            }
            return noeudsAvecTheorie.map((n) => {
              const couleur = n.domaine === 'tronc' ? COULEUR_TRONC : DOMAINE_COULEURS[n.domaine as Domaine];
              const label = n.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[n.domaine as Domaine];
              return (
                <div key={n.id} style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>{label.toUpperCase()} · NIVEAU {n.niveau}</span>
                  <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 17, margin: '2px 0 10px', color: COULEURS.texte }}>{n.titre}</p>
                  {n.theorie.map((t) => (
                    <div key={t.titre} style={{ marginBottom: 12, borderLeft: `2px solid ${couleur}`, paddingLeft: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: COULEURS.texte }}>{t.titre}</p>
                      <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.7, margin: '4px 0 0' }}>{t.texte}</p>
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      )}

      {onglet === 'validation' && (
        <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '24px 20px' }}>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>Validation & échange avec Sylvain</p>
          <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '0 0 20px' }}>
            L'état de tes QCM et de tes vidéos envoyées, niveau par niveau.
          </p>
          {(() => {
            const noeudsActifs = [...tronc, ...branches].filter((n) => estDeverrouille(n) && statutAffiche(n) !== 'acquis');
            if (noeudsActifs.length === 0) {
              return <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>Rien en attente — tout ce qui est débloqué est déjà validé.</p>;
            }
            return noeudsActifs.map((n) => {
              const couleur = n.domaine === 'tronc' ? COULEUR_TRONC : DOMAINE_COULEURS[n.domaine as Domaine];
              const label = n.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[n.domaine as Domaine];
              const statut = statutAffiche(n);
              const prog = progression.get(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => setSelection(n.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: `1px solid ${COULEURS.bordure}`, padding: '14px 0', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>{label.toUpperCase()} · NIVEAU {n.niveau}</span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, color: COULEURS.texte }}>{n.titre}</p>
                    </div>
                    <span style={{
                      fontSize: 11, flexShrink: 0, padding: '4px 10px', borderRadius: 999,
                      color: statut === 'en_attente' ? '#FFC24B' : statut === 'refuse' ? '#ff6b6b' : statut === 'qcm_reussi' ? '#FF8A00' : COULEURS.texteFaible,
                      border: `1px solid ${statut === 'en_attente' ? '#FFC24B' : statut === 'refuse' ? '#ff6b6b' : statut === 'qcm_reussi' ? '#FF8A00' : COULEURS.bordure}`,
                    }}>
                      {statut === 'en_attente' ? 'Vidéo en attente' : statut === 'refuse' ? 'À retravailler' : statut === 'qcm_reussi' ? 'QCM réussi — vidéo à envoyer' : 'QCM à passer'}
                    </span>
                  </div>
                  {statut === 'refuse' && prog?.commentaire_coach && (
                    <p style={{ fontSize: 12, color: '#ff6b6b', margin: '6px 0 0' }}>Retour de Sylvain : {prog.commentaire_coach}</p>
                  )}
                </button>
              );
            });
          })()}
        </div>
      )}

      {onglet === 'seances' && (
        <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '24px 20px' }}>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '0 0 16px', color: COULEURS.texte }}>Comment structurer une séance</p>
          {structureSeance.map((etape, i) => (
            <div key={etape.etape} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 14, margin: 0, color: COULEURS.texte }}>{i + 1}. {etape.etape}</p>
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '2px 0 0' }}>{etape.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Panneau détail nœud */}
      {noeudSelectionne && (
        <PanneauNoeud
          noeud={noeudSelectionne}
          statut={statutAffiche(noeudSelectionne)}
          progression={progression.get(noeudSelectionne.id)}
          progressionMap={progression}
          couleur={noeudSelectionne.domaine === 'tronc' ? COULEUR_TRONC : DOMAINE_COULEURS[noeudSelectionne.domaine as Domaine]}
          reponsesQCM={reponsesQCM}
          setReponsesQCM={setReponsesQCM}
          estAdmin={estAdmin}
          onFermer={() => setSelection(null)}
        />
      )}
    </div>
  );
}

function LigneProgression({ label, pourcentage, couleur, domaine, entrees, compact }: { label: string; pourcentage: number; couleur: string; domaine: DomaineOuTronc; entrees: EntreeBilan[]; compact?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div style={{ borderBottom: compact ? 'none' : `1px solid ${COULEURS.bordure}`, paddingBottom: compact ? 0 : 10 }}>
      <button onClick={() => setOuvert((o) => !o)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: compact ? 2 : 4 }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={COULEURS.texteFaible} strokeWidth={3} style={{ transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span style={{ fontFamily: POLICE_DISPLAY, fontSize: compact ? 11 : 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: COULEURS.texte, flexGrow: 1 }}>{label}</span>
          <span style={{ fontSize: compact ? 10 : 12, color: COULEURS.texteFaible }}>{pourcentage}%</span>
        </div>
        <div style={{ height: compact ? 4 : 6, borderRadius: 3, background: COULEURS.surfaceForte, overflow: 'hidden', marginLeft: 14 }}>
          <div style={{ height: '100%', width: `${pourcentage}%`, background: couleur, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </button>
      {ouvert && (
        <div style={{ marginTop: 10, marginLeft: 18, marginBottom: 4 }}>
          {entrees.length === 0 ? (
            <p style={{ fontSize: 12, color: COULEURS.texteFaible }}>
              Pas encore de détail sur cette branche — ça se remplit au fil de tes vidéos validées.
            </p>
          ) : (
            entrees.map((e, i) => {
              const couleurStatut = e.statut === 'acquis' ? '#9ef29e' : e.statut === 'en_cours' ? '#FFC24B' : '#ff6b6b';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: COULEURS.texteAtt }}>{e.exercice_ou_theme}</span>
                  <span style={{ color: couleurStatut, flexShrink: 0 }}>{e.statut === 'acquis' ? 'Point fort' : e.statut === 'en_cours' ? 'En cours' : 'À retravailler'}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Noeud({ x, y, statut, couleur, domaine, flamme, image, onClick }: { x: number; y: number; statut: StatutAffiche; couleur: string; domaine: DomaineOuTronc; flamme?: PalierFlamme; image?: string; onClick: () => void }) {
  const meta = metaPour(statut, couleur);
  const pulse = statut === 'en_attente';
  const acquis = statut === 'acquis';
  const locked = statut === 'locked';
  const aImage = !!image;
  return (
    <button
      onClick={onClick}
      aria-label={meta.label}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
        width: 58, height: 58, borderRadius: '50%',
        background: aImage ? COULEURS.fond : acquis ? `radial-gradient(circle at 35% 30%, ${couleur}, ${couleur}bb)` : meta.fill,
        border: `1.5px ${meta.dash ? 'dashed' : 'solid'} ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : acquis ? 'glow-acquis 2.4s ease-in-out infinite' : 'none',
        color: couleur,
        boxShadow: acquis ? `0 0 16px ${couleur}99` : statut !== 'locked' ? `0 0 8px ${couleur}44` : 'none',
      }}
    >
      {flamme && flamme !== 'aucune' && <IconeFlamme palier={flamme} />}
      {aImage ? (
        <>
          {/* Pastille encore éteinte tant que verrouillée : logo visible
              mais assombri (pas de néon), pour donner envie sans dévoiler
              pleinement — s'éclaire progressivement au fil du déblocage
              puis de la validation. */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: acquis ? 1 : locked ? 0.55 : 0.9,
                filter: locked ? 'brightness(0.5)' : 'none',
              }}
            />
          </div>
        </>
      ) : locked ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={2} opacity={0.75}>
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      ) : acquis ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0b0b0d" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
      ) : (
        <Pictogramme domaine={domaine} taille={22} couleur={statut === 'unlocked' ? couleur : meta.border} />
      )}
    </button>
  );
}

// Le grand rond du tronc (niveau 3) : se remplit en anneau selon le
// pourcentage d'avancement global de l'Armure Organique.
function NoeudTroncPrincipal({ x, y, pourcentage, statut, onClick }: { x: number; y: number; pourcentage: number; statut: StatutAffiche; onClick: () => void }) {
  const rayon = 15.5;
  const circonference = 2 * Math.PI * rayon;
  const acquis = statut === 'acquis';
  const locked = statut === 'locked';
  const pulse = statut === 'en_attente';
  return (
    <button onClick={onClick} aria-label="Armure Organique — niveau 3" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', width: 58, height: 58, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <svg width="58" height="58" viewBox="0 0 40 40" style={{ animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : 'none' }}>
        <circle cx="20" cy="20" r={rayon} fill={acquis ? COULEUR_TRONC : locked ? '#131316' : '#17171b'} />
        <circle cx="20" cy="20" r={rayon} fill="none" stroke={locked ? `${COULEUR_TRONC}55` : COULEURS.bordure} strokeWidth="2.5" strokeDasharray={locked ? '2 2' : undefined} />
        {!locked && (
          <circle
            cx="20" cy="20" r={rayon} fill="none" stroke={COULEUR_TRONC} strokeWidth="2.5"
            strokeDasharray={circonference} strokeDashoffset={circonference * (1 - pourcentage / 100)}
            strokeLinecap="round" transform="rotate(-90 20 20)"
            style={{ transition: 'stroke-dashoffset 0.6s ease', filter: pourcentage > 0 ? `drop-shadow(0 0 4px ${COULEUR_TRONC})` : 'none' }}
          />
        )}
        {acquis ? (
          <path d="M13 20l5 5 10-10" stroke="#0b0b0d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : locked ? (
          <g transform="translate(13,13)" opacity={0.75}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COULEUR_TRONC} strokeWidth={2}>
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          </g>
        ) : (
          <g transform="translate(11.5,11.5) scale(0.7)"><Pictogramme domaine="tronc" taille={17} couleur={COULEUR_TRONC} /></g>
        )}
      </svg>
    </button>
  );
}

function FeuilleModale({ onFermer, children }: { onFermer: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 30 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#161618', border: `1px solid ${COULEURS.bordure}`, borderRadius: '16px 16px 0 0', padding: '20px 22px 32px', width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: COULEURS.bordure, marginInline: 'auto', marginBottom: 16 }} />
        {children}
      </div>
    </div>
  );
}

function StatutExercicePastille({ statut }: { statut: 'locked' | 'a_faire' | 'en_attente' | 'acquis' | 'refuse' }) {
  const map = {
    locked: { label: 'Verrouillé', couleur: COULEURS.texteFaible },
    a_faire: { label: 'À soumettre', couleur: COULEURS.texteAtt },
    en_attente: { label: 'En attente', couleur: '#FFC24B' },
    acquis: { label: 'Validé', couleur: '#9ef29e' },
    refuse: { label: 'À retravailler', couleur: '#ff6b6b' },
  } as const;
  const m = map[statut];
  return <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, border: `1px solid ${m.couleur}`, color: m.couleur, flexShrink: 0 }}>{m.label}</span>;
}

// Extrait l'ID YouTube d'une URL youtu.be/xxx ou youtube.com/watch?v=xxx —
// pour intégrer le lecteur directement sur la page, sans jamais renvoyer
// l'élève vers YouTube (pas de nouvel onglet, pas d'URL cliquable brute).
function idYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    return null;
  } catch {
    return null;
  }
}

// Lecteur vidéo en superposition (au-dessus du panneau du nœud) : la vidéo
// de référence du coach se lit intégralement sur la page du Mentorship,
// jamais sur YouTube directement.
function LecteurVideoModal({ url, titre, onFermer }: { url: string; titre: string; onFermer: () => void }) {
  const id = idYoutube(url);
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: COULEURS.texte, fontWeight: 600 }}>{titre}</p>
          <button onClick={onFermer} aria-label="Fermer" style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4 }}>×</button>
        </div>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          {id ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
              title={titre}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <p style={{ color: COULEURS.texteFaible, fontSize: 12, padding: 16 }}>Vidéo indisponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Un exercice indépendant (obligatoire ou progression bonus), avec son
// propre statut et son propre formulaire de soumission vidéo.
function BlocExercice({
  noeud, exercice, prog, estBonus, estAdmin, onOuvrirVideo,
}: {
  noeud: NoeudMentorshipPublic;
  exercice: ExerciceMentorship;
  prog?: Progression;
  estBonus: boolean;
  estAdmin?: boolean;
  onOuvrirVideo: (url: string, titre: string) => void;
}) {
  const statutEx: 'a_faire' | 'en_attente' | 'acquis' | 'refuse' =
    prog?.statut === 'acquis' ? 'acquis' : prog?.statut === 'refuse' ? 'refuse' : prog?.statut === 'en_attente' ? 'en_attente' : 'a_faire';

  return (
    <div style={{ background: COULEURS.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: COULEURS.texte }}>{exercice.nom}{estBonus ? ' 🔥' : ''}</p>
          {exercice.note && <p style={{ margin: '2px 0 0', fontSize: 11, color: COULEURS.texteFaible, fontStyle: 'italic' }}>{exercice.note}</p>}
          {exercice.videoUrl && (
            <button
              onClick={() => onOuvrirVideo(exercice.videoUrl, exercice.nom)}
              style={{ fontSize: 11, color: '#f0a', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              ▶ Voir la référence
            </button>
          )}
        </div>
        <StatutExercicePastille statut={statutEx} />
      </div>

      {!estAdmin && statutEx === 'refuse' && prog?.commentaire_coach && (
        <p style={{ fontSize: 12, color: '#ff6b6b', margin: '8px 0 0' }}>Retour de Sylvain : {prog.commentaire_coach}</p>
      )}
      {!estAdmin && statutEx === 'en_attente' && (
        <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '8px 0 0' }}>
          Envoyée —{' '}<a href={prog?.video_url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#f0a' }}>revoir ce que tu as envoyé</a>
        </p>
      )}
      {!estAdmin && (statutEx === 'a_faire' || statutEx === 'refuse') && (
        <form action={soumettreVideoExercice} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <input type="hidden" name="noeud_id" value={noeud.id} />
          <input type="hidden" name="exercice_id" value={exercice.id} />
          <input type="url" name="video_url" required placeholder="Lien de ta vidéo"
            style={{ flexGrow: 1, minWidth: 160, fontSize: 12, padding: '7px 10px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte }} />
          <button type="submit" style={{ fontSize: 12, padding: '7px 12px', borderRadius: 999, border: '1px solid #f0a', background: 'rgba(255,0,170,0.1)', color: '#f0a', cursor: 'pointer' }}>
            {statutEx === 'refuse' ? 'Renvoyer' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  );
}

function PanneauNoeud({
  noeud, statut, progression, progressionMap, couleur, reponsesQCM, setReponsesQCM, estAdmin, onFermer,
}: {
  noeud: NoeudMentorshipPublic;
  statut: string;
  progression?: Progression;
  progressionMap: Map<string, Progression>;
  couleur: string;
  reponsesQCM: Record<string, number>;
  setReponsesQCM: (fn: (r: Record<string, number>) => Record<string, number>) => void;
  estAdmin?: boolean;
  onFermer: () => void;
}) {
  const label = noeud.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[noeud.domaine as Domaine];
  const aDesExercices = (noeud.exercices?.length ?? 0) > 0;
  const [videoOuverte, setVideoOuverte] = useState<{ url: string; titre: string } | null>(null);

  return (
    <FeuilleModale onFermer={onFermer}>
      {videoOuverte && (
        <LecteurVideoModal url={videoOuverte.url} titre={videoOuverte.titre} onFermer={() => setVideoOuverte(null)} />
      )}
      <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>{label.toUpperCase()} · NIVEAU {noeud.niveau}</span>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 4px', color: COULEURS.texte }}>{noeud.titre}</h2>

      {statut === 'locked' ? (
        <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginTop: 8 }}>🔒 Ce niveau est encore verrouillé.</p>
      ) : aDesExercices ? (
        <>
          <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{noeud.resume}</p>
          {!noeud.contenuDefini && (
            <p style={{ color: COULEURS.texteFaible, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
              Théorie et QCM à venir — les exercices ci-dessous sont déjà soumissibles.
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Exercices à valider ({noeud.exercices!.filter((ex) => progressionMap.get(moduleIdExercice(noeud, ex))?.statut === 'acquis').length}/{noeud.exercices!.length})
            </p>
            {noeud.exercices!.map((ex) => (
              <BlocExercice key={ex.id} noeud={noeud} exercice={ex} prog={progressionMap.get(moduleIdExercice(noeud, ex))} estBonus={false} estAdmin={estAdmin} onOuvrirVideo={(url, titre) => setVideoOuverte({ url, titre })} />
            ))}
          </div>

          {(noeud.progressionBonus?.length ?? 0) > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🔥 Progression bonus (facultatif, dépassement)
              </p>
              {noeud.progressionBonus!.map((ex) => (
                <BlocExercice key={ex.id} noeud={noeud} exercice={ex} prog={progressionMap.get(moduleIdExercice(noeud, ex))} estBonus estAdmin={estAdmin} onOuvrirVideo={(url, titre) => setVideoOuverte({ url, titre })} />
              ))}
            </div>
          )}
        </>
      ) : !noeud.contenuDefini ? (
        <p style={{ color: COULEURS.texteAtt, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
          Ce niveau n'a pas encore de contenu détaillé — théorie, programmation et QCM restent à définir avec Sylvain.
        </p>
      ) : (
        <>
          <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{noeud.resume}</p>
          <p style={{ color: COULEURS.texteFaible, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>Objectif : {noeud.objectifPedagogique}</p>

          {noeud.theorie.map((t) => (
            <div key={t.titre} style={{ marginTop: 14, borderLeft: `2px solid ${couleur}`, paddingLeft: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: COULEURS.texte }}>{t.titre}</p>
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.7, margin: '4px 0 0' }}>{t.texte}</p>
            </div>
          ))}

          {noeud.programmation.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Programmation</p>
              {noeud.programmation.map((p, i) => (
                <div key={i} style={{ background: COULEURS.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}><strong>Cible :</strong> {p.cible}</p>
                  <p style={{ margin: '4px 0 0', color: COULEURS.texteAtt }}><strong>Régression :</strong> {p.regression}</p>
                  <p style={{ margin: '4px 0 0', color: COULEURS.texteAtt }}><strong>Progression :</strong> {p.progression}</p>
                </div>
              ))}
            </div>
          )}

          {!estAdmin && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COULEURS.bordure}` }}>
              {statut === 'acquis' && <p style={{ fontSize: 13, color: '#9ef29e' }}>Niveau validé par Sylvain — bravo, la suite est débloquée.</p>}

              {statut === 'en_attente' && (
                <p style={{ fontSize: 13, color: COULEURS.texteAtt }}>
                  Ta vidéo a été envoyée, Sylvain la regarde bientôt.{' '}
                  <a href={progression?.video_url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#f0a' }}>Revoir ce que tu as envoyé</a>
                </p>
              )}

              {(statut === 'qcm_reussi' || statut === 'refuse') && (
                <>
                  {statut === 'refuse' && progression?.commentaire_coach && (
                    <p style={{ fontSize: 13, color: '#ff6b6b', marginBottom: 10 }}>Retour de Sylvain : {progression.commentaire_coach}</p>
                  )}
                  {statut === 'qcm_reussi' && (
                    <p style={{ fontSize: 13, color: '#9ef29e', marginBottom: 10 }}>QCM réussi ({progression?.quiz_score}%) — envoie ta vidéo pour validation.</p>
                  )}
                  <form action={soumettreVideo} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input type="hidden" name="noeud_id" value={noeud.id} />
                    <input type="url" name="video_url" required placeholder="Lien de ta vidéo (YouTube non répertorié, Drive...)"
                      style={{ flexGrow: 1, minWidth: 200, fontSize: 13, padding: '9px 12px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte }} />
                    <button type="submit" style={{ fontSize: 13, padding: '9px 16px', borderRadius: 999, border: '1px solid #f0a', background: 'rgba(255,0,170,0.1)', color: '#f0a', cursor: 'pointer' }}>
                      {statut === 'refuse' ? 'Renvoyer une vidéo' : 'Soumettre pour validation'}
                    </button>
                  </form>
                </>
              )}

              {statut === 'unlocked' && noeud.qcm.length > 0 && (
                <form action={repondreQCM}>
                  <input type="hidden" name="noeud_id" value={noeud.id} />
                  <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    QCM — réussis-le pour débloquer l'envoi de ta vidéo
                  </p>
                  {noeud.qcm.map((q, i) => (
                    <div key={q.id} style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, marginBottom: 6, color: COULEURS.texte }}>{i + 1}. {q.question}</p>
                      {q.choix.map((choix, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COULEURS.texteAtt, marginBottom: 4, cursor: 'pointer' }}>
                          <input
                            type="radio" name={`reponse-${q.id}`} value={idx} required
                            onChange={() => setReponsesQCM((r) => ({ ...r, [q.id]: idx }))}
                          />
                          {choix}
                        </label>
                      ))}
                    </div>
                  ))}
                  <button type="submit" style={{ fontSize: 13, padding: '9px 16px', borderRadius: 999, border: '1px solid #f0a', background: 'rgba(255,0,170,0.1)', color: '#f0a', cursor: 'pointer' }}>
                    Valider mes réponses
                  </button>
                </form>
              )}

              {statut === 'unlocked' && noeud.qcm.length === 0 && (
                <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>Pas encore de QCM pour ce niveau — contenu à venir.</p>
              )}
            </div>
          )}
        </>
      )}
    </FeuilleModale>
  );
}
