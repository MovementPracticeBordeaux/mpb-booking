import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { PRICE_IDS } from '@/lib/prix-stripe';
import { aujourdhuiParis } from '@/lib/dates-paris';

// Attend un body JSON: { price_id, formule_nom, date_debut }
// Le quota et la durée de validité sont dérivés du catalogue FORMULES côté
// serveur (jamais du client), pour rester fiable. Tout est en achat unique
// (mode 'payment'), aucune formule n'est un abonnement récurrent Stripe.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { formule_nom, date_debut, retour, depart } = await req.json();
  const formule = FORMULES[formule_nom];
  if (!formule || formule.retiree) return NextResponse.json({ error: 'Formule inconnue' }, { status: 400 });
  // Le prix est TOUJOURS déduit de la formule côté serveur, jamais pris tel
  // quel depuis le navigateur : sinon on pouvait payer le prix d'une petite
  // formule en obtenant une formule plus chère.
  const price_id = PRICE_IDS[formule_nom];
  if (!price_id || !price_id.startsWith('price_')) {
    return NextResponse.json({ error: "Cette formule n'est pas disponible au paiement en ligne." }, { status: 400 });
  }

  // Formules à conditions, vérifiées ici car l'API reste appelable en
  // direct, même pour une formule qui n'est pas affichée sur le site.
  const admin = supabaseAdmin();
  // Numéro de téléphone obligatoire pour acheter.
  const { data: profil } = await admin.from('profiles').select('telephone').eq('id', user.id).maybeSingle();
  if (!profil?.telephone) {
    return NextResponse.json({ error: 'Renseigne ton numéro de téléphone (sur ton profil) avant d’acheter une formule.' }, { status: 400 });
  }
  if (formule_nom === 'cours_decouverte') {
    // Réservé aux personnes qui n'ont encore jamais eu de formule collective,
    // ni sur ce compte, ni sur un autre compte avec le même numéro.
    const { data: memeNumero } = await admin.from('profiles').select('id').eq('telephone', profil.telephone);
    const ids = (memeNumero ?? []).map((p) => p.id);
    if (!ids.includes(user.id)) ids.push(user.id);
    const { count } = await admin.from('abonnements').select('id', { count: 'exact', head: true })
      .in('eleve_id', ids).eq('categorie', 'planning');
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Le cours découverte est réservé à une première venue : choisis le cours à l’unité ou une formule.' }, { status: 400 });
    }
  }
  if (formule.categorie === 'mentorat') {
    // Le Mentorat se fait sur candidature : seuls un candidat accepté (même
    // adresse email que sa candidature) ou un élève qui a déjà eu le Mentorat
    // (renouvellement) peuvent payer en ligne.
    const { count } = await admin.from('abonnements').select('id', { count: 'exact', head: true })
      .eq('eleve_id', user.id).eq('categorie', 'mentorat');
    const { count: acceptees } = user.email
      ? await admin.from('mentorat_candidatures').select('id', { count: 'exact', head: true })
        .ilike('email', user.email.replace(/[\\%_]/g, (c) => `\\${c}`)).eq('statut', 'acceptee')
      : { count: 0 };
    if ((count ?? 0) === 0 && (acceptees ?? 0) === 0) {
      return NextResponse.json({ error: 'Le Mentorat se fait sur candidature.' }, { status: 403 });
    }
  }

  // Validation stricte de la date de début choisie par l'élève : format
  // YYYY-MM-DD et pas dans le passé. Si absente ou invalide, on retombe sur
  // aujourd'hui plutôt que de faire échouer l'achat pour ce détail.
  const aujourdhui = aujourdhuiParis();
  const dateDebutValide = typeof date_debut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date_debut) && date_debut >= aujourdhui
    ? date_debut
    : aujourdhui;

  // Mentorat : paiement en plusieurs fois possible avec Klarna (Sylvain est
  // payé en entier d'avance, Klarna porte le risque d'impayé). Si Klarna
  // n'est pas encore activé sur le compte Stripe, on retombe sur la carte.
  const creerSession = (moyens: ('card' | 'klarna')[]) => stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: moyens,
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: retour === 'profil'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/profil?paiement=succes`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/?paiement=succes`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tarifs?paiement=annule`,
      metadata: { user_id: user.id, formule_nom, date_debut: dateDebutValide, depart: depart === 'aujourdhui' ? 'aujourdhui' : 'suite' },
    });
  try {
    let session;
    if (formule.categorie === 'mentorat') {
      try {
        session = await creerSession(['card', 'klarna']);
      } catch {
        session = await creerSession(['card']);
      }
    } else {
      session = await creerSession(['card']);
    }
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur Stripe inconnue' }, { status: 500 });
  }
}
