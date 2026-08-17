import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { BRANCHES, TRONC, TOUS_LES_NOEUDS, DOMAINE_LABELS, Domaine } from '@/lib/mentorship-modules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { validerSoumission, refuserSoumission } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminMentorshipPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') {
    return <main style={{ padding: 20 }}>Accès réservé à l'admin.</main>;
  }

  const admin = supabaseAdmin();

  const { data: soumissions } = await admin
    .from('mentorship_progression')
    .select('*, profiles:eleve_id(email, prenom, nom)')
    .eq('statut', 'en_attente')
    .order('submitted_at', { ascending: true });

  const noeudParId = Object.fromEntries(BRANCHES.map((n) => [n.id, { titre: n.titre, sousTitre: `${DOMAINE_LABELS[n.domaine as Domaine]} niveau ${n.niveau}` }]));
  const troncParId = Object.fromEntries(TRONC.map((t) => [t.id, { titre: t.titre, sousTitre: `Tronc niveau ${t.niveau}` }]));
  const infosNoeud: Record<string, { titre: string; sousTitre: string }> = { ...noeudParId, ...troncParId };

  // Nœuds à exercices indépendants : module_id composite `${noeudId}::${exerciceId}`.
  // On retrouve le nom lisible de l'exercice (obligatoire ou progression
  // bonus) et on précise le nœud d'où il vient, pour un affichage clair
  // dans la file de validation.
  function infosPourModuleId(moduleId: string): { titre: string; sousTitre: string } {
    const direct = infosNoeud[moduleId];
    if (direct) return direct;

    const [noeudId, exerciceId] = moduleId.split('::');
    const noeud = TOUS_LES_NOEUDS.find((n) => n.id === noeudId);
    if (!noeud) return { titre: moduleId, sousTitre: '' };

    const label = noeud.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[noeud.domaine as Domaine];
    const exerciceBonus = noeud.progressionBonus?.find((e) => e.id === exerciceId);
    const exercice = noeud.exercices?.find((e) => e.id === exerciceId) ?? exerciceBonus;

    if (!exercice) return { titre: noeud.titre, sousTitre: `${label} niveau ${noeud.niveau}` };
    return {
      titre: exercice.nom,
      sousTitre: `${label} niveau ${noeud.niveau} · ${noeud.titre}${exerciceBonus ? ' · Progression bonus 🔥' : ''}`,
    };
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        VALIDATIONS <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 24 }}>
        {(soumissions ?? []).length} soumission{(soumissions ?? []).length > 1 ? 's' : ''} en attente de validation.
      </p>

      {searchParams.erreur && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 16 }}>{searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ color: '#7fffa0', fontSize: 13, marginBottom: 16 }}>✅ {searchParams.succes}</p>
      )}

      {(soumissions ?? []).length === 0 ? (
        <p style={{ color: COULEURS.texteAtt }}>Aucune soumission en attente pour le moment.</p>
      ) : (
        (soumissions ?? []).map((s: any) => {
          const info = infosPourModuleId(s.module_id);
          const eleve = s.profiles;
          return (
            <section
              key={`${s.eleve_id}-${s.module_id}`}
              style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20, marginBottom: 16 }}
            >
              <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: 0 }}>
                {eleve?.prenom ?? ''} {eleve?.nom ?? eleve?.email ?? s.eleve_id}
                {info.sousTitre ? ` — ${info.sousTitre}` : ''}
              </p>
              <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 10px' }}>
                {info.titre}
              </h2>

              <a
                href={s.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 14, color: '#f0a', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                ▶ Voir la vidéo soumise
              </a>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <form action={validerSoumission} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexGrow: 1 }}>
                  <input type="hidden" name="eleve_id" value={s.eleve_id} />
                  <input type="hidden" name="module_id" value={s.module_id} />
                  <input
                    type="text"
                    name="theme"
                    placeholder="Thème observé (optionnel, pour le bilan de l'élève)"
                    style={{
                      flexGrow: 1, minWidth: 200, fontSize: 13, padding: '8px 12px',
                      borderRadius: 8, border: `1px solid ${COULEURS.bordure}`,
                      background: COULEURS.surface, color: COULEURS.texte,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      fontSize: 13, padding: '8px 16px', borderRadius: 999,
                      border: '1px solid #4caf7d', background: 'rgba(80,200,120,0.15)',
                      color: '#9ef29e', cursor: 'pointer',
                    }}
                  >
                    ✓ Valider
                  </button>
                </form>

                <details style={{ flexGrow: 1, width: '100%' }}>
                  <summary style={{ fontSize: 13, color: COULEURS.texteAtt, cursor: 'pointer' }}>
                    Refuser (avec commentaire)
                  </summary>
                  <form action={refuserSoumission} style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input type="hidden" name="eleve_id" value={s.eleve_id} />
                    <input type="hidden" name="module_id" value={s.module_id} />
                    <input
                      type="text"
                      name="theme"
                      placeholder="Thème qui coince (optionnel)"
                      style={{
                        flexGrow: 1, minWidth: 160, fontSize: 13, padding: '8px 12px',
                        borderRadius: 8, border: `1px solid ${COULEURS.bordure}`,
                        background: COULEURS.surface, color: COULEURS.texte,
                      }}
                    />
                    <input
                      type="text"
                      name="commentaire"
                      placeholder="Ce qu'il faut retravailler..."
                      style={{
                        flexGrow: 1, minWidth: 200, fontSize: 13, padding: '8px 12px',
                        borderRadius: 8, border: `1px solid ${COULEURS.bordure}`,
                        background: COULEURS.surface, color: COULEURS.texte,
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        fontSize: 13, padding: '8px 16px', borderRadius: 999,
                        border: '1px solid #ff6b6b', background: 'rgba(255,107,107,0.1)',
                        color: '#ff6b6b', cursor: 'pointer',
                      }}
                    >
                      Refuser
                    </button>
                  </form>
                </details>
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
