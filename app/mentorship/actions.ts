'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { MODULES_MENTORSHIP } from '@/lib/mentorship-modules';

function echouer(message: string): never {
  redirect(`/mentorship?erreur=${encodeURIComponent(message)}`);
}

// L'élève soumet le lien de sa vidéo pour une étape (première soumission,
// ou re-soumission après un refus). Ne rend jamais l'étape "acquise"
// directement — ça reste soumis à la validation de Sylvain dans /admin.
export async function soumettreVideo(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const moduleId = formData.get('module_id') as string;
  const videoUrl = (formData.get('video_url') as string)?.trim();
  const estResoumission = formData.get('resoumission') === 'true';

  if (!videoUrl) echouer('Merci de coller le lien de ta vidéo.');

  const module = MODULES_MENTORSHIP.find((m) => m.id === moduleId);
  if (!module) echouer('Étape introuvable.');

  // Vérifie que l'étape précédente est bien acquise avant d'accepter une
  // soumission (progression fermée).
  if (module.ordre > 1) {
    const etapePrecedente = MODULES_MENTORSHIP.find((m) => m.ordre === module.ordre - 1);
    if (etapePrecedente) {
      const { data: precedenteAcquise } = await supabase
        .from('mentorship_progression')
        .select('statut')
        .eq('eleve_id', user.id)
        .eq('module_id', etapePrecedente.id)
        .eq('statut', 'acquis')
        .maybeSingle();
      if (!precedenteAcquise) echouer('Valide d\'abord l\'étape précédente.');
    }
  }

  const { error } = estResoumission
    ? await supabase.from('mentorship_progression')
        .update({ statut: 'en_attente', video_url: videoUrl, submitted_at: new Date().toISOString() })
        .eq('eleve_id', user.id).eq('module_id', moduleId)
    : await supabase.from('mentorship_progression')
        .insert({ eleve_id: user.id, module_id: moduleId, statut: 'en_attente', video_url: videoUrl });

  if (error) echouer(error.message);

  revalidatePath('/mentorship');
}
