import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { redirect } from 'next/navigation';
import BoutonDeconnexion from '../components/BoutonDeconnexion';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const formule = profil?.formule_nom ? FORMULES[profil.formule_nom] : null;
  const estCoaching = formule?.categorie === 'coaching';

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mon profil</h1>

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: '0 0 4px' }}>{profil?.nom || user.email}</p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>{user.email}</p>
      </div>

      <h2 style={{ fontSize: 16, opacity: 0.7 }}>Mon abonnement</h2>
      {!formule || !profil?.abonnement_actif ? (
        <p>
          Tu n'as pas de formule active pour le moment. Rends-toi sur{' '}
          <a href="/tarifs" style={{ color: '#f0a' }}>la page tarifs</a> pour en choisir une.
        </p>
      ) : profil.gele ? (
        <p>❄️ Ton pass est actuellement gelé. Contacte Sylvain pour le débloquer.</p>
      ) : (
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 4px' }}>{formule.nom}</h3>
          <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
            {formule.quota
              ? `${profil.quota_restant} ${formule.unite}${profil.quota_restant > 1 ? 's' : ''} restantes sur ${profil.quota_total}`
              : 'Accès illimité'}
            {' · '}valable jusqu'au {profil.date_expiration}
          </p>
          {estCoaching && (
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
          {['mentorship', 'post_mentorship'].includes(profil.formule_nom) && (
            <a
              href="/mentorship"
              style={{ display: 'inline-block', marginTop: 16, padding: '10px 16px', background: '#f0a', color: 'white', borderRadius: 6, textDecoration: 'none' }}
            >
              Accéder à mon programme Mentorship →
            </a>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
        <a href="/factures" style={{ color: '#f0a' }}>Voir mes factures →</a>
        <span style={{ flex: 1 }} />
        <BoutonDeconnexion />
      </div>
    </main>
  );
}
