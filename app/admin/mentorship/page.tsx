import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { BRANCHES, TRONC, TOUS_LES_NOEUDS, DOMAINE_LABELS, Domaine } from '@/lib/mentorship-modules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { validerSoumission, refuserSoumission } from './actions';
import FormulaireRefus from './FormulaireRefus';
import { bilanDepuis, etapeEnCours, lundiDeLaSemaine } from '@/lib/mentorship-bilan';

// Modèles généraux de retour (rédaction provisoire, à ajuster) : ils s'insèrent
// dans le commentaire, qui reste modifiable avant envoi.
const REPONSES_TYPES = [
  "Amplitude incomplète : va chercher toute l'amplitude demandée avant d'ajouter des répétitions.",
  'Tempo trop rapide : ralentis, surtout sur la descente.',
  'Gainage à tenir du début à la fin du mouvement.',
  "Le cadrage ne permet pas de juger : filme de profil, corps entier dans l'image.",
  "C'est presque ça : encore quelques séances, puis renvoie-moi une vidéo.",
];

// Lien d'intégration pour une vidéo YouTube (null pour tout autre hébergeur).
function integrationYoutube(url?: string | null): string | null {
  const id = url?.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

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

  // Pas de jointure automatique ici : mentorship_progression.eleve_id pointe
  // vers auth.users (pas vers profiles), donc on charge les profils à part.
  const { data: soumissionsBrutes } = await admin
    .from('mentorship_progression')
    .select('*')
    .eq('statut', 'en_attente')
    .order('submitted_at', { ascending: true });
  const idsEleves = [...new Set((soumissionsBrutes ?? []).map((s) => s.eleve_id))];
  const { data: profilsEleves } = idsEleves.length > 0
    ? await admin.from('profiles').select('id, email, nom').in('id', idsEleves)
    : { data: [] as { id: string; email: string; nom: string | null }[] };
  const profilParId = new Map((profilsEleves ?? []).map((p) => [p.id, p]));
  const soumissions = (soumissionsBrutes ?? []).map((s) => ({ ...s, profiles: profilParId.get(s.eleve_id) ?? null }));

  // Suivi chiffré de l'élève sur l'exercice soumis (ses dernières perfs notées).
  const { data: perfsEleves } = idsEleves.length > 0
    ? await admin.from('mentorship_perf').select('eleve_id, module_id, series, valeur, unite, charge_kg, cree_le').in('eleve_id', idsEleves).order('cree_le', { ascending: false }).limit(2000)
    : { data: [] as any[] };
  const perfsDe = (eleveId: string, moduleId: string) => (perfsEleves ?? []).filter((p: any) => p.eleve_id === eleveId && p.module_id === moduleId).slice(0, 5);

  // Vue d'ensemble : tous les élèves dont le Mentorat est actif.
  const { data: abosMentorat } = await admin.from('abonnements').select('eleve_id, gele').eq('categorie', 'mentorat').eq('abonnement_actif', true);
  const idsMentorat = [...new Set((abosMentorat ?? []).map((a) => a.eleve_id as string))];
  const [{ data: profilsMentorat }, { data: progressionTous }, { data: perfsTous }] = idsMentorat.length > 0
    ? await Promise.all([
        admin.from('profiles').select('id, email, nom').in('id', idsMentorat),
        admin.from('mentorship_progression').select('eleve_id, module_id, statut, submitted_at, reviewed_at').in('eleve_id', idsMentorat),
        admin.from('mentorship_perf').select('eleve_id, cree_le').in('eleve_id', idsMentorat).order('cree_le', { ascending: false }).limit(5000),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];
  const lundi = lundiDeLaSemaine(new Date());
  const eleves = (profilsMentorat ?? []).map((p: any) => {
    const lignes = (progressionTous ?? []).filter((l: any) => l.eleve_id === p.id);
    const bilan = bilanDepuis(lignes, (perfsTous ?? []).filter((x: any) => x.eleve_id === p.id), lundi);
    return {
      id: p.id as string,
      nom: (p.nom || p.email) as string,
      gele: (abosMentorat ?? []).some((a) => a.eleve_id === p.id && a.gele),
      etape: etapeEnCours(lignes),
      bilan,
      acquis: lignes.filter((l: any) => l.statut === 'acquis').length,
      aRetravailler: lignes.filter((l: any) => l.statut === 'refuse').length,
    };
  }).sort((a, b) => (b.bilan.derniereActivite ?? '').localeCompare(a.bilan.derniereActivite ?? ''));
  const joursDepuis = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);

  // Réponses types : les derniers commentaires de refus déjà écrits, puis les modèles généraux.
  const { data: anciensRetours } = await admin.from('mentorship_progression').select('commentaire_coach, reviewed_at').not('commentaire_coach', 'is', null).order('reviewed_at', { ascending: false }).limit(40);
  const dejaEcrits = [...new Set((anciensRetours ?? []).map((r: any) => (r.commentaire_coach as string).trim()).filter(Boolean))].slice(0, 5);
  const reponses = [...dejaEcrits, ...REPONSES_TYPES.filter((r) => !dejaEcrits.includes(r))];

  // Exercice de l'arbre correspondant à une soumission (référence, consigne, critère).
  function exerciceDe(moduleId: string) {
    const [noeudId, exerciceId] = moduleId.split('::');
    const noeud = TOUS_LES_NOEUDS.find((n) => n.id === noeudId);
    return [...(noeud?.exercices ?? []), ...(noeud?.progressionBonus ?? [])].find((e) => e.id === exerciceId) ?? null;
  }

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
      sousTitre: `${label} niveau ${noeud.niveau} · ${noeud.titre}${exerciceBonus ? ' · Quête secondaire ✦' : ''}`,
    };
  }

  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        VALIDATIONS <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 24 }}>
        {(soumissions ?? []).length} soumission{(soumissions ?? []).length > 1 ? 's' : ''} en attente de validation.
      </p>

      {searchParams.succes && <p style={{ border: '1px solid #4caf7d', background: 'rgba(80,200,120,0.12)', color: '#9ef29e', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '0 0 16px' }}>{searchParams.succes}</p>}
      {searchParams.erreur && <p style={{ border: '1px solid #ff6b6b', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '0 0 16px' }}>{searchParams.erreur}</p>}

      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.3, margin: '0 0 10px' }}>Mes élèves ({eleves.length})</h2>
      {eleves.length === 0 ? (
        <p style={{ color: COULEURS.texteAtt, fontSize: 13, marginBottom: 28 }}>Aucun élève avec un Mentorat actif.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 28, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: COULEURS.texteFaible, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {['Élève', 'Étape', 'Dernière activité', 'Séances cette semaine', 'Validés', 'En attente', 'À retravailler'].map((t) => (
                  <th key={t} style={{ padding: '10px 12px', fontWeight: 600, borderBottom: `1px solid ${COULEURS.bordure}` }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eleves.map((e) => {
                const j = joursDepuis(e.bilan.derniereActivite);
                const inactif = j === null || j >= 10;
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${COULEURS.bordure}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{e.nom}{e.gele ? <span style={{ fontWeight: 400, color: COULEURS.texteFaible }}> · gelé</span> : null}</td>
                    <td style={{ padding: '10px 12px', color: COULEURS.texteAtt }}>{e.etape}</td>
                    <td style={{ padding: '10px 12px', color: inactif ? '#ff6b6b' : COULEURS.texteAtt }}>{j === null ? 'Jamais' : j === 0 ? "Aujourd'hui" : j === 1 ? 'Hier' : `Il y a ${j} jours`}</td>
                    <td style={{ padding: '10px 12px', color: e.bilan.seances >= 3 ? '#9ef29e' : COULEURS.texteAtt }}>{e.bilan.seances}</td>
                    <td style={{ padding: '10px 12px' }}>{e.acquis}</td>
                    <td style={{ padding: '10px 12px', color: e.bilan.enAttente.length > 0 ? '#f0a' : COULEURS.texteAtt }}>{e.bilan.enAttente.length}</td>
                    <td style={{ padding: '10px 12px' }}>{e.aRetravailler}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.3, margin: '0 0 10px' }}>Vidéos à valider</h2>


      {(soumissions ?? []).length === 0 ? (
        <p style={{ color: COULEURS.texteAtt }}>Aucune soumission en attente pour le moment.</p>
      ) : (
        (soumissions ?? []).map((s: any) => {
          const info = infosPourModuleId(s.module_id);
          const eleve = s.profiles;
          const exercice = exerciceDe(s.module_id);
          const videoEleve = integrationYoutube(s.video_url);
          const videoReference = integrationYoutube(exercice?.videoUrl);
          const cadreVideo: React.CSSProperties = { width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 10, background: '#000' };
          const titreColonne: React.CSSProperties = { fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, margin: '0 0 6px' };
          return (
            <section
              key={`${s.eleve_id}-${s.module_id}`}
              style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20, marginBottom: 16 }}
            >
              <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: 0 }}>
                {eleve?.nom ?? eleve?.email ?? s.eleve_id}
                {info.sousTitre ? ` — ${info.sousTitre}` : ''}
              </p>
              <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '2px 0 10px' }}>
                {info.titre}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
                <div>
                  <p style={titreColonne}>Vidéo de l'élève{s.submitted_at ? ` · envoyée le ${new Date(s.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })}` : ''}</p>
                  {videoEleve && <iframe src={videoEleve} title="Vidéo de l'élève" allow="fullscreen; picture-in-picture" allowFullScreen style={cadreVideo} />}
                  <a href={s.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: '#f0a', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    ▶ Ouvrir la vidéo soumise
                  </a>
                </div>
                {exercice && (
                  <div>
                    <p style={titreColonne}>Référence</p>
                    {videoReference
                      ? <iframe src={videoReference} title="Vidéo de référence" allow="fullscreen; picture-in-picture" allowFullScreen style={cadreVideo} />
                      : <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: 0 }}>Pas de vidéo de référence pour cet exercice.</p>}
                  </div>
                )}
              </div>
              {exercice?.critereValidation && (
                <p style={{ fontSize: 13, color: COULEURS.texte, margin: '12px 0 0', lineHeight: 1.5 }}><strong>Critère :</strong> {exercice.critereValidation}</p>
              )}
              {exercice?.consigne && (
                <p style={{ fontSize: 12, color: COULEURS.texteAtt, margin: '6px 0 0', lineHeight: 1.5 }}><strong>Consigne :</strong> {exercice.consigne}</p>
              )}

              {perfsDe(s.eleve_id, s.module_id).length > 0 && (
                <p style={{ fontSize: 12, color: COULEURS.texteAtt, margin: '10px 0 0' }}>
                  Son suivi : {perfsDe(s.eleve_id, s.module_id).map((p: any) => `${new Date(p.cree_le).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' })} ${p.series}×${p.unite === 'sec' ? (Number(p.valeur) >= 60 ? `${Math.round(Number(p.valeur) / 6) / 10} min` : `${Number(p.valeur)} s`) : `${Number(p.valeur)} reps`}${p.charge_kg ? ` (${Number(p.charge_kg)} kg)` : ''}`).join(' · ')}
                </p>
              )}

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
                    À retravailler (avec commentaire)
                  </summary>
                  <FormulaireRefus action={refuserSoumission} eleveId={s.eleve_id} moduleId={s.module_id} reponses={reponses} />
                </details>
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
