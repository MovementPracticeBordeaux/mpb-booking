import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { MODULES_MENTORSHIP, STRUCTURE_SEANCE } from '@/lib/mentorship-modules';
import { outilsDuGroupe, TOOL_GROUP_LABELS } from '@/lib/mentorship-tools';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { basculerModuleVu } from './actions';

export const dynamic = 'force-dynamic';

export default async function MentorshipPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const accesAutorise = ['mentorship', 'post_mentorship'].includes(profil?.formule_nom ?? '')
    && profil?.abonnement_actif && !profil?.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, letterSpacing: 0.5 }}>MENTORSHIP</h1>
        <p style={{ color: COULEURS.texteAtt }}>
          Cette page est réservée aux élèves ayant le programme Mentorship actif.
          {' '}Rends-toi sur <a href="/tarifs" style={{ color: '#f0a' }}>la page tarifs</a> pour y accéder,
          ou contacte Sylvain si tu penses qu'il y a une erreur.
        </p>
      </main>
    );
  }

  const { data: progressionData } = await supabase
    .from('mentorship_progression')
    .select('module_id')
    .eq('eleve_id', user.id);
  const modulesAcquis = new Set((progressionData ?? []).map((p) => p.module_id));

  const modulesTries = [...MODULES_MENTORSHIP].sort((a, b) => a.ordre - b.ordre);
  const nbAcquis = modulesTries.filter((m) => modulesAcquis.has(m.id)).length;

  // Une étape est déverrouillée si c'est la première, ou si la précédente est acquise.
  const estDeverrouille = (index: number) => index === 0 || modulesAcquis.has(modulesTries[index - 1].id);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        PROGRAMME <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 8 }}>
        {nbAcquis}/{modulesTries.length} étapes acquises — chaque étape se débloque quand la précédente est validée.
      </p>

      {/* Barre de progression */}
      <div style={{ height: 6, borderRadius: 999, background: COULEURS.surface, marginBottom: 28, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${(nbAcquis / modulesTries.length) * 100}%`,
            backgroundImage: 'linear-gradient(90deg, #FF3B30, #FF8A00, #FF2D78, #8B5CF6)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {modulesTries.map((m, index) => {
        const acquis = modulesAcquis.has(m.id);
        const deverrouille = estDeverrouille(index);
        const outilsParGroupe = m.groupesOutils.map((g) => ({ groupe: g, outils: outilsDuGroupe(g) }));

        return (
          <section
            key={m.id}
            style={{
              border: `1px solid ${acquis ? '#4caf7d55' : COULEURS.bordure}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              opacity: deverrouille ? 1 : 0.5,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 11, color: COULEURS.texteFaible, letterSpacing: 1 }}>
                  ÉTAPE {m.ordre}/{modulesTries.length}
                </span>
                <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 0' }}>
                  {deverrouille ? m.titre : '🔒 ' + m.titre}
                </h2>
              </div>

              {deverrouille && (
                <form action={basculerModuleVu}>
                  <input type="hidden" name="module_id" value={m.id} />
                  <input type="hidden" name="deja_vu" value={String(acquis)} />
                  <button
                    type="submit"
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      border: `1px solid ${acquis ? '#4caf7d' : COULEURS.bordure}`,
                      background: acquis ? 'rgba(80,200,120,0.15)' : 'transparent',
                      color: acquis ? '#9ef29e' : COULEURS.texteAtt,
                      cursor: 'pointer',
                    }}
                  >
                    {acquis ? '✓ Acquis' : 'Marquer comme acquis'}
                  </button>
                </form>
              )}
            </div>

            {!deverrouille ? (
              <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginTop: 8 }}>
                Valide l'étape précédente pour débloquer celle-ci.
              </p>
            ) : (
              <>
                <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
                  {m.resume}
                </p>
                <p style={{ color: COULEURS.texteFaible, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
                  Objectif : {m.objectifPedagogique}
                </p>

                {/* Objectifs chiffrés de l'étape */}
                {m.objectifs.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    {m.objectifs.map((o) => (
                      <div key={o.code} style={{ background: COULEURS.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>{o.code} — {o.titre}</span>
                        <p style={{ fontSize: 14, margin: '2px 0 0' }}>{o.cible}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Théorie injectée en contexte */}
                {m.theorie.length > 0 && (
                  <div style={{ marginTop: 16, borderLeft: '2px solid #8B5CF6', paddingLeft: 14 }}>
                    {m.theorie.map((t) => (
                      <div key={t.titre} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.titre}</p>
                        <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.6, margin: '2px 0 0' }}>{t.resume}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outils vidéo recommandés, groupés */}
                {outilsParGroupe.length > 0 && (
                  <details style={{ marginTop: 16 }}>
                    <summary style={{ fontSize: 13, color: '#f0a', cursor: 'pointer' }}>
                      Voir les outils recommandés ({outilsParGroupe.reduce((n, g) => n + g.outils.length, 0)})
                    </summary>
                    {outilsParGroupe.map(({ groupe, outils }) => (
                      <div key={groupe} style={{ marginTop: 10 }}>
                        <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 4 }}>{TOOL_GROUP_LABELS[groupe]}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {outils.map((outil) => (
                            <a
                              key={outil.code}
                              href={`https://www.youtube.com/watch?v=${outil.videoYoutubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 12, color: COULEURS.texteAtt, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '4px 10px', textDecoration: 'none' }}
                            >
                              ▶ {outil.nom}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </details>
                )}

                {/* Jeux suggérés */}
                {m.jeuxSuggeres && m.jeuxSuggeres.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 4 }}>Jeux associés</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.jeuxSuggeres.map((jeu) => (
                        <span key={jeu} style={{ fontSize: 12, color: COULEURS.texteAtt, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '4px 10px' }}>
                          🎲 {jeu}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}

      {/* Rappel de la structure de séance type */}
      <details style={{ marginTop: 24, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20 }}>
        <summary style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, cursor: 'pointer' }}>
          Comment structurer une séance
        </summary>
        {STRUCTURE_SEANCE.map((etape, i) => (
          <div key={etape.etape} style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14, margin: 0 }}>{i + 1}. {etape.etape}</p>
            <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '2px 0 0' }}>{etape.detail}</p>
          </div>
        ))}
      </details>
    </main>
  );
}
