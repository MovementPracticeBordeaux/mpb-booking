'use client';

import { useState } from 'react';
import { DOMAINE_LABELS, DOMAINE_COULEURS, DOMAINE_ACCROCHES, Domaine } from '@/lib/mentorship-modules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY, POLICE_CORPS } from '@/lib/theme';

const NIVEAUX = [1, 2, 3] as const;
type Niveau = (typeof NIVEAUX)[number];

export type ExerciceContenu = { nom: string; videoUrl: string | null; note: string | null };
export type ContenuNiveau = { titre: string; resume: string; aValider: ExerciceContenu[]; bonus: ExerciceContenu[] };

function cle(d: Domaine, n: Niveau) {
  return `${d}-${n}`;
}

// Ordre visuel des branches (gauche -> droite), repris de l'arbre existant
// (ArbreCompetences.ORDRE_VISUEL) pour rester cohérent avec le reste du site
// — différent de ORDRE_DOMAINES (ordre logique interne).
const ORDRE_VISUEL: Domaine[] = ['connexion', 'flexibilite', 'force', 'figures', 'locomotion'];
const BRANCH_X: Record<Domaine, number> = { connexion: 10, flexibilite: 30, force: 50, figures: 70, locomotion: 90 };
const NIVEAU_Y: Record<Niveau, number> = { 3: 14, 2: 42, 1: 70 };
const BASE_X = 50;
const BASE_Y = 92;
const COULEUR_RACINE = '#ff00aa';

// Quêtes secondaires d'exemple — à remplacer par la vraie liste de Sylvain.
// Se valident comme les niveaux (vidéo élève -> validation coach), mais ne
// bloquent et ne sont bloquées par rien dans la progression des piliers.
type StatutQuete = 'a_faire' | 'video_envoyee' | 'valide';
const ORDRE_STATUT_QUETE: StatutQuete[] = ['a_faire', 'video_envoyee', 'valide'];
const LABEL_STATUT_QUETE: Record<StatutQuete, string> = {
  a_faire: 'À faire',
  video_envoyee: 'Vidéo envoyée',
  valide: 'Validée',
};

type Quete = { id: string; titre: string; domaine: Domaine; note?: string };
const QUETES_EXEMPLE: Quete[] = [
  { id: 'pancake', titre: 'Le Pancake', domaine: 'flexibilite', note: 'Buste à plat, jambes tendues au sol' },
  { id: 'front-lever', titre: 'Front lever 5s', domaine: 'force' },
  { id: 'human-flag', titre: 'Human flag', domaine: 'force' },
  { id: 'planche', titre: 'Planche complète', domaine: 'figures' },
  { id: 'roue-arriere', titre: 'Roue arrière enchaînée', domaine: 'locomotion' },
  { id: 'grand-ecart', titre: 'Grand écart facial', domaine: 'flexibilite' },
];

