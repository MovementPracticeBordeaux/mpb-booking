'use client';

import { useState, useMemo } from 'react';
import {
  ORDRE_DOMAINES,
  DOMAINE_LABELS,
  DOMAINE_COULEURS,
  COULEUR_TRONC,
  Domaine,
  DomaineOuTronc,
  NoeudMentorshipPublic,
  statutXP,
  xpGagneParNoeud,
  XP_BONUS_DEFI_QUOTIDIEN,
} from '@/lib/mentorship-modules';
import { COULEURS, POLICE_DISPLAY, POLICE_CORPS } from '@/lib/theme';
import { soumettreVideo, repondreQCM, validerDefiQuotidien } from './actions';

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
const BRANCH_LEVEL_Y: Record<1 | 2 | 3, number> = { 3: 8, 2: 27, 1: 46 };
const JUNCTION_Y = 54;
const TRUNK_LEVEL_Y: Record<1 | 2 | 3, number> = { 3: 64, 2: 80, 1: 96 };
const TRUNK_X = 50;
const BRANCH_X: Record<Domaine, number> = { connexion: 10, flexibilite: 30, force: 50, figures: 70, locomotion: 90 };

const STATUT_META: Record<Exclude<StatutAffiche, 'unlocked'>, { label: string; fill: string; border: string; dash?: string }> = {
  locked: { label: 'Verrouillé', fill: 'rgba(255,255,255,0.03)', border: COULEURS.bordure },
  qcm_reussi: { label: 'QCM validé — vidéo à envoyer', fill: COULEURS.surfaceForte, border: '#FF8A00' },
  en_attente: { label: 'Vidéo envoyée — en attente', fill: COULEURS.surfaceForte, border: '#FFC24B', dash: '3 3' },
  refuse: { label: 'À retravailler', fill: 'rgba(255,107,107,0.12)', border: '#ff6b6b' },
  acquis: { label: 'Acquis', fill: '', border: '' },
};

function metaPour(statut: StatutAffiche, couleurBranche: string) {
  if (statut === 'locked') return STATUT_META.locked;
  if (statut === 'unlocked') return { label: 'Débloqué', fill: 'transparent', border: couleurBranche };
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

// --- En-tête XP / niveau ---------------------------------------------------
function EnTeteXP({ xpTotal, niveau }: { xpTotal: number; niveau: Niveau }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="url(#flamme)">
          <defs>
            <linearGradient id="flamme" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3B30" /><stop offset="100%" stopColor="#FF8A00" />
            </linearGradient>
          </defs>
          <path d="M12 2c1 3-2 4-2 7a3 3 0 003 3c2 0 3-1.5 3-3 2 2 3 4 3 6a6 6 0 11-12 0c0-4 2-6 5-13z" />
        </svg>
        <div>
          <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, color: COULEURS.texte }}>{xpTotal.toLocaleString('fr-FR')} XP</p>
          <p style={{ margin: 0, fontSize: 11, color: COULEURS.texteFaible }}>Points Mouvement</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, color: '#f0a' }}>Niveau {niveau.niveau}</p>
        <p style={{ margin: 0, fontSize: 11, color: COULEURS.texteFaible }}>{niveau.titre}</p>
      </div>
    </div>
  );
}

// --- Panneau "Ta progression" (jauges + détail par zone, déroulé en place) --
function LigneProgression({ label, pourcentage, couleur, domaine, entrees }: { label: string; pourcentage: number; couleur: string; domaine: DomaineOuTronc; entrees: EntreeBilan[] }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${COULEURS.bordure}`, paddingBottom: 10 }}>
      <button onClick={() => setOuvert((o) => !o)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COULEURS.texteFaible} strokeWidth={2.5} style={{ transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: COULEURS.texte, flexGrow: 1 }}>{label}</span>
          <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>{pourcentage}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: COULEURS.surfaceForte, overflow: 'hidden', marginLeft: 18 }}>
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

// --- Panneau "Défis quotidiens" --------------------------------------------
function DefisQuotidiens({ defis, defisValidesAujourdhui }: {
  defis: { id: string; titre: string; cible: string; couleur: string; domaine: DomaineOuTronc }[];
  defisValidesAujourdhui: Set<string>;
}) {
  if (defis.length === 0) return null;
  return (
    <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 10px', color: COULEURS.texte }}>Défis quotidiens</p>
      {defis.map((d) => {
        const fait = defisValidesAujourdhui.has(d.id);
        return (
          <form key={d.id} action={validerDefiQuotidien} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${COULEURS.bordure}` }}>
            <input type="hidden" name="noeud_id" value={d.id} />
            <button
              type="submit"
              disabled={fait}
              aria-label={fait ? 'Défi fait aujourd\'hui' : 'Marquer comme fait'}
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
  );
}

