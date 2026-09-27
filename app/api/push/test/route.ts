import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { envoyerPushAEleve } from '@/lib/push';

// Envoie une notification de test à tous les appareils de la personne
// connectée — pour vérifier soi-même, en un clic, que tout fonctionne.
export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: 'Non connecté.' }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, message: 'Clés de notification absentes côté serveur (Vercel).' }, { status: 500 });
  }
  const envoyes = await envoyerPushAEleve(user.id, '✅ Notifications actives', 'Tu recevras bien tes rappels ici.', '/profil');
  if (!envoyes) {
    return NextResponse.json({ ok: false, message: "Aucun appareil n'a pu être joint. Désactive puis réactive les notifications." });
  }
  return NextResponse.json({ ok: true, message: `Notification envoyée (${envoyes} appareil${envoyes > 1 ? 's' : ''}).` });
}
