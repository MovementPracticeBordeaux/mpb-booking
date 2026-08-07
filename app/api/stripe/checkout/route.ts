import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';

// Attend un body JSON: { price_id, formule_nom, date_debut }
// Le quota et la durée de validité sont dérivés du catalogue FORMULES côté
// serveur (jamais du client), pour rester fiable. Tout est en achat unique
// (mode 'payment'), aucune formule n'est un abonnement récurrent Stripe.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { price_id, formule_nom, date_debut } = await req.json();
  const formule = FORMULES[formule_nom];
  if (!formule) return NextResponse.json({ error: 'Formule inconnue' }, { status: 400 });

  // Validation stricte de la date de début choisie par l'élève : format
  // YYYY-MM-DD et pas dans le passé. Si absente ou invalide, on retombe sur
  // aujourd'hui plutôt que de faire échouer l'achat pour ce détail.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const dateDebutValide = typeof date_debut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date_debut) && date_debut >= aujourdhui
    ? date_debut
    : aujourdhui;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tarifs?paiement=annule`,
      metadata: { user_id: user.id, formule_nom, date_debut: dateDebutValide },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe inconnue' }, { status: 500 });
  }
}
