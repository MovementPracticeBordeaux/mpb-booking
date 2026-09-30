import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { redirect } from 'next/navigation';
import BoutonDeconnexion from '../components/BoutonDeconnexion';
import NotificationsToggle from './NotificationsToggle';
import EmailPreferences from './EmailPreferences';
import { modifierMonPrenom, modifierMonTelephone } from './actions';
import BoutonRenouveler from './BoutonRenouveler';
import { PRICE_IDS } from '@/lib/prix-stripe';

export const dynamic = 'force-dynamic';

const LIBELLE_CATEGORIE: Record<string, string> = {
  planning: 'Cours collectifs',
  coaching: 'Coaching individuel',
  mentorat: 'Mentorat',
};

export default async function ProfilPage({ searchParams }: { searchParams: { paiement?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Un élève peut avoir plusieurs abonnements actifs en même temps (une
  // catégorie chacun) : un pass collectif, un coaching, un mentorat — ou
  // n'importe quelle combinaison des trois.
  const { data: abonnements } = await supabase
    .from('abonnements')
    .select('*')
    .eq('eleve_id', user.id)
    .eq('abonnement_actif', true)
    .order('categorie');

  // Séances collectives déjà réservées à venir (déjà déduites du quota).
  const aujourdhuiISO = new Date().toISOString().slice(0, 10);
  const { count: seancesAVenir } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('eleve_id', user.id)
    .eq('statut', 'confirmee')
    .gte('date_seance', aujourdhuiISO);

  // Défi du mois : juste un petit pointeur vers /defi (qui gère toute la
  // logique — niveaux, validation, classement public) pour éviter de
  // dupliquer cette logique à deux endroits.
  const { data: defiActuel } = (abonnements?.length ?? 0) > 0
    ? await supabase.from('defis_mensuels').select('titre').order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mon profil</h1>
      {searchParams.paiement === 'succes' && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>
          ✅ Paiement reçu, merci ! Ta formule est à jour (si elle n'apparaît pas encore, recharge la page dans quelques secondes).
        </p>
      )}

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: '0 0 4px' }}>{profil?.nom || user.email}</p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>{user.email}</p>
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12, opacity: 0.6, cursor: 'pointer' }}>
            {profil?.nom ? 'Modifier mon prénom' : '⚠️ Ajouter mon prénom'}
          </summary>
          <form action={modifierMonPrenom} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              name="prenom"
              defaultValue={profil?.nom ?? ''}
              placeholder="Ton prénom"
              required
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #444', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 16 }}
            />
            <button type="submit" style={{ fontSize: 13, padding: '10px 14px', minHeight: 40, borderRadius: 6 }}>Enregistrer</button>
          </form>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '6px 0 0' }}>
            Affiché notamment dans le classement du <a href="/defi" style={{ color: '#f0a' }}>défi du mois</a>, jamais ton email.
          </p>
        </details>
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12, opacity: 0.6, cursor: 'pointer' }}>
            {profil?.telephone ? 'Modifier mon téléphone' : '📱 Ajouter mon téléphone'}
          </summary>
          <form action={modifierMonTelephone} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              name="telephone"
              type="tel"
              defaultValue={profil?.telephone ?? ''}
              placeholder="06 12 34 56 78"
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #444', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 16 }}
            />
            <button type="submit" style={{ fontSize: 13, padding: '10px 14px', minHeight: 40, borderRadius: 6 }}>Enregistrer</button>
          </form>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '6px 0 0' }}>
            Facultatif — pour que Sylvain puisse te contacter directement si besoin.
          </p>
        </details>
      </div>

      {defiActuel && (
        <a
          href="/defi"
          style={{
            display: 'block', border: '1px solid #f0a', borderRadius: 8, padding: 16, marginBottom: 20,
            background: 'rgba(255,0,170,0.06)', textDecoration: 'none', color: 'inherit',
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.7, margin: '0 0 6px', textTransform: 'uppercase' }}>
            🏆 Défi du mois
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>{defiActuel.titre} →</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.6 }}>Choisis ton niveau et gagne ton étoile</p>
        </a>
      )}

      <h2 style={{ fontSize: 16, opacity: 0.7 }}>Notifications</h2>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Par email</p>
      <EmailPreferences
        preferencesInitiales={{
          rappel: profil?.notif_email_rappel ?? true,
          confirmation: profil?.notif_email_confirmation ?? true,
        }}
      />

      <p style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 4 }}>Sur ton téléphone</p>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>
        Reçois tes rappels de cours directement sur ton téléphone, même le site fermé.
      </p>
      <NotificationsToggle
        preferencesInitiales={{
          rappel: profil?.notif_push_rappel ?? true,
          confirmation: profil?.notif_push_confirmation ?? true,
        }}
      />

      <h2 style={{ fontSize: 16, opacity: 0.7, marginTop: 24 }}>
        {(abonnements?.length ?? 0) > 1 ? 'Mes abonnements' : 'Mon abonnement'}
      </h2>
      {!abonnements || abonnements.length === 0 ? (
        <p>
          Tu n'as pas de formule active pour le moment. Rends-toi sur{' '}
          <a href="/tarifs" style={{ color: '#f0a' }}>la page tarifs</a> pour en choisir une.
        </p>
      ) : (
        abonnements.map((abo) => {
          const formule = FORMULES[abo.formule_nom];
          if (!formule) return null;
          return (
            <div key={abo.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.5, margin: '0 0 6px', textTransform: 'uppercase' }}>
                {LIBELLE_CATEGORIE[abo.categorie] ?? abo.categorie}
              </p>
              {abo.gele ? (
                <p style={{ margin: 0 }}>❄️ Ce pass est actuellement gelé. Contacte Sylvain pour le débloquer.</p>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 8px' }}>{formule.nom}</h3>
                  {(() => {
                    const joursRestants = abo.date_expiration
                      ? Math.round((new Date(abo.date_expiration + 'T00:00:00Z').getTime() - new Date(aujourdhuiISO + 'T00:00:00Z').getTime()) / 86400000)
                      : null;
                    const dateFin = abo.date_expiration
                      ? new Date(abo.date_expiration + 'T12:00:00Z').toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' })
                      : null;
                    const avecQuota = formule.quota != null && abo.quota_restant != null;
                    // Bientôt terminé : 1 séance/heure restante ou moins, ou
                    // fin de validité dans 7 jours ou moins.
                    const bientotFini = (avecQuota && abo.quota_restant <= 1) || (joursRestants != null && joursRestants <= 7);
                    const pasRenouvelable = ['cours_decouverte', 'cours_unite'].includes(abo.formule_nom) || formule.retiree
                      || abo.categorie === 'mentorat' || !PRICE_IDS[abo.formule_nom]?.startsWith('price_');
                    const couleur = bientotFini ? '#FF8A00' : '#FF2D78';
                    return (
                      <>
                        {avecQuota && (
                          <>
                            <p style={{ fontSize: 14, margin: '0 0 6px' }}>
                              <strong>{abo.quota_restant}</strong> {formule.unite}{abo.quota_restant > 1 ? 's' : ''} restante{abo.quota_restant > 1 ? 's' : ''} sur {abo.quota_total}
                            </p>
                            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                              <div style={{ height: '100%', width: `${abo.quota_total ? Math.min(100, (abo.quota_restant / abo.quota_total) * 100) : 0}%`, background: couleur }} />
                            </div>
                          </>
                        )}
                        {!avecQuota && <p style={{ fontSize: 14, margin: '0 0 6px' }}>Accès illimité</p>}
                        <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>
                          {dateFin && <>Valable jusqu'au <strong>{dateFin}</strong>{joursRestants != null && joursRestants >= 0 ? ` (${joursRestants === 0 ? "dernier jour aujourd'hui" : `encore ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`})` : ''}</>}
                          {abo.categorie === 'planning' && (seancesAVenir ?? 0) > 0 && <><br />{seancesAVenir} séance{(seancesAVenir ?? 0) > 1 ? 's' : ''} déjà réservée{(seancesAVenir ?? 0) > 1 ? 's' : ''} à venir</>}
                        </p>

                        {bientotFini && (
                          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, border: '1px solid rgba(255,138,0,0.5)', background: 'rgba(255,138,0,0.08)' }}>
                            <p style={{ margin: '0 0 10px', fontSize: 14 }}>
                              ⏳ Ta formule arrive bientôt à sa fin.
                              {pasRenouvelable ? ' Choisis la suite pour continuer à pratiquer sans interruption.' : " Renouvelle-la en un clic : les séances et les jours qu'il te reste sont conservés."}
                            </p>
                            {pasRenouvelable ? (
                              <a href="/tarifs" style={{ color: '#FF2D78', fontWeight: 700, fontSize: 14 }}>Voir les formules →</a>
                            ) : (
                              <BoutonRenouveler formuleNom={abo.formule_nom} libelle={`Renouveler — ${formule.prixIndicatif} €`} />
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {abo.formule_nom === 'cours_decouverte' && (
                    <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                      👋 Première fois avec nous ? On te recommande de{' '}
                      <a href="https://wa.me/33620477064" style={{ color: '#f0a' }}>contacter Sylvain sur WhatsApp</a>{' '}
                      avant de venir, pour avoir le lieu exact et ce qu'il faut prévoir.
                    </p>
                  )}
                  {abo.categorie === 'coaching' && (
                    <>
                      <p style={{ marginTop: 16, marginBottom: 4 }}>Pour caler ton créneau, contacte directement Sylvain :</p>
                      <a
                        href="mailto:contact@movementpracticebordeaux.com?subject=Caler%20mon%20créneau%20coaching"
                        style={{ display: 'inline-block', marginTop: 4, padding: '10px 16px', background: '#f0a', color: 'white', borderRadius: 6, textDecoration: 'none' }}
                      >
                        M'écrire pour caler un créneau
                      </a>
                    </>
                  )}
                  {abo.categorie === 'mentorat' && (
                    <a
                      href="/mentorship"
                      style={{ display: 'inline-block', marginTop: 16, padding: '10px 16px', background: '#f0a', color: 'white', borderRadius: 6, textDecoration: 'none' }}
                    >
                      Accéder à mon Mentorat →
                    </a>
                  )}
                </>
              )}
            </div>
          );
        })
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
        <a href="/factures" style={{ color: '#f0a' }}>Voir mes factures →</a>
        <span style={{ flex: 1 }} />
        <BoutonDeconnexion />
      </div>
    </main>
  );
}
