import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import OutilForce from './OutilForce';

export const dynamic = 'force-dynamic';

export default async function OutilForcePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: aboMentorat } = await supabase
    .from('abonnements')
    .select('gele')
    .eq('eleve_id', user.id)
    .eq('categorie', 'mentorat')
    .eq('abonnement_actif', true)
    .maybeSingle();
  const accesAutorise = !!aboMentorat && !aboMentorat.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28 }}>OUTIL FORCE</h1>
        <p style={{ color: COULEURS.texteAtt }}>Cette page est réservée aux élèves ayant le Mentorat actif.</p>
      </main>
    );
  }

  const { data: historiqueData } = await supabase
    .from('historique_reps_sets')
    .select('id, exercice, reps_par_set, lieu, ressenti, cree_le')
    .order('cree_le', { ascending: false })
    .limit(50);

  return <OutilForce historiqueInitial={historiqueData ?? []} />;
}
