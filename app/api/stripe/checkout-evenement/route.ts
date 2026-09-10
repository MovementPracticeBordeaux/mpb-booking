import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';

// Contrairement aux formules classiques, la réservation d'un événement ne
// nécessite PAS d'être connecté — n'importe quel visiteur peut payer un
// atelier ponctuel sans jamais avoir de compte sur le site. Stripe
// Checkout collecte lui-même l'email de l'acheteur.
export async function POST(req: NextRequest) {
  const { evenement_id } = await req.json();
  if (!evenement_id) return NextResponse.json({ error: 'evenement_id manquant' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: evenement } = await admin
    .from('evenements')
    .select('*')
    .eq('id', evenement_id)
    .eq('actif', true)
    .maybeSingle();

  if (!evenement) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  if (!evenement.stripe_price_id) {
    return NextResponse.json({ error: "Cet événement n'a pas encore de prix configuré côté paiement." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: evenement.stripe_price_id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/evenements/${evenement.id}?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/evenements/${evenement.id}?paiement=annule`,
      metadata: { evenement_id: evenement.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe inconnue' }, { status: 500 });
  }
}
