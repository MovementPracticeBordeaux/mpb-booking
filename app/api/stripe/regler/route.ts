import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { PRICE_IDS } from '@/lib/prix-stripe';

// Règlement en ligne d'une formule DÉJÀ attribuée par Sylvain "à régler" :
// le paiement solde ce règlement, sans créer ni prolonger d'abonnement.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Connecte-toi pour régler.' }, { status: 401 });

  const { paiement_id } = await req.json().catch(() => ({}));
  const admin = supabaseAdmin();
  const { data: paiement } = await admin
    .from('paiements')
    .select('id, formule_nom')
    .eq('id', paiement_id)
    .eq('eleve_id', user.id)
    .eq('moyen_paiement', 'a_regler')
    .maybeSingle();
  if (!paiement) return NextResponse.json({ error: 'Rien à régler.' }, { status: 404 });

  const priceId = PRICE_IDS[paiement.formule_nom];
  if (!priceId?.startsWith('price_')) {
    return NextResponse.json({ error: "Cette formule ne se règle pas en ligne : règle-la directement à Sylvain." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profil?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profil`,
      metadata: { reglement_paiement_id: paiement.id, user_id: user.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe' }, { status: 500 });
  }
}