// Ligne d'un exercice à valider/bonus — avec lien vidéo quand dispo.
function LigneExercice({ ex, couleur, muted }: { ex: ExerciceContenu; couleur: string; muted?: boolean }) {
  const contenuTexte = (
    <>
      <span style={{ color: muted ? COULEURS.texteAtt : COULEURS.texte }}>{ex.nom}</span>
      {ex.note && <span style={{ display: 'block', fontSize: 11, color: COULEURS.texteFaible, marginTop: 1 }}>{ex.note}</span>}
    </>
  );
  if (!ex.videoUrl) {
    return (
      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0' }}>
        <span style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: COULEURS.texteFaible }}>—</span>
        <span>{contenuTexte}</span>
      </li>
    );
  }
  return (
    <li>
      <a
        href={ex.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="piliers-lien-video"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 6px', margin: '0 -6px', borderRadius: 6, textDecoration: 'none' }}
      >
        <span
          style={{
            width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${couleur}22`, color: couleur, fontSize: 8,
          }}
        >
          ▶
        </span>
        <span>{contenuTexte}</span>
      </a>
    </li>
  );
}

export default function PiliersTestClient({ domaines, contenu }: { domaines: Domaine[]; contenu: Record<string, ContenuNiveau> }) {
  // niveau validé (globalement, tous piliers confondus) -> Set de "domaine-niveau"
  const [valides, setValides] = useState<Set<string>>(new Set());
  const [statutsQuetes, setStatutsQuetes] = useState<Record<string, StatutQuete>>({});
  const [selection, setSelection] = useState<{ d: Domaine; n: Niveau } | null>(null);

  function niveauDebloque(d: Domaine, n: Niveau): boolean {
    if (n === 1) return true;
    // Débloqué seulement si TOUS les piliers ont validé le niveau précédent.
    return domaines.every((dom) => valides.has(cle(dom, (n - 1) as Niveau)));
  }

  function toggleValidation(d: Domaine, n: Niveau) {
    if (!niveauDebloque(d, n)) return;
    setValides((prev) => {
      const suivant = new Set(prev);
      const k = cle(d, n);
      if (suivant.has(k)) suivant.delete(k);
      else suivant.add(k);
      return suivant;
    });
  }

  function cyclerQuete(id: string) {
    setStatutsQuetes((prev) => {
      const actuel = prev[id] ?? 'a_faire';
      const i = ORDRE_STATUT_QUETE.indexOf(actuel);
      const suivant = ORDRE_STATUT_QUETE[(i + 1) % ORDRE_STATUT_QUETE.length];
      return { ...prev, [id]: suivant };
    });
  }

  const niveauGlobalAtteint = (NIVEAUX as readonly Niveau[])
    .filter((n) => domaines.every((d) => valides.has(cle(d, n))))
    .length;

  function palierComplet(n: Niveau): boolean {
    return domaines.every((d) => valides.has(cle(d, n)));
  }

  const detail = selection ? contenu[cle(selection.d, selection.n)] : null;
  const xMin = Math.min(...ORDRE_VISUEL.map((d) => BRANCH_X[d]));
  const xMax = Math.max(...ORDRE_VISUEL.map((d) => BRANCH_X[d]));

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px 60px', fontFamily: POLICE_CORPS, color: COULEURS.texte }}>
      <style>{`
        .piliers-noeud:not(:disabled):hover { transform: translate(-50%,-50%) scale(1.1) !important; }
        .piliers-lien-video:hover { background: rgba(255,255,255,0.05); }
        .piliers-lien-video:hover span:first-child { filter: brightness(1.3); }
        .piliers-quete:hover { border-color: rgba(255,255,255,0.28) !important; background: rgba(255,255,255,0.04); }
        .piliers-detail-enter { animation: piliers-fade 0.18s ease; }
        @keyframes piliers-fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
        <div style={{ padding: '6px 12px', display: 'inline-block', borderRadius: 999, border: `1px dashed ${COULEURS.bordure}`, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: COULEURS.texteFaible }}>
          Prototype — rien n'est sauvegardé
        </div>
        <button
          onClick={() => { setValides(new Set()); setSelection(null); }}
          style={{ background: 'none', border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, color: COULEURS.texteAtt, cursor: 'pointer', padding: '5px 12px', fontSize: 12 }}
        >
          ↺ Réinitialiser
        </button>
      </div>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 36, letterSpacing: 0.5, margin: '6px 0 6px', ...GRADIENT_TEXTE }}>5 Piliers</h1>
      <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 660 }}>
        Verrouillage global : chaque palier (ligne pointillée) ne s'allume que quand les <strong>5 piliers</strong> ont
        validé leur niveau à cette hauteur — alors seulement le niveau suivant se débloque, partout à la fois.
      </p>

      {/* Légende + progression globale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12, color: COULEURS.texteFaible, margin: '0 0 24px', padding: '10px 14px', border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, background: COULEURS.surface }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${COULEURS.texteFaible}`, background: `${COULEURS.texteFaible}22`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>🔒</span>
          Verrouillé
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${COULEURS.texte}`, background: COULEURS.fond, display: 'inline-block' }} />
          Débloqué
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: COULEUR_RACINE, boxShadow: `0 0 6px ${COULEUR_RACINE}88`, display: 'inline-block' }} />
          Validé
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 2, background: COULEUR_RACINE, display: 'inline-block' }} />
          Palier complet (5/5)
        </span>
        <span style={{ marginLeft: 'auto', color: COULEURS.texte }}>
          Niveau global atteint : <strong>{niveauGlobalAtteint}</strong> / {NIVEAUX.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* --- Colonne principale : arbre + panneau détail --------------- */}
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '62%' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Paliers horizontaux — le "verrouillage global" rendu visible */}
              {(NIVEAUX as readonly Niveau[]).map((n) => {
                const complet = palierComplet(n);
                return (
                  <line
                    key={`palier-${n}`}
                    x1={xMin} y1={NIVEAU_Y[n]} x2={xMax} y2={NIVEAU_Y[n]}
                    stroke={complet ? COULEUR_RACINE : COULEURS.bordure}
                    strokeWidth={complet ? 0.5 : 0.3}
                    strokeDasharray={complet ? undefined : '1.2 1.2'}
                    opacity={complet ? 0.8 : 1}
                  />
                );
              })}

              {/* Racine commune -> base de chaque branche */}
              {ORDRE_VISUEL.map((d) => (
                <line
                  key={`racine-${d}`}
                  x1={BASE_X} y1={BASE_Y} x2={BRANCH_X[d]} y2={NIVEAU_Y[1]}
                  stroke={DOMAINE_COULEURS[d]} strokeWidth={0.6} opacity={0.5}
                />
              ))}

              {/* Tronçons de branche, niveau 1 -> 2 -> 3 */}
              {ORDRE_VISUEL.map((d) =>
                ([1, 2] as Niveau[]).map((n) => {
                  const suivant = (n + 1) as Niveau;
                  const actif = valides.has(cle(d, n));
                  return (
                    <line
                      key={`branche-${d}-${n}`}
                      x1={BRANCH_X[d]} y1={NIVEAU_Y[n]} x2={BRANCH_X[d]} y2={NIVEAU_Y[suivant]}
                      stroke={DOMAINE_COULEURS[d]} strokeWidth={actif ? 0.8 : 0.5} opacity={actif ? 0.9 : 0.35}
                    />
                  );
                })
              )}
            </svg>

            {/* Racine — point de convergence en bas */}
            <div style={{ position: 'absolute', left: `${BASE_X}%`, top: `${BASE_Y}%`, transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: COULEUR_RACINE, boxShadow: `0 0 8px ${COULEUR_RACINE}aa` }} />

            {/* Étiquettes de branche, au-dessus du niveau 3 */}
            {ORDRE_VISUEL.map((d) => (
              <div
                key={`label-${d}`}
                style={{
                  position: 'absolute', left: `${BRANCH_X[d]}%`, top: `${NIVEAU_Y[3] - 11}%`, transform: 'translate(-50%,-50%)',
                  textAlign: 'center', width: 96,
                }}
              >
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: DOMAINE_COULEURS[d] }}>{DOMAINE_LABELS[d]}</span>
                <span style={{ display: 'block', fontSize: 9, color: COULEURS.texteFaible, lineHeight: 1.3 }}>{DOMAINE_ACCROCHES[d]}</span>
              </div>
            ))}

            {/* Nœuds de niveau */}
            {ORDRE_VISUEL.map((d) =>
              (NIVEAUX as readonly Niveau[]).map((n) => {
                const debloque = niveauDebloque(d, n);
                const valide = valides.has(cle(d, n));
                const estSelectionne = selection?.d === d && selection?.n === n;
                const couleur = DOMAINE_COULEURS[d];
                return (
                  <button
                    key={`noeud-${d}-${n}`}
                    onClick={() => { if (debloque) setSelection({ d, n }); }}
                    disabled={!debloque}
                    aria-label={`${DOMAINE_LABELS[d]} niveau ${n}`}
                    className="piliers-noeud"
                    style={{
                      position: 'absolute', left: `${BRANCH_X[d]}%`, top: `${NIVEAU_Y[n]}%`, transform: 'translate(-50%,-50%)',
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `${estSelectionne ? 2.5 : 1.5}px solid ${debloque ? couleur : COULEURS.texteFaible}`,
                      background: valide ? couleur : debloque ? COULEURS.fond : `${couleur}0d`,
                      cursor: debloque ? 'pointer' : 'default',
                      boxShadow: valide ? `0 0 10px ${couleur}88` : estSelectionne ? `0 0 8px ${couleur}66` : 'none',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {!debloque ? (
                      <span style={{ fontSize: 13, opacity: 0.5 }}>🔒</span>
                    ) : valide ? (
                      <span style={{ color: COULEURS.fond, fontSize: 16, fontWeight: 700 }}>✓</span>
                    ) : (
                      <span style={{ color: couleur, fontSize: 12, fontFamily: POLICE_DISPLAY }}>{n}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Panneau détail — ce qu'il faut valider, repris du contenu réel v1 (BRANCHES) */}
          <div style={{ marginTop: 18, minHeight: 140, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '18px 20px', background: COULEURS.surface }}>
            {!detail || !selection ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COULEURS.texteFaible, fontSize: 13, minHeight: 100 }}>
                <span style={{ fontSize: 20 }}>👆</span>
                Sélectionne un niveau débloqué ci-dessus pour voir ce qu'il faut valider.
              </div>
            ) : (
              <div key={cle(selection.d, selection.n)} className="piliers-detail-enter">
                <span style={{ fontSize: 11, color: DOMAINE_COULEURS[selection.d], letterSpacing: 1, fontWeight: 600 }}>
                  {DOMAINE_LABELS[selection.d].toUpperCase()} · NIVEAU {selection.n}
                </span>
                <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 21, margin: '2px 0 6px', color: COULEURS.texte }}>{detail.titre}</h2>
                <p style={{ color: COULEURS.texteAtt, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>{detail.resume}</p>

                {detail.aValider.length > 0 ? (
                  <div style={{ marginBottom: detail.bonus.length > 0 ? 16 : 0, paddingBottom: detail.bonus.length > 0 ? 14 : 0, borderBottom: detail.bonus.length > 0 ? `1px solid ${COULEURS.bordure}` : 'none' }}>
                    <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>
                      🎯 À valider ({detail.aValider.length})
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
                      {detail.aValider.map((ex) => <LigneExercice key={ex.nom} ex={ex} couleur={DOMAINE_COULEURS[selection.d]} />)}
                    </ul>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '0 0 16px' }}>Contenu pas encore calé pour ce niveau.</p>
                )}

                {detail.bonus.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>
                      🔥 Bonus, facultatif ({detail.bonus.length})
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
                      {detail.bonus.map((ex) => <LigneExercice key={ex.nom} ex={ex} couleur={DOMAINE_COULEURS[selection.d]} muted />)}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => toggleValidation(selection.d, selection.n)}
                  style={{
                    padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${DOMAINE_COULEURS[selection.d]}`,
                    background: valides.has(cle(selection.d, selection.n)) ? 'transparent' : DOMAINE_COULEURS[selection.d],
                    color: valides.has(cle(selection.d, selection.n)) ? DOMAINE_COULEURS[selection.d] : COULEURS.fond,
                  }}
                >
                  {valides.has(cle(selection.d, selection.n)) ? '✓ Validé — cliquer pour annuler' : 'Marquer validé (simulation)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Colonne latérale discrète : quêtes secondaires ------------ */}
        <aside style={{ flex: '0 1 220px', minWidth: 200 }}>
          <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>✦ Quêtes secondaires</p>
          <p style={{ fontSize: 11, color: COULEURS.texteFaible, lineHeight: 1.5, margin: '0 0 12px' }}>
            À côté des piliers — ne bloquent rien. Clique pour changer le statut.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUETES_EXEMPLE.map((q) => {
              const statut = statutsQuetes[q.id] ?? 'a_faire';
              const couleur = DOMAINE_COULEURS[q.domaine];
              return (
                <button
                  key={q.id}
                  onClick={() => cyclerQuete(q.id)}
                  title={q.note}
                  className="piliers-quete"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, textAlign: 'left', cursor: 'pointer',
                    padding: '7px 10px', borderRadius: 8, fontSize: 12, transition: 'background 0.15s, border-color 0.15s',
                    background: statut === 'valide' ? `${couleur}14` : 'transparent',
                    border: `1px solid ${statut === 'valide' ? `${couleur}55` : COULEURS.bordure}`,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: statut === 'a_faire' ? COULEURS.texteFaible : statut === 'video_envoyee' ? '#FFC24B' : couleur }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', color: statut === 'valide' ? COULEURS.texte : COULEURS.texteAtt, fontWeight: statut === 'valide' ? 600 : 400 }}>{q.titre}</span>
                    <span style={{ display: 'block', fontSize: 10, color: couleur, letterSpacing: 0.2, marginTop: 2 }}>aide : {DOMAINE_LABELS[q.domaine]}</span>
                    <span style={{ display: 'block', fontSize: 10, color: COULEURS.texteFaible, marginTop: 2 }}>{LABEL_STATUT_QUETE[statut]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
