'use client';

import { useState } from 'react';
import {
  ARBRE_COMPETENCES,
  TRONC_ARMURE_ORGANIQUE,
  DOMAINE_LABELS,
  DOMAINE_COULEURS,
  estNoeudDeverrouille,
  troncDeverrouille,
  Domaine,
  NoeudCompetence,
  NoeudTronc,
} from '@/lib/mentorship-modules';
import { outilsDuGroupe, TOOL_GROUP_LABELS } from '@/lib/mentorship-tools';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { soumettreVideo } from './actions';

type StatutSoumission = 'en_attente' | 'acquis' | 'refuse';
type Progression = { module_id: string; statut: StatutSoumission; video_url: string | null; commentaire_coach: string | null };

// 6 colonnes : les 5 branches, avec le TRONC au centre (index 3) — pour que
// chaque ligne (= un niveau) montre visuellement le socle du tronc portant
// les branches à ce même niveau.
const COLONNES: (Domaine | 'tronc')[] = ['force', 'flexibilite', 'locomotion', 'tronc', 'connexion', 'figures'];
const COL_W = 145;
const ROW_H = 150;
const RADIUS = 30;
const BASE_Y = 500; // ligne du niveau 1
const SVG_W = COLONNES.length * COL_W;
const SVG_H = BASE_Y + 90;
const COULEUR_TRONC = '#4caf7d';

function positionColonne(cle: Domaine | 'tronc') {
  return COLONNES.indexOf(cle) * COL_W + COL_W / 2;
}
function positionLigne(niveau: number) {
  return BASE_Y - (niveau - 1) * ROW_H;
}

