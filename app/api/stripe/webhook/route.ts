import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Signature invalide: ${err.message}` }, { status: 400 });
  }

  const admin = supabaseAdmin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const formuleNom = session.metadata?.formule_nom;
    const formule = formuleNom ? FORMULES[formuleNom] : null;

    if (userId && formule) {
      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + formule.validiteMois);

      await admin.from('profiles').update({
        formule_nom: formuleNom,
        quota_total: formule.quota,
        quota_restant: formule.quota,
        date_expiration: expiration.toISOString().slice(0, 10),
        abonnement_actif: true,
        origine: 'stripe',
        paye: true,
        stripe_customer_id: session.customer as string,
      }).eq('id', userId);

      // Historise le paiement pour que l'élève puisse générer sa facture
      await admin.from('paiements').insert({
        eleve_id: userId,
        formule_nom: formuleNom,
        montant: (session.amount_total ?? 0) / 100, // Stripe donne le montant en centimes
        origine: 'stripe',
        paye: true,
        stripe_session_id: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
