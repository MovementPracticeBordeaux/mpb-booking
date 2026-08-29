import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { redirect } from 'next/navigation';
import BoutonDeconnexion from '../components/BoutonDeconnexion';
import NotificationsToggle from './NotificationsToggle';
import EmailPreferences from './EmailPreferences';

export const dynamic = 'force-dynamic';

const LIBELLE_CATEGORIE: Record<string, string> = {
  planning: 'Cours collectifs',
  coaching: 'Coaching individuel',
  mentorat: 'Mentorat',
};

export default async function ProfilPage() {
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

  // Défi du mois : un seul défi partagé, affiché uniquement si l'élève a
  // au moins un abonnement actif (peu importe lequel).
  const { data: defiActuel } = (abonnements?.length ?? 0) > 0
    ? await supabase.from('defis_mensuels').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mon profil</h1>

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: '0 0 4px' }}>{profil?.nom || user.email}</p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>{user.email}</p>
      </div>

      {defiActuel && (
        <div style={{ border: '1px solid #f0a', borderRadius: 8, padding: 16, marginBottom: 20, background: 'rgba(255,0,170,0.06)' }}>
          <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.7, margin: '0 0 6px', textTransform: 'uppercase' }}>
            🏆 Défi du mois
          </p>
          <h3 style={{ margin: '0 0 6px' }}>{defiActuel.titre}</h3>
          <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{defiActuel.description}</p>
          <a href="https://wa.me/33620477064" style={{ fontSize: 13, color: '#f0a' }}>
            Envoyer ma vidéo sur WhatsApp →
          </a>
        </div>
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
                  <h3 style={{ margin: '0 0 4px' }}>{formule.nom}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
                    {formule.quota
                      ? `${abo.quota_restant} ${formule.unite}${abo.quota_restant > 1 ? 's' : ''} restantes sur ${abo.quota_total}`
                      : 'Accès illimité'}
                    {' · '}valable jusqu'au {abo.date_expiration}
                  </p>
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
