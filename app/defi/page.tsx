import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { choisirNiveauDefi } from './actions';

export const dynamic = 'force-dynamic';

const COULEUR_NIVEAU: Record<string, string> = {
  facile: '#CD7F32', // bronze
  moyen: '#C0C0C0', // argent
  dur: '#FFD700', // or
};
const LABEL_NIVEAU: Record<string, string> = { facile: 'Bronze', moyen: 'Argent', dur: 'Or' };

function Etoile({ couleur, taille = 20 }: { couleur: string; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur} style={{ filter: `drop-shadow(0 0 3px ${couleur}66)` }}>
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
    </svg>
  );
}

export default async function DefiPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = supabaseAdmin();

  const { data: defiActuel } = await admin
    .from('defis_mensuels')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // A-t-il un abonnement actif (n'importe quelle catégorie) ? Nécessaire
  // pour pouvoir participer, pas juste consulter.
  let aUnAbonnementActif = false;
  let maParticipation: { niveau: string; valide: boolean } | null = null;
  let monPrenom: string | null = null;
  if (user) {
    const { count } = await admin
      .from('abonnements')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', user.id)
      .eq('abonnement_actif', true);
    aUnAbonnementActif = (count ?? 0) > 0;

    const { data: monProfil } = await admin.from('profiles').select('nom').eq('id', user.id).maybeSingle();
    monPrenom = monProfil?.nom ?? null;

    if (defiActuel) {
      const { data } = await admin
        .from('defi_participations')
        .select('niveau, valide')
        .eq('defi_id', defiActuel.id)
        .eq('eleve_id', user.id)
        .maybeSingle();
      maParticipation = data;
    }
  }

  // Classement public : tout le monde ayant déjà été validé sur au moins un
  // défi, avec le détail coloré de chaque étoile gagnée. Lecture en tant
  // qu'admin (RLS sur profiles empêcherait sinon de voir le nom des autres
  // élèves) — on ne projette que le strict nécessaire à l'affichage.
  const { data: participationsValidees } = await admin
    .from('defi_participations')
    .select('eleve_id, niveau, valide_le, defis_mensuels(titre)')
    .eq('valide', true)
    .order('valide_le', { ascending: true });

  const idsGagnants = [...new Set((participationsValidees ?? []).map((p) => p.eleve_id))];
  const { data: profilsGagnants } = idsGagnants.length > 0
    ? await admin.from('profiles').select('id, nom, email').in('id', idsGagnants)
    : { data: [] as { id: string; nom: string | null; email: string }[] };
  const nomParId = new Map((profilsGagnants ?? []).map((p) => [p.id, p.nom || 'Élève']));

  type LigneClassement = { eleveId: string; nom: string; etoiles: { niveau: string; titre: string }[] };
  const classementMap = new Map<string, LigneClassement>();
  for (const p of participationsValidees ?? []) {
    const ligne: LigneClassement = classementMap.get(p.eleve_id) ?? { eleveId: p.eleve_id, nom: nomParId.get(p.eleve_id) ?? 'Élève', etoiles: [] };
    ligne.etoiles.push({ niveau: p.niveau, titre: (p.defis_mensuels as any)?.titre ?? '' });
    classementMap.set(p.eleve_id, ligne);
  }
  const classement = [...classementMap.values()].sort((a, b) => b.etoiles.length - a.etoiles.length);

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <h1>🏆 Défi du mois</h1>

      {!defiActuel && <p style={{ opacity: 0.7 }}>Aucun défi en cours pour le moment — reviens bientôt !</p>}

      {defiActuel && (
        <div style={{ border: '1px solid #f0a', borderRadius: 12, padding: 20, marginBottom: 32, background: 'rgba(255,0,170,0.06)' }}>
          <h2 style={{ marginTop: 0 }}>{defiActuel.titre}</h2>

          {!user && (
            <p style={{ fontSize: 14 }}>
              <a href="/login" style={{ color: '#f0a' }}>Connecte-toi</a> pour participer et gagner ton étoile.
            </p>
          )}

          {user && !aUnAbonnementActif && (
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              Le défi du mois est réservé aux élèves ayant un abonnement actif — <a href="/tarifs" style={{ color: '#f0a' }}>voir les formules</a>.
            </p>
          )}

          {user && aUnAbonnementActif && !maParticipation && (
            <>
              {!monPrenom && (
                <p style={{ fontSize: 12, opacity: 0.75, background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: 6, marginBottom: 10 }}>
                  👋 Le classement affiche des prénoms, jamais d'emails — indique le tien ci-dessous, il sera
                  enregistré sur ta fiche pour la prochaine fois.
                </p>
              )}
              <p style={{ fontWeight: 600 }}>{defiActuel.question_niveau}</p>
              <form action={choisirNiveauDefi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="hidden" name="defi_id" value={defiActuel.id} />
                {!monPrenom && (
                  <input
                    name="prenom"
                    placeholder="Ton prénom"
                    required
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #444', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 13 }}
                  />
                )}
                {(['facile', 'moyen', 'dur'] as const).map((niv) => (
                  <button
                    key={niv}
                    type="submit"
                    name="niveau"
                    value={niv}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${COULEUR_NIVEAU[niv]}`, background: 'none', color: 'inherit', fontSize: 13,
                    }}
                  >
                    <Etoile couleur={COULEUR_NIVEAU[niv]} taille={18} />
                    {niv === 'facile' && 'Pas trop souvent — je tente la version accessible'}
                    {niv === 'moyen' && "Assez régulièrement — je tente la version intermédiaire"}
                    {niv === 'dur' && 'Très régulièrement — je tente la version corsée'}
                  </button>
                ))}
              </form>
            </>
          )}

          {user && aUnAbonnementActif && maParticipation && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Etoile couleur={COULEUR_NIVEAU[maParticipation.niveau]} />
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Niveau {LABEL_NIVEAU[maParticipation.niveau]}
                  {maParticipation.valide ? ' · ✅ Validé, étoile gagnée !' : ' · en attente de validation'}
                </span>
              </div>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {maParticipation.niveau === 'facile' && defiActuel.description_facile}
                {maParticipation.niveau === 'moyen' && defiActuel.description_moyen}
                {maParticipation.niveau === 'dur' && defiActuel.description_dur}
              </p>
              {!maParticipation.valide && (
                <>
                  <a href="https://wa.me/33620477064" style={{ fontSize: 13, color: '#f0a', display: 'inline-block', marginBottom: 8 }}>
                    Envoyer ma vidéo sur WhatsApp →
                  </a>
                  <br />
                  <form action={choisirNiveauDefi}>
                    <input type="hidden" name="defi_id" value={defiActuel.id} />
                    <input type="hidden" name="niveau" value="facile" />
                    <details>
                      <summary style={{ fontSize: 12, opacity: 0.6, cursor: 'pointer' }}>Changer de niveau</summary>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {(['facile', 'moyen', 'dur'] as const).map((niv) => (
                          <button
                            key={niv}
                            type="submit"
                            name="niveau"
                            value={niv}
                            formAction={choisirNiveauDefi}
                            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${COULEUR_NIVEAU[niv]}`, background: 'none', color: 'inherit', cursor: 'pointer' }}
                          >
                            {LABEL_NIVEAU[niv]}
                          </button>
                        ))}
                      </div>
                    </details>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}

      <h2>Classement des étoiles</h2>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: -8 }}>
        🥉 Bronze · 🥈 Argent · 🥇 Or — une étoile par défi validé, colorée selon le niveau relevé.
      </p>
      {classement.length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Personne n'a encore validé de défi — sois le premier !</p>}
      {classement.map((ligne, i) => (
        <div key={ligne.eleveId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
          <span style={{ width: 22, textAlign: 'right', opacity: 0.5, fontSize: 13 }}>{i + 1}.</span>
          <span style={{ flex: 1, fontSize: 14 }}>{ligne.nom}</span>
          <span style={{ display: 'flex', gap: 2 }}>
            {ligne.etoiles.map((e, j) => <Etoile key={j} couleur={COULEUR_NIVEAU[e.niveau]} taille={16} />)}
          </span>
          <span style={{ fontSize: 12, opacity: 0.6, minWidth: 20, textAlign: 'right' }}>{ligne.etoiles.length}</span>
        </div>
      ))}
    </main>
  );
}
