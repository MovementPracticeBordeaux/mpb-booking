import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';

// Attend un body JSON: { price_id, formule_nom }
// Le quota et la durée de validité sont dérivés du catalogue FORMULES côté
// serveur (jamais du client), pour rester fiable. Tout est en achat unique
// (mode 'payment'), aucune formule n'est un abonnement récurrent Stripe.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { price_id, formule_nom } = await req.json();
  const formule = FORMULES[formule_nom];
  if (!formule) return NextResponse.json({ error: 'Formule inconnue' }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tarifs?paiement=annule`,
      metadata: { user_id: user.id, formule_nom },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe inconnue' }, { status: 500 });
  }
}
