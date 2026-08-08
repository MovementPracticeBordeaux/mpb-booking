'use client';

import { useState } from 'react';
import {
  ARBRE_COMPETENCES,
  DOMAINE_LABELS,
  DOMAINE_COULEURS,
  TRONC_ARMURE_ORGANIQUE,
  Domaine,
  NoeudCompetence,
} from '@/lib/mentorship-modules';
import { outilsDuGroupe, TOOL_GROUP_LABELS } from '@/lib/mentorship-tools';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { soumettreVideo } from './actions';

type StatutSoumission = 'en_attente' | 'acquis' | 'refuse';
type Progression = { module_id: string; statut: StatutSoumission; video_url: string | null; commentaire_coach: string | null };

const ORDRE_DOMAINES: Domaine[] = ['force', 'flexibilite', 'locomotion', 'connexion', 'figures'];
const COL_W = 170;
const ROW_H = 128;
const RADIUS = 30;
const BASE_Y = 640; // y du tronc
const SVG_W = ORDRE_DOMAINES.length * COL_W;
const SVG_H = BASE_Y + 70;

function positionColonne(domaine: Domaine) {
  return ORDRE_DOMAINES.indexOf(domaine) * COL_W + COL_W / 2;
}
function positionLigne(niveau: number) {
  return BASE_Y - niveau * ROW_H;
}

