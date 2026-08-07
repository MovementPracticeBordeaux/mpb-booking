import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { envoyerEmail } from '@/lib/resend';
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
      // Idempotence : si ce paiement Stripe a déjà été traité (webhook
      // parfois notifié plusieurs fois pour le même événement), on ne le
      // retraite pas une deuxième fois.
      const { data: dejaTraite } = await admin
        .from('paiements')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (dejaTraite) {
        return NextResponse.json({ received: true, deja_traite: true });
      }

      // La date de début choisie par l'élève sur /tarifs sert de point de
      // départ pour la validité (au lieu de toujours partir du jour du
      // paiement) — utile pour démarrer un pass au retour de vacances, etc.
      const dateDebutMetadata = session.metadata?.date_debut;
      const dateDebut = dateDebutMetadata && /^\d{4}-\d{2}-\d{2}$/.test(dateDebutMetadata)
        ? new Date(dateDebutMetadata + 'T00:00:00')
        : new Date();

      const expiration = new Date(dateDebut);
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

      // Historise le paiement pour que l'élève puisse générer sa facture.
      // stripe_session_id a une contrainte unique en base (voir
      // supabase/migration_idempotence_webhook.sql) : si malgré la
      // vérification ci-dessus deux webhooks arrivaient en même temps, cet
      // insert échouerait proprement au lieu de dupliquer la ligne.
      const { error: erreurInsert } = await admin.from('paiements').insert({
        eleve_id: userId,
        formule_nom: formuleNom,
        montant: (session.amount_total ?? 0) / 100, // Stripe donne le montant en centimes
        origine: 'stripe',
        paye: true,
        stripe_session_id: session.id,
      });

      // Code 23505 = violation de contrainte unique : un autre appel du
      // webhook a inséré la ligne entre-temps, ce n'est pas une vraie
      // erreur, juste la sécurité anti-doublon qui a fonctionné.
      if (erreurInsert && erreurInsert.code !== '23505') {
        console.error('Erreur insertion paiement:', erreurInsert.message);
      }

      // Email de confirmation d'achat — seulement lors du tout premier
      // traitement réussi de ce paiement (pas en cas de doublon détecté
      // ci-dessus). Ne doit jamais faire échouer le webhook si Resend est
      // indisponible, d'où le try/catch silencieux.
      if (!erreurInsert) {
        try {
          const email = session.customer_details?.email ?? session.customer_email;
          if (email) {
            await envoyerEmail(
              email,
              `Confirmation de ton achat : ${formule.nom}`,
              `<p>Merci pour ton achat !</p>
               <p>Ta formule <strong>${formule.nom}</strong> est maintenant active
               ${formule.quota ? ` (${formule.quota} ${formule.unite}${formule.quota > 1 ? 's' : ''})` : ' (accès illimité)'},
               valable jusqu'au ${expiration.toLocaleDateString('fr-FR')}.</p>
               <p>Montant réglé : ${((session.amount_total ?? 0) / 100).toFixed(2)} €.</p>
               ${formule.categorie === 'coaching'
                 ? '<p>Sylvain va te contacter pour caler ton créneau.</p>'
                 : '<p>Tu peux dès maintenant réserver tes cours depuis le planning.</p>'}
               <p>Tu retrouveras cette facture à tout moment dans ton espace personnel.</p>`
            );
          }
        } catch {
          // Email de confirmation non critique : le paiement et l'accès
          // sont déjà enregistrés à ce stade, on ne fait pas échouer le
          // webhook pour un email qui ne part pas.
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
