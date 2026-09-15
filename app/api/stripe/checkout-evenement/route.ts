import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase-server';

// Contrairement aux formules classiques, la réservation d'un événement ne
// nécessite PAS d'être connecté — n'importe quel visiteur peut payer un
// atelier ponctuel sans jamais avoir de compte sur le site. Stripe
// Checkout collecte lui-même l'email de l'acheteur.
//
// Si la personne EST connectée et a un abonnement actif (hors cours
// découverte), elle a droit à -50% sur le tarif public — ce contrôle est
// refait ici, côté serveur, à partir de la session réelle : jamais à
// partir d'un prix envoyé par le client, qui pourrait être falsifié.
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

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let estAbonne = false;
  if (user) {
    const { count } = await admin
      .from('abonnements')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', user.id)
      .eq('abonnement_actif', true)
      .neq('formule_nom', 'cours_decouverte');
    estAbonne = (count ?? 0) > 0;
  }

  try {
    const ligneArticle = estAbonne
      ? {
          quantity: 1,
          price_data: {
            currency: 'eur',
            product_data: { name: `${evenement.titre} — tarif abonné (-50%)` },
            // Arrondi au centime pour éviter tout souci de virgule flottante
            // (ex. 49 / 2 = 24.5 -> 2450 centimes, toujours un entier ici,
            // mais le Math.round reste une sécurité si le prix a des centimes).
            unit_amount: Math.round((evenement.prix / 2) * 100),
          },
        }
      : { price: evenement.stripe_price_id, quantity: 1 };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [ligneArticle],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/evenements/${evenement.id}?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/evenements/${evenement.id}?paiement=annule`,
      metadata: { evenement_id: evenement.id, tarif_abonne: estAbonne ? 'oui' : 'non' },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe inconnue' }, { status: 500 });
  }
}
