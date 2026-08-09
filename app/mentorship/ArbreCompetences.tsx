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
} from '@/lib/mentorship-modules';
import { COULEURS, POLICE_DISPLAY, POLICE_CORPS } from '@/lib/theme';
import { soumettreVideo, repondreQCM } from './actions';

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
  acquis: { label: 'Acquis', fill: '', border: '' }, // couleur de branche appliquée dynamiquement
};

function metaPour(statut: StatutAffiche, couleurBranche: string) {
  if (statut === 'locked') return STATUT_META.locked;
  if (statut === 'unlocked') return { label: 'Débloqué', fill: 'transparent', border: couleurBranche };
  if (statut === 'acquis') return { label: 'Acquis', fill: couleurBranche, border: couleurBranche };
  return STATUT_META[statut];
}

export default function ArbreCompetences({
  tronc,
  branches,
  progression,
  bilan,
  estAdmin,
}: {
  tronc: NoeudMentorshipPublic[];
  branches: NoeudMentorshipPublic[];
  progression: Map<string, Progression>;
  bilan: EntreeBilan[];
  estAdmin?: boolean;
}) {
  const [selection, setSelection] = useState<{ type: 'noeud' | 'jauge'; id: string } | null>(null);
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

  const noeudSelectionne = selection?.type === 'noeud'
    ? [...tronc, ...branches].find((n) => n.id === selection.id) ?? null
    : null;
  const jaugeSelectionnee = selection?.type === 'jauge' ? (selection.id as DomaineOuTronc) : null;

  return (
    <div style={{ fontFamily: POLICE_CORPS }}>
      <style>{`@keyframes pulse-noeud { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* Jauges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
        <Jauge label="Armure Organique (tronc)" pourcentage={pourcentageBranche('tronc')} couleur={COULEUR_TRONC} onClick={() => setSelection({ type: 'jauge', id: 'tronc' })} />
        {ORDRE_DOMAINES.map((d) => (
          <Jauge key={d} label={DOMAINE_LABELS[d]} pourcentage={pourcentageBranche(d)} couleur={DOMAINE_COULEURS[d]} onClick={() => setSelection({ type: 'jauge', id: d })} />
        ))}
      </div>

      {/* Arbre */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 640, marginInline: 'auto', aspectRatio: '4 / 5' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {lignes.map((l) => (
            <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.active ? COULEUR_TRONC : COULEURS.bordure} strokeWidth={0.5} />
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
              <NoeudRond
                key={noeud.id}
                x={BRANCH_X[d]} y={BRANCH_LEVEL_Y[lvl]}
                statut={statutAffiche(noeud)}
                couleur={DOMAINE_COULEURS[d]}
                onClick={() => setSelection({ type: 'noeud', id: noeud.id })}
              />
            );
          })
        )}

        {/* Nœuds du tronc */}
        {tronc.map((noeud) => (
          <NoeudTronc
            key={noeud.id}
            x={TRUNK_X} y={TRUNK_LEVEL_Y[noeud.niveau]}
            statut={statutAffiche(noeud)}
            onClick={() => setSelection({ type: 'noeud', id: noeud.id })}
          />
        ))}
        <div style={{ position: 'absolute', left: `${TRUNK_X}%`, top: `${TRUNK_LEVEL_Y[1] + 6}%`, transform: 'translate(-50%, -50%)', fontFamily: POLICE_DISPLAY, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: COULEURS.texteFaible, whiteSpace: 'nowrap' }}>
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

      {/* Panneau bilan (jauge) */}
      {jaugeSelectionnee && (
        <PanneauBilan
          branche={jaugeSelectionnee}
          entrees={bilan.filter((b) => b.domaine === jaugeSelectionnee)}
          couleur={jaugeSelectionnee === 'tronc' ? COULEUR_TRONC : DOMAINE_COULEURS[jaugeSelectionnee as Domaine]}
          onFermer={() => setSelection(null)}
        />
      )}
    </div>
  );
}

function Jauge({ label, pourcentage, couleur, onClick }: { label: string; pourcentage: number; couleur: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: COULEURS.texte }}>{label}</span>
        <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>{pourcentage}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: COULEURS.surfaceForte, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pourcentage}%`, background: couleur, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </button>
  );
}

function NoeudRond({ x, y, statut, couleur, onClick }: { x: number; y: number; statut: string; couleur: string; onClick: () => void }) {
  const meta = metaPour(statut as any, couleur);
  const pulse = statut === 'en_attente';
  return (
    <button
      onClick={onClick}
      aria-label={meta.label}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
        width: 26, height: 26, borderRadius: '50%',
        background: meta.fill, border: `2.5px ${meta.dash ? 'dashed' : 'solid'} ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : 'none',
        boxShadow: statut === 'acquis' ? `0 0 10px ${couleur}66` : 'none',
      }}
    >
      {statut === 'acquis' && <span style={{ color: '#0b0b0d', fontSize: 13, lineHeight: 1 }}>✓</span>}
      {statut === 'qcm_reussi' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8A00' }} />}
      {statut === 'locked' && <span style={{ fontSize: 10 }}>🔒</span>}
    </button>
  );
}

function NoeudTronc({ x, y, statut, onClick }: { x: number; y: number; statut: string; onClick: () => void }) {
  const meta = metaPour(statut as any, COULEUR_TRONC);
  const pulse = statut === 'en_attente';
  return (
    <button
      onClick={onClick}
      aria-label={meta.label}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
        width: 30, height: 30,
        clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
        background: meta.fill, border: `2.5px ${meta.dash ? 'dashed' : 'solid'} ${meta.border}`, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        animation: pulse ? 'pulse-noeud 1.8s ease-in-out infinite' : 'none',
        boxShadow: statut === 'acquis' ? `0 0 12px ${COULEUR_TRONC}77` : 'none',
      }}
    >
      {statut === 'acquis' && <span style={{ color: '#0b0b0d', fontSize: 14, lineHeight: 1 }}>✓</span>}
      {statut === 'qcm_reussi' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8A00' }} />}
      {statut === 'locked' && <span style={{ fontSize: 10 }}>🔒</span>}
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
  const toutesReponduesQCM = noeud.qcm.every((q) => reponsesQCM[q.id] !== undefined);

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

function PanneauBilan({ branche, entrees, couleur, onFermer }: { branche: DomaineOuTronc; entrees: EntreeBilan[]; couleur: string; onFermer: () => void }) {
  const label = branche === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[branche as Domaine];
  const META_STATUT: Record<EntreeBilan['statut'], { label: string; couleur: string }> = {
    acquis: { label: 'Acquis', couleur: '#9ef29e' },
    en_cours: { label: 'En cours', couleur: '#FFC24B' },
    difficulte_recurrente: { label: 'Difficulté récurrente', couleur: '#ff6b6b' },
  };
  return (
    <FeuilleModale onFermer={onFermer}>
      <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>{label.toUpperCase()}</span>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 12px', color: COULEURS.texte }}>Bilan de compétences</h2>
      {entrees.length === 0 ? (
        <p style={{ fontSize: 13, color: COULEURS.texteFaible, lineHeight: 1.6 }}>
          Sylvain n'a pas encore renseigné de bilan détaillé sur cette branche — ça viendra au fil de vos échanges vidéo.
        </p>
      ) : (
        entrees.map((e, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${COULEURS.bordure}`, padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: COULEURS.texte }}>{e.exercice_ou_theme}</span>
              <span style={{ fontSize: 12, color: META_STATUT[e.statut].couleur, flexShrink: 0 }}>{META_STATUT[e.statut].label}</span>
            </div>
            {e.commentaire && <p style={{ fontSize: 12, color: COULEURS.texteAtt, margin: '4px 0 0' }}>{e.commentaire}</p>}
          </div>
        ))
      )}
    </FeuilleModale>
  );
}
