import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { choisirNiveauDefi, tenterNiveauSuperieur } from './actions';
import DefiOnglets from './DefiOnglets';
import EmojiBeast from './EmojiBeast';

export const dynamic = 'force-dynamic';

const COULEUR_NIVEAU: Record<string, string> = {
  facile: '#CD7F32', // bronze
  moyen: '#C0C0C0', // argent
  dur: '#FFD700', // or
  beast: '#FF2D78', // au-dessus de l'or : scintille immédiatement (voir EstMythique)
};
const LABEL_NIVEAU: Record<string, string> = { facile: 'Bronze', moyen: 'Argent', dur: 'Or', beast: 'Beast' };
const ORDRE_NIVEAU: Record<string, number> = { facile: 0, moyen: 1, dur: 2, beast: 3 };
const SEUIL_MYTHIQUE = 3; // nombre d'étoiles or à partir duquel le prénom scintille

function Etoile({ couleur, taille = 20 }: { couleur: string; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur} style={{ filter: `drop-shadow(0 0 3px ${couleur}66)` }}>
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
    </svg>
  );
}

type LigneClassement = { eleveId: string; nom: string; etoiles: { niveau: string; titre: string }[] };

function ClassementListe({ lignes }: { lignes: LigneClassement[] }) {
  return (
    <>
      {lignes.length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Personne n'a encore validé de défi — sois le premier !</p>}
      {lignes.map((ligne, i) => {
        const nbOr = ligne.etoiles.filter((e) => e.niveau === 'dur').length;
        const nbBeast = ligne.etoiles.filter((e) => e.niveau === 'beast').length;
        // Une seule étoile Beast suffit à scintiller immédiatement (elle
        // représente déjà un dépassement du niveau or) ; sinon, il faut
        // accumuler plusieurs étoiles or pour le même effet.
        const estMythique = nbOr >= SEUIL_MYTHIQUE || nbBeast >= 1;
        return (
          <div key={ligne.eleveId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
            <span style={{ width: 22, textAlign: 'right', opacity: 0.5, fontSize: 13 }}>{i + 1}.</span>
            <span
              style={{
                flex: 1, fontSize: 14,
                ...(estMythique
                  ? { color: '#f0f', fontWeight: 700, animation: 'glow-defi-mythique 2.4s ease-in-out infinite' }
                  : {}),
              }}
            >
              {ligne.nom}{estMythique && ' ✨'}
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              {ligne.etoiles.map((e, j) => <Etoile key={j} couleur={COULEUR_NIVEAU[e.niveau]} taille={16} />)}
            </span>
            <span style={{ fontSize: 12, opacity: 0.6, minWidth: 20, textAlign: 'right' }}>{ligne.etoiles.length}</span>
          </div>
        );
      })}
    </>
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
  let maParticipation: { niveau: string; valide: boolean; tentative_superieure: string | null } | null = null;
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
        .select('niveau, valide, tentative_superieure')
        .eq('defi_id', defiActuel.id)
        .eq('eleve_id', user.id)
        .maybeSingle();
      maParticipation = data;
    }
  }

  // Classement : tout le monde ayant déjà été validé sur au moins un défi,
  // avec le détail coloré de chaque étoile gagnée. Lecture en tant
  // qu'admin (RLS sur profiles empêcherait sinon de voir le nom des autres
  // élèves) — on ne projette que le strict nécessaire à l'affichage.
  const { data: participationsValidees } = await admin
    .from('defi_participations')
    .select('eleve_id, niveau, defi_id, valide_le, defis_mensuels(titre)')
    .eq('valide', true)
    .order('valide_le', { ascending: true });

  const idsGagnants = [...new Set((participationsValidees ?? []).map((p) => p.eleve_id))];
  const { data: profilsGagnants } = idsGagnants.length > 0
    ? await admin.from('profiles').select('id, nom, email').in('id', idsGagnants)
    : { data: [] as { id: string; nom: string | null; email: string }[] };
  const nomParId = new Map((profilsGagnants ?? []).map((p) => [p.id, p.nom || 'Élève']));

  // Trie par réussite : d'abord le nombre d'étoiles du plus haut niveau
  // (or), puis argent, puis bronze en cas d'égalité — pas juste le total
  // brut, pour valoriser la difficulté plutôt que la seule quantité.
  function trierParNiveauPuisTotal(lignes: LigneClassement[]): LigneClassement[] {
    return lignes.sort((a, b) => {
      for (const niv of ['dur', 'moyen', 'facile'] as const) {
        const diff = b.etoiles.filter((e) => e.niveau === niv).length - a.etoiles.filter((e) => e.niveau === niv).length;
        if (diff !== 0) return diff;
      }
      return 0;
    });
  }

  function construireClassement(participations: typeof participationsValidees): LigneClassement[] {
    const map = new Map<string, LigneClassement>();
    for (const p of participations ?? []) {
      const ligne: LigneClassement = map.get(p.eleve_id) ?? { eleveId: p.eleve_id, nom: nomParId.get(p.eleve_id) ?? 'Élève', etoiles: [] };
      ligne.etoiles.push({ niveau: p.niveau, titre: (p.defis_mensuels as any)?.titre ?? '' });
      map.set(p.eleve_id, ligne);
    }
    return trierParNiveauPuisTotal([...map.values()]);
  }

  // Deux classements distincts : celui du défi affiché en ce moment (pour
  // voir qui performe sur CE défi précis), et le cumul de toutes les
  // étoiles gagnées depuis le début (pour garder une continuité du travail
  // de fond d'un défi à l'autre) — chacun dans son propre onglet.
  const classementDefiActuel = defiActuel
    ? construireClassement((participationsValidees ?? []).filter((p) => p.defi_id === defiActuel.id))
    : [];
  const classementTotal = construireClassement(participationsValidees);

  const ongletDefi = (
    <>
      {!defiActuel && <p style={{ opacity: 0.7 }}>Aucun défi en cours pour le moment — reviens bientôt !</p>}

      {defiActuel && (
        <div style={{ border: '1px solid #f0a', borderRadius: 12, padding: 20, marginBottom: 24, background: 'rgba(255,0,170,0.06)' }}>
          <h2 style={{ marginTop: 0 }}>{defiActuel.titre}</h2>

          {(defiActuel.explication || defiActuel.regressions) && (
            <details style={{ marginBottom: 14 }}>
              <summary style={{ fontSize: 12, color: '#f0a', cursor: 'pointer' }}>
                📖 Pourquoi ce défi, et comment l'adapter si besoin ?
              </summary>
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
                {defiActuel.explication && (
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{defiActuel.explication}</p>
                )}
                {defiActuel.regressions && (
                  <>
                    <p style={{ fontSize: 11, letterSpacing: 0.5, opacity: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
                      🩹 Si c'est douloureux ou trop difficile
                    </p>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{defiActuel.regressions}</p>
                  </>
                )}
              </div>
            </details>
          )}

          {!user && (
            <div style={{ fontSize: 13, opacity: 0.9, background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <p style={{ margin: '0 0 8px' }}>
                Chaque mois, Sylvain propose un défi ouvert à tous les élèves ayant un <strong>abonnement actif</strong>.
                Trois niveaux au choix selon ta régularité (bronze/argent/or), une étoile gagnée à chaque validation,
                et un classement pour suivre ta progression dans la durée. Les plus assidus peuvent même viser le
                mode <EmojiBeast /> Beast, réservé à ceux qui dépassent le niveau or.
              </p>
              <p style={{ margin: 0 }}>
                <a href="/login" style={{ color: '#f0a' }}>Connecte-toi</a> si tu as déjà une formule, ou{' '}
                <a href="/tarifs" style={{ color: '#f0a' }}>découvre nos formules</a> pour pouvoir participer.
              </p>
            </div>
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
                  {maParticipation.valide
                    ? (maParticipation.niveau === 'beast' ? <> · <EmojiBeast /> Validé, tu scintilles dans le classement !</> : ' · ✅ Validé, étoile gagnée !')
                    : ' · en attente de validation'}
                </span>
              </div>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {maParticipation.niveau === 'facile' && defiActuel.description_facile}
                {maParticipation.niveau === 'moyen' && defiActuel.description_moyen}
                {maParticipation.niveau === 'dur' && defiActuel.description_dur}
                {maParticipation.niveau === 'beast' && defiActuel.description_beast}
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

              {maParticipation.valide && maParticipation.niveau !== 'beast'
                && (maParticipation.niveau !== 'dur' || defiActuel.description_beast) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #444' }}>
                  {maParticipation.tentative_superieure ? (
                    <>
                      <p style={{ fontSize: 12, opacity: 0.75 }}>
                        🎯 Tentative niveau {LABEL_NIVEAU[maParticipation.tentative_superieure]} en attente de validation —
                        ton étoile {LABEL_NIVEAU[maParticipation.niveau]} reste acquise en attendant, tu ne peux pas la perdre.
                      </p>
                      <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginTop: 8 }}>
                        {maParticipation.tentative_superieure === 'facile' && defiActuel.description_facile}
                        {maParticipation.tentative_superieure === 'moyen' && defiActuel.description_moyen}
                        {maParticipation.tentative_superieure === 'dur' && defiActuel.description_dur}
                        {maParticipation.tentative_superieure === 'beast' && defiActuel.description_beast}
                      </p>
                      <a href="https://wa.me/33620477064" style={{ fontSize: 13, color: '#f0a' }}>
                        Envoyer ma vidéo sur WhatsApp →
                      </a>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                        {maParticipation.niveau === 'dur'
                          ? "Tu es déjà à l'or — envie de tenter le mode Beast et scintiller directement dans le classement ?"
                          : "Envie d'aller plus loin ? Tu peux tenter un niveau supérieur sans perdre l'étoile que tu as déjà."}
                      </p>
                      <form action={tenterNiveauSuperieur} style={{ display: 'flex', gap: 6 }}>
                        <input type="hidden" name="defi_id" value={defiActuel.id} />
                        {(['facile', 'moyen', 'dur', 'beast'] as const)
                          .filter((niv) => ORDRE_NIVEAU[niv] > ORDRE_NIVEAU[maParticipation.niveau])
                          .filter((niv) => niv !== 'beast' || defiActuel.description_beast)
                          .map((niv) => (
                            <button
                              key={niv}
                              type="submit"
                              name="niveau"
                              value={niv}
                              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${COULEUR_NIVEAU[niv]}`, background: 'none', color: 'inherit', cursor: 'pointer' }}
                            >
                              {niv === 'beast' && <EmojiBeast />}{niv === 'beast' ? ' ' : ''}Tenter {LABEL_NIVEAU[niv]}
                            </button>
                          ))}
                      </form>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <h2>Classement — ce défi</h2>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: -8 }}>
        🥉 Bronze · 🥈 Argent · 🥇 Or · <EmojiBeast /> Beast — trié par niveau de réussite, du plus dur au plus accessible.
      </p>
      <ClassementListe lignes={classementDefiActuel} />
    </>
  );

  const ongletClassement = (
    <>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: -4 }}>
        Le cumul de tous les défis validés depuis le début — pour suivre ta progression dans la durée, pas juste ce mois-ci.
        {' '}À partir de {SEUIL_MYTHIQUE} étoiles or (ou une seule étoile <EmojiBeast /> Beast), ton prénom scintille ✨
      </p>
      <ClassementListe lignes={classementTotal} />
    </>
  );

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <style>{`
        @keyframes glow-defi-mythique {
          0%, 100% { text-shadow: 0 0 4px #FF3B30bb, 0 0 8px #FF2D78bb, 0 0 14px #8B5CF6aa; }
          50% { text-shadow: 0 0 8px #FF3B30dd, 0 0 16px #FF2D78dd, 0 0 26px #8B5CF6dd; }
        }
      `}</style>
      <h1>🏆 Défis</h1>
      <DefiOnglets ongletDefi={ongletDefi} ongletClassement={ongletClassement} />
    </main>
  );
}
