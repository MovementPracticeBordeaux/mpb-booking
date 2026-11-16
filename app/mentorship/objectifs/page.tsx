import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { TOUS_LES_NOEUDS, DOMAINE_LABELS } from '@/lib/mentorship-modules';
import ObjectifsExplorer, { type OutilPrecis } from './ObjectifsExplorer';

// Identifiant YouTube d'un lien, pour rapprocher une vidéo de l'arbre de sa
// fiche même si l'adresse n'est pas écrite exactement pareil.
function idVideo(url: string): string {
  return url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/)([\w-]{6,})/)?.[1] ?? url.trim();
}

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
    .select('id, titre, branche, sous_groupe, video_url, mots_cles, note, famille, niveau, tags, descriptif')
    .order('titre');
  const { data: relations } = await supabase
    .from('objectifs_relations')
    .select('id, objectif_source_id, objectif_cible_id, type');

  // Pont arbre -> fiches : les outils que Sylvain a rattachés à chaque objectif
  // de l'arbre (et sa place dans l'arbre) sont repris tels quels sur la fiche
  // correspondante. Calculé côté serveur : le fichier des nœuds contient les
  // réponses des QCM et ne doit pas partir dans le navigateur.
  const ficheParVideo = new Map<string, string>();
  for (const o of objectifs ?? []) if (o.video_url) ficheParVideo.set(idVideo(o.video_url), o.id);
  const outilsPrecis: Record<string, OutilPrecis[]> = {};
  const placeArbre: Record<string, string> = {};
  for (const noeud of TOUS_LES_NOEUDS) {
    const branche = noeud.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[noeud.domaine];
    const groupes = [
      { liste: noeud.exercices ?? [], bonus: false },
      { liste: noeud.progressionBonus ?? [], bonus: true },
    ];
    for (const { liste, bonus } of groupes) {
      for (const ex of liste) {
        const ficheId = ex.videoUrl ? ficheParVideo.get(idVideo(ex.videoUrl)) : undefined;
        if (!ficheId) continue;
        placeArbre[ficheId] ??= `${branche} · niveau ${noeud.niveau}${bonus ? ' · quête secondaire' : ''}`;
        if (ex.outils?.length && !outilsPrecis[ficheId]) {
          outilsPrecis[ficheId] = ex.outils.map((o) => ({ nom: o.nom, videoUrl: o.videoUrl, ficheId: ficheParVideo.get(idVideo(o.videoUrl)) ?? null }));
        }
      }
    }
  }

  return <ObjectifsExplorer objectifs={objectifs ?? []} relations={relations ?? []} outilsPrecis={outilsPrecis} placeArbre={placeArbre} />;
}