export default function ArbreCompetences({
  tronc,
  branches,
  progression,
  bilan,
  xpTotal,
  niveau,
  defisValidesAujourdhui,
  estAdmin,
}: {
  tronc: NoeudMentorshipPublic[];
  branches: NoeudMentorshipPublic[];
  progression: Map<string, Progression>;
  bilan: EntreeBilan[];
  xpTotal: number;
  niveau: Niveau;
  defisValidesAujourdhui: Set<string>;
  estAdmin?: boolean;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [reponsesQCM, setReponsesQCM] = useState<Record<string, number>>({});

  const idsAcquis = new Set(
    [...progression.entries()].filter(([, p]) => p.statut === 'acquis').map(([id]) => id)
  );
  const troncComplet = tronc.every((n) => idsAcquis.has(n.id));

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
    const prog = progression.get(noeud.id);
    if (!prog) return 'unlocked';
    if (prog.statut === 'acquis') return 'acquis';
    if (prog.statut === 'refuse') return 'refuse';
    if (prog.statut === 'en_attente') return 'en_attente';
    if (prog.quiz_reussi) return 'qcm_reussi';
    return 'unlocked';
  }

  function pourcentageBranche(branche: DomaineOuTronc) {
    const noeuds = branche === 'tronc' ? tronc : branches.filter((n) => n.domaine === branche);
    const acquis = noeuds.filter((n) => idsAcquis.has(n.id)).length;
    return Math.round((acquis / noeuds.length) * 100);
  }

  const pourcentageTronc = pourcentageBranche('tronc');

  // Défis du jour : la programmation des compétences débloquées mais pas
  // encore acquises (tronc + branches).
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
    segs.push({ x1: TRUNK_X, y1: JUNCTION_Y, x2: TRUNK_X, y2: TRUNK_LEVEL_Y[1], active: true, key: 'tronc' });
    return segs;
  }, [troncComplet]);

  const noeudSelectionne = selection ? [...tronc, ...branches].find((n) => n.id === selection) ?? null : null;

  return (
    <div style={{ fontFamily: POLICE_CORPS }}>
      <style>{`
        @keyframes pulse-noeud { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes glow-acquis { 0%, 100% { filter: drop-shadow(0 0 3px currentColor); } 50% { filter: drop-shadow(0 0 8px currentColor); } }
      `}</style>

      <EnTeteXP xpTotal={xpTotal} niveau={niveau} />

      <DefisQuotidiens defis={defisDuJour} defisValidesAujourdhui={defisValidesAujourdhui} />

      {/* Ta progression */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.3, margin: '0 0 2px', color: COULEURS.texte }}>Ta progression</p>
        <LigneProgression label="Armure Organique" pourcentage={pourcentageTronc} couleur={COULEUR_TRONC} domaine="tronc" entrees={bilan.filter((b) => b.domaine === 'tronc')} />
        {ORDRE_DOMAINES.map((d) => (
          <LigneProgression key={d} label={DOMAINE_LABELS[d]} pourcentage={pourcentageBranche(d)} couleur={DOMAINE_COULEURS[d]} domaine={d} entrees={bilan.filter((b) => b.domaine === d)} />
        ))}
      </div>

      {/* Arbre */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 640, marginInline: 'auto', aspectRatio: '4 / 5' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="gradient-lignes" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FF3B30" /><stop offset="35%" stopColor="#FF8A00" /><stop offset="70%" stopColor="#FF2D78" /><stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          {lignes.map((l) => (
            <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.active ? 'url(#gradient-lignes)' : COULEURS.bordure} strokeWidth={l.active ? 0.9 : 0.5} opacity={l.active ? 0.85 : 1} />
          ))}
        </svg>

        {/* Étiquettes des branches */}
        {ORDRE_DOMAINES.map((d) => (
          <div key={`label-${d}`} style={{ position: 'absolute', left: `${BRANCH_X[d]}%`, top: `${BRANCH_LEVEL_Y[3] - 5}%`, transform: 'translate(-50%, -50%)', fontFamily: POLICE_DISPLAY, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: COULEURS.texteFaible, whiteSpace: 'nowrap' }}>
            {DOMAINE_LABELS[d]}
          </div>
        ))}

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
        <div style={{ position: 'absolute', left: `${TRUNK_X}%`, top: `${TRUNK_LEVEL_Y[3] + 10}%`, transform: 'translate(-50%, -50%)', fontFamily: POLICE_DISPLAY, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f0a', whiteSpace: 'nowrap' }}>
          Armure Organique
        </div>
      </div>

      {!troncComplet && (
        <p style={{ textAlign: 'center', fontSize: 13, color: COULEURS.texteFaible, marginTop: 12 }}>
          Les branches restent verrouillées tant que l'Armure Organique n'est pas validée en entier (niveau 3).
        </p>
      )}

      {/* Panneau détail nœud */}
      {noeudSelectionne && (
        <PanneauNoeud
          noeud={noeudSelectionne}
          statut={statutAffiche(noeudSelectionne)}
          progression={progression.get(noeudSelectionne.id)}
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

function Noeud({ x, y, statut, couleur, domaine, onClick }: { x: number; y: number; statut: StatutAffiche; couleur: string; domaine: DomaineOuTronc; onClick: () => void }) {
  const meta = metaPour(statut, couleur);
  const pulse = statut === 'en_attente';
  const acquis = statut === 'acquis';
  return (
    <button
      onClick={onClick}
      aria-label={meta.label}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
        width: 34, height: 34, borderRadius: '50%',
        background: acquis ? `radial-gradient(circle at 35% 30%, ${couleur}, ${couleur}bb)` : meta.fill,
        border: `2.5px ${meta.dash ? 'dashed' : 'solid'} ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : acquis ? 'glow-acquis 2.4s ease-in-out infinite' : 'none',
        color: couleur,
        boxShadow: acquis ? `0 0 14px ${couleur}88` : 'none',
      }}
    >
      {statut === 'locked' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COULEURS.texteFaible} strokeWidth={2}>
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      ) : acquis ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0b0b0d" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
      ) : (
        <Pictogramme domaine={domaine} taille={13} couleur={statut === 'unlocked' ? couleur : meta.border} />
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
  const pulse = statut === 'en_attente';
  return (
    <button onClick={onClick} aria-label="Armure Organique — niveau 3" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', width: 46, height: 46, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <svg width="46" height="46" viewBox="0 0 40 40" style={{ animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : 'none' }}>
        <circle cx="20" cy="20" r={rayon} fill={acquis ? COULEUR_TRONC : 'rgba(255,255,255,0.04)'} opacity={acquis ? 1 : 1} />
        <circle cx="20" cy="20" r={rayon} fill="none" stroke={COULEURS.bordure} strokeWidth="2.5" />
        <circle
          cx="20" cy="20" r={rayon} fill="none" stroke={COULEUR_TRONC} strokeWidth="2.5"
          strokeDasharray={circonference} strokeDashoffset={circonference * (1 - pourcentage / 100)}
          strokeLinecap="round" transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.6s ease', filter: pourcentage > 0 ? `drop-shadow(0 0 4px ${COULEUR_TRONC})` : 'none' }}
        />
        {acquis ? (
          <path d="M13 20l5 5 10-10" stroke="#0b0b0d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

function PanneauNoeud({
  noeud, statut, progression, couleur, reponsesQCM, setReponsesQCM, estAdmin, onFermer,
}: {
  noeud: NoeudMentorshipPublic;
  statut: string;
  progression?: Progression;
  couleur: string;
  reponsesQCM: Record<string, number>;
  setReponsesQCM: (fn: (r: Record<string, number>) => Record<string, number>) => void;
  estAdmin?: boolean;
  onFermer: () => void;
}) {
  const label = noeud.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[noeud.domaine as Domaine];

  return (
    <FeuilleModale onFermer={onFermer}>
      <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>{label.toUpperCase()} · NIVEAU {noeud.niveau}</span>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 4px', color: COULEURS.texte }}>{noeud.titre}</h2>

      {statut === 'locked' ? (
        <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginTop: 8 }}>🔒 Ce niveau est encore verrouillé.</p>
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
