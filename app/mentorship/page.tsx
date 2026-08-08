import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { MODULES_MENTORSHIP } from '@/lib/mentorship-modules';
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
  const modulesVus = new Set((progressionData ?? []).map((p) => p.module_id));

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        PROGRAMME <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 24 }}>
        {modulesVus.size}/{MODULES_MENTORSHIP.length} modules vus — avance à ton rythme, rien n'est verrouillé.
      </p>

      {MODULES_MENTORSHIP.length === 0 ? (
        <p style={{ color: COULEURS.texteAtt }}>
          Le contenu du programme arrive très bientôt sur le nouveau site. En attendant, contacte
          Sylvain si tu as besoin d'accéder à une ressource en particulier.
        </p>
      ) : (
        MODULES_MENTORSHIP.map((m) => {
          const vu = modulesVus.has(m.id);
          return (
            <section
              key={m.id}
              style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20, marginBottom: 16 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: 0 }}>{m.titre}</h2>
                <form action={basculerModuleVu}>
                  <input type="hidden" name="module_id" value={m.id} />
                  <input type="hidden" name="deja_vu" value={String(vu)} />
                  <button
                    type="submit"
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      border: `1px solid ${vu ? '#4caf7d' : COULEURS.bordure}`,
                      background: vu ? 'rgba(80,200,120,0.15)' : 'transparent',
                      color: vu ? '#9ef29e' : COULEURS.texteAtt,
                      cursor: 'pointer',
                    }}
                  >
                    {vu ? '✓ Vu' : 'Marquer comme vu'}
                  </button>
                </form>
              </div>

              {m.videoYoutubeId && (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: 12, borderRadius: 8, overflow: 'hidden' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${m.videoYoutubeId}`}
                    title={m.titre}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}

              <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {m.description}
              </p>

              {m.fichiers && m.fichiers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {m.fichiers.map((f) => (
                    <a
                      key={f.url}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#f0a', border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '6px 14px', textDecoration: 'none' }}
                    >
                      📎 {f.nom}
                    </a>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}