export default function ArbreCompetences({
  progression,
  estAdmin,
}: {
  progression: Map<string, Progression>;
  estAdmin?: boolean;
}) {
  const [selection, setSelection] = useState<string | null>(null);

  const idsAcquis = new Set(
    [...progression.entries()].filter(([, p]) => p.statut === 'acquis').map(([id]) => id)
  );

  function estDeverrouille(noeud: NoeudCompetence): boolean {
    if (noeud.niveau > 1) {
      const precedent = ARBRE_COMPETENCES.find((n) => n.domaine === noeud.domaine && n.niveau === noeud.niveau - 1);
      if (precedent && !idsAcquis.has(precedent.id)) return false;
    }
    for (const prereq of noeud.prerequis ?? []) {
      const requis = ARBRE_COMPETENCES.filter((n) => n.domaine === prereq.domaine && n.niveau === prereq.niveauMin);
      if (!requis.some((n) => idsAcquis.has(n.id))) return false;
    }
    return true;
  }

  const noeudSelectionne = selection ? ARBRE_COMPETENCES.find((n) => n.id === selection) ?? null : null;
  const estTroncSelectionne = selection === TRONC_ARMURE_ORGANIQUE.id;

  const nbAcquis = idsAcquis.size;

  return (
    <div>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 16 }}>
        {nbAcquis}/{ARBRE_COMPETENCES.length} compétences acquises — touche un nœud pour voir son contenu.
      </p>

      {/* Légende des domaines */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {ORDRE_DOMAINES.map((d) => (
          <span key={d} style={{ fontSize: 12, color: COULEURS.texteAtt, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: DOMAINE_COULEURS[d], display: 'inline-block' }} />
            {DOMAINE_LABELS[d]}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', minWidth: 560, height: 'auto', display: 'block' }}>
          {/* Lignes tronc -> niveau 1 de chaque branche */}
          {ORDRE_DOMAINES.map((d) => {
            const x = positionColonne(d);
            return (
              <line
                key={`tronc-${d}`}
                x1={SVG_W / 2} y1={BASE_Y}
                x2={x} y2={positionLigne(1)}
                stroke={DOMAINE_COULEURS[d]}
                strokeWidth={2}
                opacity={0.35}
              />
            );
          })}

          {/* Lignes verticales entre niveaux d'une même branche */}
          {ARBRE_COMPETENCES.filter((n) => n.niveau > 1).map((n) => {
            const precedent = ARBRE_COMPETENCES.find((p) => p.domaine === n.domaine && p.niveau === n.niveau - 1);
            if (!precedent) return null;
            const x = positionColonne(n.domaine);
            return (
              <line
                key={`branche-${n.id}`}
                x1={x} y1={positionLigne(precedent.niveau)}
                x2={x} y2={positionLigne(n.niveau)}
                stroke={DOMAINE_COULEURS[n.domaine]}
                strokeWidth={2}
                opacity={0.5}
              />
            );
          })}

          {/* Lignes en pointillés pour les prérequis inter-branches (convergences) */}
          {ARBRE_COMPETENCES.flatMap((n) =>
            (n.prerequis ?? []).flatMap((prereq) => {
              const sources = ARBRE_COMPETENCES.filter((s) => s.domaine === prereq.domaine && s.niveau === prereq.niveauMin);
              return sources.map((s) => (
                <line
                  key={`prereq-${n.id}-${s.id}`}
                  x1={positionColonne(s.domaine)} y1={positionLigne(s.niveau)}
                  x2={positionColonne(n.domaine)} y2={positionLigne(n.niveau)}
                  stroke={DOMAINE_COULEURS[s.domaine]}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  opacity={0.45}
                />
              ));
            })
          )}

          {/* Tronc */}
          <g onClick={() => setSelection(TRONC_ARMURE_ORGANIQUE.id)} style={{ cursor: 'pointer' }}>
            <rect
              x={SVG_W / 2 - 70} y={BASE_Y - 22} width={140} height={44} rx={22}
              fill={selection === TRONC_ARMURE_ORGANIQUE.id ? '#4caf7d' : 'rgba(80,200,120,0.18)'}
              stroke="#4caf7d" strokeWidth={2}
            />
            <text x={SVG_W / 2} y={BASE_Y + 5} textAnchor="middle" fontSize={12} fontWeight={600}
              fill={selection === TRONC_ARMURE_ORGANIQUE.id ? '#04140a' : '#9ef29e'}>
              Armure Organique
            </text>
          </g>

          {/* Nœuds de compétence */}
          {ARBRE_COMPETENCES.map((n) => {
            const x = positionColonne(n.domaine);
            const y = positionLigne(n.niveau);
            const deverrouille = estDeverrouille(n);
            const statut = progression.get(n.id)?.statut;
            const couleur = DOMAINE_COULEURS[n.domaine];
            const estSelectionne = selection === n.id;

            let fill = 'rgba(255,255,255,0.06)';
            let stroke = '#333';
            let strokeDasharray: string | undefined;
            if (deverrouille) {
              stroke = couleur;
              if (statut === 'acquis') { fill = couleur; }
              else if (statut === 'en_attente') { fill = 'rgba(255,255,255,0.08)'; strokeDasharray = '4 3'; }
              else if (statut === 'refuse') { stroke = '#ff6b6b'; fill = 'rgba(255,107,107,0.12)'; }
              else { fill = 'rgba(255,255,255,0.06)'; }
            }
            if (estSelectionne) stroke = '#fff';

            return (
              <g key={n.id} onClick={() => setSelection(n.id)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={RADIUS} fill={fill} stroke={stroke} strokeWidth={estSelectionne ? 3 : 2} strokeDasharray={strokeDasharray} opacity={deverrouille ? 1 : 0.45} />
                {statut === 'acquis' && (
                  <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill="#04140a">✓</text>
                )}
                {!deverrouille && (
                  <text x={x} y={y + 5} textAnchor="middle" fontSize={13}>🔒</text>
                )}
                <text x={x} y={y + RADIUS + 16} textAnchor="middle" fontSize={10.5} fill={COULEURS.texteAtt}>
                  {n.titre.length > 20 ? n.titre.slice(0, 18) + '…' : n.titre}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Panneau de détail du tronc */}
      {estTroncSelectionne && (
        <section style={{ border: '1px solid #4caf7d55', borderRadius: 12, padding: 20, marginTop: 16 }}>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, marginBottom: 4 }}>{TRONC_ARMURE_ORGANIQUE.titre}</h2>
          <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{TRONC_ARMURE_ORGANIQUE.resume}</p>

          {TRONC_ARMURE_ORGANIQUE.theorie.map((t) => (
            <div key={t.titre} style={{ marginBottom: 14, borderLeft: '2px solid #4caf7d', paddingLeft: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.titre}</p>
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.7, margin: '4px 0 0' }}>{t.texte}</p>
            </div>
          ))}

          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 13, color: '#f0a', cursor: 'pointer' }}>
              Voir toutes les routines quotidiennes ({TRONC_ARMURE_ORGANIQUE.groupesOutils.reduce((n, g) => n + outilsDuGroupe(g).length, 0)})
            </summary>
            {TRONC_ARMURE_ORGANIQUE.groupesOutils.map((g) => (
              <div key={g} style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 4 }}>{TOOL_GROUP_LABELS[g]}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {outilsDuGroupe(g).map((outil) => (
                    <a key={outil.code} href={`https://www.youtube.com/watch?v=${outil.videoYoutubeId}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: COULEURS.texteAtt, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '4px 10px', textDecoration: 'none' }}>
                      ▶ {outil.nom}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </details>
        </section>
      )}

      {/* Panneau de détail d'un nœud de compétence */}
      {noeudSelectionne && (() => {
        const n = noeudSelectionne;
        const deverrouille = estDeverrouille(n);
        const prog = progression.get(n.id);
        const statut = prog?.statut;
        const couleur = DOMAINE_COULEURS[n.domaine];
        const outilsParGroupe = n.groupesOutils.map((g) => ({ groupe: g, outils: outilsDuGroupe(g) }));

        return (
          <section style={{ border: `1px solid ${couleur}55`, borderRadius: 12, padding: 20, marginTop: 16 }}>
            <span style={{ fontSize: 11, color: couleur, letterSpacing: 1, fontWeight: 600 }}>
              {DOMAINE_LABELS[n.domaine].toUpperCase()} · NIVEAU {n.niveau}
            </span>
            <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 4px' }}>{n.titre}</h2>

            {!deverrouille ? (
              <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginTop: 8 }}>
                🔒 Les prérequis de cette compétence ne sont pas encore tous acquis.
              </p>
            ) : (
              <>
                <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{n.resume}</p>
                <p style={{ color: COULEURS.texteFaible, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>Objectif : {n.objectifPedagogique}</p>

                {n.objectifs.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    {n.objectifs.map((o) => (
                      <div key={o.code} style={{ background: COULEURS.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>{o.code} — {o.titre}</span>
                        <p style={{ fontSize: 14, margin: '2px 0 0' }}>{o.cible}</p>
                      </div>
                    ))}
                  </div>
                )}

                {n.theorie.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    {n.theorie.map((t) => (
                      <div key={t.titre} style={{ marginBottom: 14, borderLeft: `2px solid ${couleur}`, paddingLeft: 14 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.titre}</p>
                        <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.7, margin: '4px 0 0' }}>{t.texte}</p>
                      </div>
                    ))}
                  </div>
                )}

                {outilsParGroupe.length > 0 && (
                  <details style={{ marginTop: 16 }}>
                    <summary style={{ fontSize: 13, color: '#f0a', cursor: 'pointer' }}>
                      Voir les outils recommandés ({outilsParGroupe.reduce((s, g) => s + g.outils.length, 0)})
                    </summary>
                    {outilsParGroupe.map(({ groupe, outils }) => (
                      <div key={groupe} style={{ marginTop: 10 }}>
                        <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 4 }}>{TOOL_GROUP_LABELS[groupe]}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {outils.map((outil) => (
                            <a key={outil.code} href={`https://www.youtube.com/watch?v=${outil.videoYoutubeId}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: COULEURS.texteAtt, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '4px 10px', textDecoration: 'none' }}>
                              ▶ {outil.nom}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </details>
                )}

                {n.jeuxSuggeres && n.jeuxSuggeres.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 4 }}>Jeux associés</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {n.jeuxSuggeres.map((jeu) => (
                        <span key={jeu} style={{ fontSize: 12, color: COULEURS.texteAtt, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '4px 10px' }}>🎲 {jeu}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!estAdmin && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COULEURS.bordure}` }}>
                    {statut === 'acquis' && (
                      <p style={{ fontSize: 13, color: '#9ef29e' }}>Compétence validée par Sylvain — bravo, la suite est débloquée.</p>
                    )}
                    {statut === 'en_attente' && (
                      <p style={{ fontSize: 13, color: COULEURS.texteAtt }}>
                        Ta vidéo a été envoyée, Sylvain la regarde bientôt.{' '}
                        <a href={prog?.video_url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#f0a' }}>Revoir ce que tu as envoyé</a>
                      </p>
                    )}
                    {(statut === undefined || statut === 'refuse') && (
                      <>
                        {statut === 'refuse' && prog?.commentaire_coach && (
                          <p style={{ fontSize: 13, color: '#ff6b6b', marginBottom: 10 }}>Retour de Sylvain : {prog.commentaire_coach}</p>
                        )}
                        <form action={soumettreVideo} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input type="hidden" name="noeud_id" value={n.id} />
                          <input type="hidden" name="resoumission" value={String(statut === 'refuse')} />
                          <input
                            type="url" name="video_url" required
                            placeholder="Lien de ta vidéo (YouTube non répertorié, Drive...)"
                            style={{ flexGrow: 1, minWidth: 220, fontSize: 13, padding: '9px 12px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte }}
                          />
                          <button type="submit" style={{ fontSize: 13, padding: '9px 16px', borderRadius: 999, border: '1px solid #f0a', background: 'rgba(255,0,170,0.1)', color: '#f0a', cursor: 'pointer' }}>
                            {statut === 'refuse' ? 'Renvoyer une vidéo' : 'Soumettre pour validation'}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        );
      })()}
    </div>
  );
}
