'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ARBRE_COMPETENCES, estNoeudDeverrouille } from '@/lib/mentorship-modules';

function echouer(message: string): never {
  redirect(`/mentorship?erreur=${encodeURIComponent(message)}`);
}

// L'élève soumet le lien de sa vidéo pour un nœud de compétence (première
// soumission, ou re-soumission après un refus). Ne rend jamais le nœud
// "acquis" directement — ça reste soumis à la validation de Sylvain dans
// /admin/mentorship.
export async function soumettreVideo(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const noeudId = formData.get('noeud_id') as string;
  const videoUrl = (formData.get('video_url') as string)?.trim();
  const estResoumission = formData.get('resoumission') === 'true';

  if (!videoUrl) echouer('Merci de coller le lien de ta vidéo.');

  const noeud = ARBRE_COMPETENCES.find((n) => n.id === noeudId);
  if (!noeud) echouer('Compétence introuvable.');

  const { data: acquisData } = await supabase
    .from('mentorship_progression')
    .select('module_id')
    .eq('eleve_id', user.id)
    .eq('statut', 'acquis');
  const idsAcquis = new Set((acquisData ?? []).map((d) => d.module_id));

  if (!estNoeudDeverrouille(noeud, idsAcquis)) {
    echouer('Les prérequis de cette compétence ne sont pas encore tous acquis.');
  }

  const { error } = estResoumission
    ? await supabase.from('mentorship_progression')
        .update({ statut: 'en_attente', video_url: videoUrl, submitted_at: new Date().toISOString() })
        .eq('eleve_id', user.id).eq('module_id', noeudId)
    : await supabase.from('mentorship_progression')
        .insert({ eleve_id: user.id, module_id: noeudId, statut: 'en_attente', video_url: videoUrl });

  if (error) echouer(error.message);

  revalidatePath('/mentorship');
}