function Avatar({ niveauxAcquis }: { niveauxAcquis: number }) {
  const couleurPiece = (seuil: number) => (niveauxAcquis >= seuil ? COULEUR_TRONC : 'rgba(255,255,255,0.08)');
  const traitPiece = (seuil: number) => (niveauxAcquis >= seuil ? COULEUR_TRONC : '#444');
  return (
    <svg viewBox="0 0 80 100" style={{ width: 56, height: 70, flexShrink: 0 }}>
      {/* jambes — niveau 1 */}
      <rect x={24} y={64} width={12} height={30} rx={5} fill={couleurPiece(1)} stroke={traitPiece(1)} strokeWidth={2} />
      <rect x={44} y={64} width={12} height={30} rx={5} fill={couleurPiece(1)} stroke={traitPiece(1)} strokeWidth={2} />
      {/* torse — niveau 2 */}
      <rect x={20} y={32} width={40} height={34} rx={8} fill={couleurPiece(2)} stroke={traitPiece(2)} strokeWidth={2} />
      {/* casque/tête — niveau 3 */}
      <circle cx={40} cy={18} r={16} fill={couleurPiece(3)} stroke={traitPiece(3)} strokeWidth={2} />
    </svg>
  );
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

  const troncNiveauxAcquis = TRONC_ARMURE_ORGANIQUE.filter((t) => idsAcquis.has(t.id)).length;
  const nbAcquisTotal = idsAcquis.size;
  const totalNoeuds = ARBRE_COMPETENCES.length + TRONC_ARMURE_ORGANIQUE.length;

  const noeudTroncSelectionne = selection ? TRONC_ARMURE_ORGANIQUE.find((t) => t.id === selection) ?? null : null;
  const noeudBrancheSelectionne = selection ? ARBRE_COMPETENCES.find((n) => n.id === selection) ?? null : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar niveauxAcquis={troncNiveauxAcquis} />
        <div>
          <p style={{ fontSize: 13, color: COULEURS.texte, margin: 0 }}>
            Ton armure : {troncNiveauxAcquis}/3 pièces gagnées
          </p>
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '2px 0 0' }}>
            {nbAcquisTotal}/{totalNoeuds} compétences acquises au total — touche un nœud pour voir son contenu.
          </p>
        </div>
      </div>

      {/* Légende des domaines */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: COULEURS.texteAtt, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: COULEUR_TRONC, display: 'inline-block' }} />
          Tronc (Armure Organique)
        </span>
        {(['force', 'flexibilite', 'locomotion', 'connexion', 'figures'] as Domaine[]).map((d) => (
          <span key={d} style={{ fontSize: 12, color: COULEURS.texteAtt, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: DOMAINE_COULEURS[d], display: 'inline-block' }} />
            {DOMAINE_LABELS[d]}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', minWidth: 620, height: 'auto', display: 'block' }}>
          {/* Tronc : ligne verticale continue reliant les 3 niveaux */}
          <line
            x1={positionColonne('tronc')} y1={positionLigne(1) + RADIUS}
            x2={positionColonne('tronc')} y2={positionLigne(3) - RADIUS}
            stroke={COULEUR_TRONC} strokeWidth={4}
            opacity={troncNiveauxAcquis >= 2 ? 0.9 : 0.35}
          />

          {/* Tronc niveau N -> chaque branche niveau N (le socle porte les branches) */}
          {[1, 2, 3].map((niveau) =>
            (['force', 'flexibilite', 'locomotion', 'connexion', 'figures'] as Domaine[]).map((d) => {
              const troncAcquis = idsAcquis.has(TRONC_ARMURE_ORGANIQUE.find((t) => t.niveau === niveau)?.id ?? '');
              return (
                <line
                  key={`tronc-${niveau}-${d}`}
                  x1={positionColonne('tronc')} y1={positionLigne(niveau)}
                  x2={positionColonne(d)} y2={positionLigne(niveau)}
                  stroke={COULEUR_TRONC}
                  strokeWidth={1.5}
                  opacity={troncAcquis ? 0.35 : 0.15}
                />
              );
            })
          )}

          {/* Lignes verticales entre niveaux d'une même branche */}
          {ARBRE_COMPETENCES.filter((n) => n.niveau > 1).map((n) => {
            const precedent = ARBRE_COMPETENCES.find((p) => p.domaine === n.domaine && p.niveau === n.niveau - 1);
            if (!precedent) return null;
            const x = positionColonne(n.domaine);
            const chemin = idsAcquis.has(precedent.id) && idsAcquis.has(n.id);
            return (
              <line
                key={`branche-${n.id}`}
                x1={x} y1={positionLigne(precedent.niveau)}
                x2={x} y2={positionLigne(n.niveau)}
                stroke={DOMAINE_COULEURS[n.domaine]}
                strokeWidth={chemin ? 3 : 2}
                opacity={chemin ? 0.9 : 0.4}
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
                  opacity={0.4}
                />
              ));
            })
          )}

          {/* Nœuds du tronc */}
          {TRONC_ARMURE_ORGANIQUE.map((t) => {
            const x = positionColonne('tronc');
            const y = positionLigne(t.niveau);
            const deverrouille = troncDeverrouille(t, idsAcquis);
            const statut = progression.get(t.id)?.statut;
            const estSelectionne = selection === t.id;
            let fill = 'rgba(255,255,255,0.06)';
            let strokeDasharray: string | undefined;
            if (deverrouille) {
              if (statut === 'acquis') fill = COULEUR_TRONC;
              else if (statut === 'en_attente') { fill = 'rgba(255,255,255,0.1)'; strokeDasharray = '4 3'; }
              else if (statut === 'refuse') fill = 'rgba(255,107,107,0.15)';
            }
            const estFrontiere = deverrouille && statut !== 'acquis';
            return (
              <g key={t.id} onClick={() => setSelection(t.id)} style={{ cursor: 'pointer' }}>
                {estFrontiere && <circle cx={x} cy={y} r={RADIUS + 6} fill="none" stroke={COULEUR_TRONC} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.6} />}
                <circle cx={x} cy={y} r={RADIUS} fill={fill} stroke={statut === 'refuse' ? '#ff6b6b' : COULEUR_TRONC} strokeWidth={estSelectionne ? 3.5 : 2.5} strokeDasharray={strokeDasharray} opacity={deverrouille ? 1 : 0.45} />
                {statut === 'acquis' && <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill="#04140a">✓</text>}
                {!deverrouille && <text x={x} y={y + 5} textAnchor="middle" fontSize={13}>🔒</text>}
                <text x={x} y={y + RADIUS + 16} textAnchor="middle" fontSize={10.5} fill={COULEURS.texteAtt}>Niveau {t.niveau}</text>
              </g>
            );
          })}

          {/* Nœuds de compétence des branches */}
          {ARBRE_COMPETENCES.map((n) => {
            const x = positionColonne(n.domaine);
            const y = positionLigne(n.niveau);
            const deverrouille = estNoeudDeverrouille(n, idsAcquis);
            const statut = progression.get(n.id)?.statut;
            const couleur = DOMAINE_COULEURS[n.domaine];
            const estSelectionne = selection === n.id;

            let fill = 'rgba(255,255,255,0.06)';
            let stroke = '#333';
            let strokeDasharray: string | undefined;
            if (deverrouille) {
              stroke = couleur;
              if (statut === 'acquis') fill = couleur;
              else if (statut === 'en_attente') { fill = 'rgba(255,255,255,0.08)'; strokeDasharray = '4 3'; }
              else if (statut === 'refuse') { stroke = '#ff6b6b'; fill = 'rgba(255,107,107,0.12)'; }
            }
            if (estSelectionne) stroke = '#fff';
            const estFrontiere = deverrouille && statut !== 'acquis';

            return (
              <g key={n.id} onClick={() => setSelection(n.id)} style={{ cursor: 'pointer' }}>
                {estFrontiere && <circle cx={x} cy={y} r={RADIUS + 6} fill="none" stroke={couleur} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.6} />}
                <circle cx={x} cy={y} r={RADIUS} fill={fill} stroke={stroke} strokeWidth={estSelectionne ? 3 : 2} strokeDasharray={strokeDasharray} opacity={deverrouille ? 1 : 0.45} />
                {statut === 'acquis' && <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill="#04140a">✓</text>}
                {!deverrouille && <text x={x} y={y + 5} textAnchor="middle" fontSize={13}>🔒</text>}
                <text x={x} y={y + RADIUS + 16} textAnchor="middle" fontSize={10.5} fill={COULEURS.texteAtt}>
                  {n.titre.length > 18 ? n.titre.slice(0, 16) + '…' : n.titre}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Panneau de détail d'un nœud du tronc */}
      {noeudTroncSelectionne && (() => {
        const t = noeudTroncSelectionne;
        const deverrouille = troncDeverrouille(t, idsAcquis);
        const prog = progression.get(t.id);
        const statut = prog?.statut;
        const outilsParGroupe = t.groupesOutils.map((g) => ({ groupe: g, outils: outilsDuGroupe(g) }));

        return (
          <section style={{ border: `1px solid ${COULEUR_TRONC}55`, borderRadius: 12, padding: 20, marginTop: 16 }}>
            <span style={{ fontSize: 11, color: COULEUR_TRONC, letterSpacing: 1, fontWeight: 600 }}>TRONC · NIVEAU {t.niveau}</span>
            <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 4px' }}>{t.titre}</h2>

            {!deverrouille ? (
              <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginTop: 8 }}>🔒 Termine le niveau précédent du tronc pour débloquer celui-ci.</p>
            ) : (
              <>
                <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{t.resume}</p>
                <p style={{ color: COULEURS.texteFaible, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>Objectif : {t.objectifPedagogique}</p>

                {t.theorie.map((th) => (
                  <div key={th.titre} style={{ marginTop: 14, borderLeft: `2px solid ${COULEUR_TRONC}`, paddingLeft: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{th.titre}</p>
                    <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.7, margin: '4px 0 0' }}>{th.texte}</p>
                  </div>
                ))}

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

                {!estAdmin && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COULEURS.bordure}` }}>
                    {statut === 'acquis' && <p style={{ fontSize: 13, color: '#9ef29e' }}>Niveau validé par Sylvain — la suite est débloquée.</p>}
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
                          <input type="hidden" name="noeud_id" value={t.id} />
                          <input type="hidden" name="resoumission" value={String(statut === 'refuse')} />
                          <input type="url" name="video_url" required placeholder="Lien de ta vidéo (YouTube non répertorié, Drive...)"
                            style={{ flexGrow: 1, minWidth: 220, fontSize: 13, padding: '9px 12px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte }} />
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

      {/* Panneau de détail d'un nœud de branche */}
      {noeudBrancheSelectionne && (() => {
        const n = noeudBrancheSelectionne;
        const deverrouille = estNoeudDeverrouille(n, idsAcquis);
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
                🔒 Les prérequis de cette compétence (tronc et/ou autres branches) ne sont pas encore tous acquis.
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
                    {statut === 'acquis' && <p style={{ fontSize: 13, color: '#9ef29e' }}>Compétence validée par Sylvain — bravo, la suite est débloquée.</p>}
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
                          <input type="url" name="video_url" required placeholder="Lien de ta vidéo (YouTube non répertorié, Drive...)"
                            style={{ flexGrow: 1, minWidth: 220, fontSize: 13, padding: '9px 12px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte }} />
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
