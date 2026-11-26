import { redirect } from 'next/navigation';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { FORMULES, FORMULES_MENTORAT_DUREE, FORMULE_MENTORAT_RECOMMANDEE } from '@/lib/formules';
import BoutonPayerMentorat from './BoutonPayerMentorat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inscription au Mentorat | Movement Practice Bordeaux', robots: { index: false } };

// Page d'inscription réservée aux candidats acceptés (même adresse email que
// la candidature) et aux élèves qui ont déjà eu le Mentorat (renouvellement).
// Le lien est envoyé par email à l'acceptation de la candidature.
export default async function InscriptionMentoratPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mentorat/inscription');

  const admin = supabaseAdmin();
  const email = (user.email ?? '').replace(/[\\%_]/g, (c) => `\\${c}`);
  const [{ count: acceptees }, { count: dejaEleve }, { data: profil }] = await Promise.all([
    email ? admin.from('mentorat_candidatures').select('id', { count: 'exact', head: true }).ilike('email', email).eq('statut', 'acceptee') : Promise.resolve({ count: 0 }),
    admin.from('abonnements').select('id', { count: 'exact', head: true }).eq('eleve_id', user.id).eq('categorie', 'mentorat'),
    admin.from('profiles').select('telephone').eq('id', user.id).maybeSingle(),
  ]);
  const autorise = (acceptees ?? 0) > 0 || (dejaEleve ?? 0) > 0;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 64px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(26px, 6vw, 40px)', letterSpacing: 0.5, margin: '0 0 12px', textAlign: 'center' }}>
        INSCRIPTION AU <span style={GRADIENT_TEXTE}>MENTORAT</span>
      </h1>
      {!autorise ? (
        <p style={{ color: COULEURS.texteAtt, textAlign: 'center', lineHeight: 1.6 }}>
          Cette page est réservée aux candidatures acceptées. Connecte-toi avec l'adresse email de ta candidature,
          ou <a href="/mentorat/candidature" style={{ color: '#f0a' }}>candidate au Mentorat</a>.
        </p>
      ) : (
        <>
          <p style={{ color: COULEURS.texteAtt, textAlign: 'center', lineHeight: 1.6, margin: '0 0 28px' }}>
            Bienvenue ! Choisis la durée de ton Mentorat. Le parcours est le même dans les trois cas ; seule la durée change.
            Tu peux payer par carte, ou en plusieurs fois sans frais avec Klarna quand il est proposé au paiement.
          </p>
          {!profil?.telephone && (
            <p style={{ border: '1px solid #FFC24B', color: '#FFC24B', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '0 0 20px' }}>
              Avant de payer, renseigne ton numéro de téléphone sur <a href="/profil" style={{ color: 'inherit' }}>ton profil</a>.
            </p>
          )}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
            {FORMULES_MENTORAT_DUREE.map((cle) => {
              const f = FORMULES[cle];
              const reco = cle === FORMULE_MENTORAT_RECOMMANDEE;
              return (
                <div key={cle} style={{ position: 'relative', border: `1px solid ${reco ? '#FF2D78' : COULEURS.bordure}`, borderRadius: 14, padding: 20, background: COULEURS.surface, textAlign: 'center' }}>
                  {reco && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #FF3B30, #FF2D78, #8B5CF6)', color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>Recommandé</span>}
                  <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, margin: '0 0 6px' }}>{f.nom.replace('Mentorat — ', '')}</p>
                  <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, margin: 0, ...GRADIENT_TEXTE }}>{f.prixIndicatif} €</p>
                  <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '2px 0 16px' }}>soit {Math.round(f.prixIndicatif / f.validiteMois)} € / mois</p>
                  <BoutonPayerMentorat formuleNom={cle} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
