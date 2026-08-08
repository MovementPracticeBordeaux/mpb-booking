'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { MODULES_MENTORSHIP } from '@/lib/mentorship-modules';

export async function basculerModuleVu(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const moduleId = formData.get('module_id') as string;
  const dejaVu = formData.get('deja_vu') === 'true';

  const module = MODULES_MENTORSHIP.find((m) => m.id === moduleId);
  if (!module) return;

  // On ne peut marquer une étape comme acquise que si la précédente l'est
  // déjà (progression fermée). On peut en revanche toujours décocher.
  if (!dejaVu && module.ordre > 1) {
    const etapePrecedente = MODULES_MENTORSHIP.find((m) => m.ordre === module.ordre - 1);
    if (etapePrecedente) {
      const { data: precedenteAcquise } = await supabase
        .from('mentorship_progression')
        .select('module_id')
        .eq('eleve_id', user.id)
        .eq('module_id', etapePrecedente.id)
        .maybeSingle();
      if (!precedenteAcquise) {
        // Étape précédente pas encore acquise : on ignore la demande.
        revalidatePath('/mentorship');
        return;
      }
    }
  }

  if (dejaVu) {
    await supabase.from('mentorship_progression').delete()
      .eq('eleve_id', user.id).eq('module_id', moduleId);
  } else {
    await supabase.from('mentorship_progression').upsert({
      eleve_id: user.id,
      module_id: moduleId,
      vu: true,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath('/mentorship');
}
