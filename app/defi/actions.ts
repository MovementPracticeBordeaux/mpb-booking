'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Un élève choisit (ou change, tant qu'il n'a pas encore été validé par
// l'admin) son niveau pour le défi en cours. La policy RLS
// defi_participations_ecriture_propre garantit qu'il ne peut agir que sur
// sa propre participation, jamais se marquer lui-même comme validé.
export async function choisirNiveauDefi(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const defiId = formData.get('defi_id') as string;
  const niveau = formData.get('niveau') as string;
  if (!['facile', 'moyen', 'dur'].includes(niveau)) return;

  await supabase
    .from('defi_participations')
    .upsert({ defi_id: defiId, eleve_id: user.id, niveau }, { onConflict: 'defi_id,eleve_id' });

  revalidatePath('/defi');
}
