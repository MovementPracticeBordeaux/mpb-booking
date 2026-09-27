import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';

// Appelée par le service worker (événement pushsubscriptionchange) quand le
// navigateur renouvelle de lui-même l'abonnement push de l'appareil — sans
// ça, l'ancien abonnement restait en base, le nouveau n'y était jamais, et
// l'appareil ne recevait plus rien sans que personne ne s'en rende compte.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { ancienEndpoint, abonnement } = await req.json().catch(() => ({}));
  if (!abonnement?.endpoint || !abonnement?.keys?.p256dh || !abonnement?.keys?.auth) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = supabaseAdmin();
  if (ancienEndpoint) {
    await admin.from('push_subscriptions').delete().eq('endpoint', ancienEndpoint).eq('eleve_id', user.id);
  }
  const { error } = await admin.from('push_subscriptions').upsert(
    { eleve_id: user.id, endpoint: abonnement.endpoint, p256dh: abonnement.keys.p256dh, auth: abonnement.keys.auth },
    { onConflict: 'endpoint' }
  );
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
