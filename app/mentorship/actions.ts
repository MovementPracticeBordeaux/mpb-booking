'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function basculerModuleVu(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const moduleId = formData.get('module_id') as string;
  const dejaVu = formData.get('deja_vu') === 'true';

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
