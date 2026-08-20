import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ajouterRelation, supprimerRelation, mettreAJourObjectif } from './actions';
import ObjectifsAdmin from './ObjectifsAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminObjectifsPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') redirect('/');

  const admin = supabaseAdmin();
  const { data: objectifs } = await admin
    .from('objectifs_mentorship')
    .select('id, titre, branche, sous_groupe, video_url, mots_cles, note')
    .order('branche')
    .order('titre');
  const { data: relations } = await admin
    .from('objectifs_relations')
    .select('id, objectif_source_id, objectif_cible_id, type');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h1>Objectifs — toile de progression</h1>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        {objectifs?.length ?? 0} objectifs, {relations?.length ?? 0} relations "sert à" définies. Clique sur un
        objectif pour ajouter une relation, des mots-clés de recherche ou une note.
      </p>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>⚠️ {searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>✅ {searchParams.succes}</p>
      )}

      <ObjectifsAdmin
        objectifs={objectifs ?? []}
        relations={relations ?? []}
        ajouterRelation={ajouterRelation}
        supprimerRelation={supprimerRelation}
        mettreAJourObjectif={mettreAJourObjectif}
      />
    </main>
  );
}
