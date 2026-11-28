import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import { TOUS_LES_NOEUDS, DOMAINE_LABELS, estNoeudDeverrouille, estNoeudAcquisDepuisProgression } from '@/lib/mentorship-modules';
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

  // Étapes à venir : une fiche qui n'apparaît que dans des niveaux encore
  // verrouillés pour cet élève reste visible par son nom, mais sa vidéo et son
  // détail restent fermés (l'élève se concentre sur son étape en cours). Les
  // fiches de l'Armure et celles hors de l'arbre restent toujours ouvertes.
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const estAdmin = profil?.role === 'admin';
  const [{ data: lignesProg }, { data: options }] = await Promise.all([
    supabase.from('mentorship_progression').select('module_id, statut').eq('eleve_id', user.id),
    supabase.from('mentorship_options').select('armure_acceleree').eq('eleve_id', user.id).maybeSingle(),
  ]);
  const modulesAcquis = new Set((lignesProg ?? []).filter((l) => l.statut === 'acquis').map((l) => l.module_id as string));
  const idsAcquis = new Set(TOUS_LES_NOEUDS.filter((n) => estNoeudAcquisDepuisProgression(n, (id) => modulesAcquis.has(id))).map((n) => n.id));
  const occurrences = new Map<string, { ouvert: boolean; label: string; niveau: number }[]>();
  for (const noeud of TOUS_LES_NOEUDS) {
    const ouvert = estNoeudDeverrouille(noeud, idsAcquis, !!options?.armure_acceleree);
    const label = `${noeud.domaine === 'tronc' ? 'Armure Organique' : DOMAINE_LABELS[noeud.domaine]} · niveau ${noeud.niveau}`;
    for (const ex of [...(noeud.exercices ?? []), ...(noeud.progressionBonus ?? [])]) {
      for (const url of [ex.videoUrl, ...(ex.outils ?? []).map((o) => o.videoUrl)]) {
        const ficheId = url ? ficheParVideo.get(idVideo(url)) : undefined;
        if (!ficheId) continue;
        if (!occurrences.has(ficheId)) occurrences.set(ficheId, []);
        occurrences.get(ficheId)!.push({ ouvert, label, niveau: noeud.niveau });
      }
    }
  }
  const verrouillees: Record<string, string> = {};
  for (const o of objectifs ?? []) {
    const occ = occurrences.get(o.id);
    if (!occ || o.branche === 'Armure Organique' || occ.some((x) => x.ouvert)) continue;
    verrouillees[o.id] = [...occ].sort((a, b) => a.niveau - b.niveau)[0].label;
  }
  // Côté élève, le contenu verrouillé ne part même pas dans la page.
  const objectifsEnvoyes = (objectifs ?? []).map((o) => (!estAdmin && verrouillees[o.id] ? { ...o, video_url: null, descriptif: null, note: null } : o));
  if (!estAdmin) for (const id of Object.keys(verrouillees)) delete outilsPrecis[id];

  return <ObjectifsExplorer objectifs={objectifsEnvoyes} relations={relations ?? []} outilsPrecis={outilsPrecis} placeArbre={placeArbre} verrouillees={verrouillees} estAdmin={estAdmin} />;
}
