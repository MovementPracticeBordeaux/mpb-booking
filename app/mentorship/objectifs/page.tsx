import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import ObjectifsExplorer from './ObjectifsExplorer';

export const dynamic = 'force-dynamic';

export default async function ObjectifsPage() {
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
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28 }}>OBJECTIFS</h1>
        <p style={{ color: COULEURS.texteAtt }}>Cette page est réservée aux élèves ayant le Mentorat actif.</p>
      </main>
    );
  }

  const { data: objectifs } = await supabase
    .from('objectifs_mentorship')
    .select('id, titre, branche, sous_groupe, video_url, mots_cles, note')
    .order('titre');
  const { data: relations } = await supabase
    .from('objectifs_relations')
    .select('id, objectif_source_id, objectif_cible_id, type');

  return <ObjectifsExplorer objectifs={objectifs ?? []} relations={relations ?? []} />;
}
