import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { redirect } from 'next/navigation';

export default async function CoachingPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const formule = profil?.formule_nom ? FORMULES[profil.formule_nom] : null;
  const estCoaching = formule?.categorie === 'coaching';

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Mon coaching</h1>
      {!estCoaching || !profil?.abonnement_actif ? (
        <p>
          Tu n'as pas de formule coaching/mentorship active. Rends-toi sur{' '}
          <a href="/tarifs" style={{ color: '#f0a' }}>la page tarifs</a> pour en choisir une.
        </p>
      ) : profil.gele ? (
        <p>❄️ Ton pass est actuellement gelé. Contacte Sylvain pour le débloquer.</p>
      ) : (
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 4px' }}>{formule.nom}</h3>
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            {formule.quota
              ? `${profil.quota_restant} ${formule.unite}${profil.quota_restant > 1 ? 's' : ''} restantes sur ${profil.quota_total}`
              : 'Accès illimité'}
            {' · '}valable jusqu'au {profil.date_expiration}
          </p>
          <p style={{ marginTop: 16 }}>
            Pour caler ton créneau, contacte directement Sylvain :
          </p>
          <a
            href="mailto:contact@movementpracticebordeaux.com?subject=Caler%20mon%20créneau%20coaching"
            style={{ display: 'inline-block', marginTop: 4, padding: '10px 16px', background: '#f0a', color: 'white', borderRadius: 6, textDecoration: 'none' }}
          >
            M'écrire pour caler un créneau
          </a>
        </div>
      )}
    </main>
  );
}
