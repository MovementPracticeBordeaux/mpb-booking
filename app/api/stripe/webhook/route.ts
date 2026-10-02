import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { envoyerEmail } from '@/lib/resend';
import { alerterAdmin, alerterAdminPush } from '@/lib/alerte-admin';
import { imputerSeancesARegler } from '@/lib/seances-a-regler';
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
    const evenementId = session.metadata?.evenement_id;
    const reglementPaiementId = session.metadata?.reglement_paiement_id;

    // Règlement en ligne d'une formule déjà attribuée "à régler" : on solde
    // simplement ce règlement, aucun abonnement créé ni prolongé.
    if (reglementPaiementId) {
      const montant = (session.amount_total ?? 0) / 100;
      const { data: regle } = await admin
        .from('paiements')
        .update({ paye: true, montant, moyen_paiement: 'carte', stripe_session_id: session.id, created_at: new Date().toISOString() })
        .eq('id', reglementPaiementId)
        .eq('moyen_paiement', 'a_regler')
        .select('abonnement_id, formule_nom, eleve_id')
        .maybeSingle();
      if (regle) {
        if (regle.abonnement_id) await admin.from('abonnements').update({ paye: true }).eq('id', regle.abonnement_id);
        const { data: profil } = await admin.from('profiles').select('nom, email').eq('id', regle.eleve_id).maybeSingle();
        await alerterAdminPush('💰 Règlement reçu', `${profil?.nom ?? profil?.email ?? 'Un élève'} — ${FORMULES[regle.formule_nom]?.nom ?? regle.formule_nom} (${montant.toFixed(2)} €, en ligne)`, '/admin/eleves');
      }
      return NextResponse.json({ received: true });
    }

    // Paiement d'un événement ponctuel (atelier, stage...) : logique
    // séparée des formules classiques, pas de compte élève requis.
    if (evenementId) {
      const { data: dejaTraite } = await admin
        .from('evenement_reservations')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (dejaTraite) {
        return NextResponse.json({ received: true, deja_traite: true });
      }

      const { data: evenement } = await admin.from('evenements').select('*').eq('id', evenementId).maybeSingle();
      const email = session.customer_details?.email ?? session.customer_email;
      const nom = session.customer_details?.name ?? null;
      const montant = (session.amount_total ?? 0) / 100;
      const tarifAbonne = session.metadata?.tarif_abonne === 'oui';

      if (evenement && email) {
        const { error: erreurInsert } = await admin.from('evenement_reservations').insert({
          evenement_id: evenementId,
          email,
          nom,
          montant,
          stripe_session_id: session.id,
        });

        // Code 23505 = un autre appel du webhook a déjà inséré la ligne
        // entre-temps (sécurité anti-doublon), pas une vraie erreur.
        if (erreurInsert && erreurInsert.code !== '23505') {
          console.error('Erreur insertion réservation événement:', erreurInsert.message);
        }

        if (!erreurInsert) {
          try {
            await envoyerEmail(
              email,
              `Confirmation de ta réservation : ${evenement.titre}`,
              `<p>Merci pour ta réservation !</p>
               <p>Ta place pour <strong>${evenement.titre}</strong> est confirmée.</p>
               <p>📅 ${new Date(evenement.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
               de ${new Date(evenement.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
               à ${new Date(evenement.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
               <p>📍 ${evenement.lieu}</p>
               <p>Montant réglé : ${montant.toFixed(2)} €${tarifAbonne ? ' (tarif abonné -50%)' : ''}.</p>
               <p>Une question avant l'événement ? <a href="https://wa.me/33620477064">Contacte Sylvain sur WhatsApp</a>.</p>`
            );
          } catch {
            // Non bloquant : la réservation est déjà enregistrée, un email
            // qui ne part pas ne doit pas faire échouer le webhook.
          }

          await alerterAdmin(
            'Nouvelle réservation événement',
            `${nom ?? email} vient de réserver une place pour "${evenement.titre}" (${montant.toFixed(2)} €${tarifAbonne ? ', tarif abonné' : ''}).`
          );
          await alerterAdminPush(
            '💰 Nouvel achat',
            `${nom ?? email} — ${evenement.titre} (${montant.toFixed(2)} €)`,
            '/admin/evenements'
          );
        }
      } else {
        await alerterAdmin(
          'Paiement événement non crédité automatiquement',
          `Un paiement (session ${session.id}, ${montant.toFixed(2)} €) a été reçu pour un événement, ` +
          `mais n'a pas pu être enregistré : ${!evenement ? 'événement introuvable' : "email de l'acheteur manquant"}. ` +
          `Vérifie la session dans le dashboard Stripe.`
        );
      }

      return NextResponse.json({ received: true });
    }

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
      let dateFinAffichee = expiration;

      // Renouvellement de la MÊME formule alors qu'elle est encore active
      // (bouton "Renouveler" du profil, ou rachat depuis /tarifs) : on
      // prolonge l'abonnement existant au lieu de le remplacer. Avant, il
      // était désactivé net et l'élève perdait les séances et les jours
      // qu'il lui restait. Les séances s'additionnent, et la nouvelle
      // période démarre à la fin de l'actuelle (ou aujourd'hui si déjà
      // passée). Un pass gelé n'est pas prolongé automatiquement.
      const { data: aboActuel } = await admin
        .from('abonnements')
        .select('id, formule_nom, quota_restant, date_expiration, gele')
        .eq('eleve_id', userId)
        .eq('categorie', formule.categorie)
        .eq('abonnement_actif', true)
        .maybeSingle();

      if (aboActuel && aboActuel.formule_nom === formuleNom && !aboActuel.gele) {
        const aujourdhuiISO = new Date().toISOString().slice(0, 10);
        // Choix de l'élève au renouvellement : "aujourd'hui" (nouvelle
        // période qui démarre tout de suite) ou "à la suite" (par défaut).
        const departAujourdhui = session.metadata?.depart === 'aujourdhui' && formule.quota != null;
        const pointDeDepart = !departAujourdhui && aboActuel.date_expiration && aboActuel.date_expiration > aujourdhuiISO
          ? new Date(aboActuel.date_expiration + 'T00:00:00')
          : new Date();
        const nouvelleExpiration = new Date(pointDeDepart);
        nouvelleExpiration.setMonth(nouvelleExpiration.getMonth() + formule.validiteMois);
        const quotaRestant = formule.quota != null ? (aboActuel.quota_restant ?? 0) + formule.quota : null;
        await admin.from('abonnements').update({
          quota_restant: quotaRestant,
          quota_total: quotaRestant,
          date_expiration: nouvelleExpiration.toISOString().slice(0, 10),
        }).eq('id', aboActuel.id);
        dateFinAffichee = nouvelleExpiration;
      } else {
        // Formule différente : un seul abonnement ACTIF par catégorie
        // (planning / coaching / mentorat), l'ancien est désactivé.
        await admin.from('abonnements')
          .update({ abonnement_actif: false })
          .eq('eleve_id', userId)
          .eq('categorie', formule.categorie)
          .eq('abonnement_actif', true);

        await admin.from('abonnements').insert({
          eleve_id: userId,
          categorie: formule.categorie,
          formule_nom: formuleNom,
          quota_total: formule.quota,
          quota_restant: formule.quota,
          date_debut_formule: dateDebut.toISOString().slice(0, 10),
          date_expiration: expiration.toISOString().slice(0, 10),
          abonnement_actif: true,
          origine: 'stripe',
          paye: true,
        });
      }
      // Séances suivies sans formule : déduites de la formule achetée.
      if (formule.categorie === 'planning') await imputerSeancesARegler(userId);
      await admin.from('profiles').update({ stripe_customer_id: session.customer as string }).eq('id', userId);

      // Historise le paiement pour que l'élève puisse générer sa facture.
      // stripe_session_id a une contrainte unique en base (voir
      // supabase/migration_idempotence_webhook.sql) : si malgré la
      // vérification ci-dessus deux webhooks arrivaient en même temps, cet
      // insert échouerait proprement au lieu de dupliquer la ligne.
      const { error: erreurInsert } = await admin.from('paiements').insert({
        eleve_id: userId,
        formule_nom: formuleNom,
        montant: (session.amount_total ?? 0) / 100, // Stripe donne le montant en centimes
        moyen_paiement: 'carte',
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
               valable jusqu'au ${dateFinAffichee.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}.</p>
               <p>Montant réglé : ${((session.amount_total ?? 0) / 100).toFixed(2)} €.</p>
               ${formule.categorie === 'coaching'
                 ? '<p>Sylvain va te contacter pour caler ton créneau.</p>'
                 : '<p>Tu peux dès maintenant réserver tes cours depuis le planning.</p>'}
               ${formuleNom === 'cours_decouverte'
                 ? `<p>👋 C'est ta première séance avec nous ? On te recommande de contacter Sylvain avant
                    de venir, pour avoir les infos pratiques (lieu exact, ce qu'il faut prévoir/apporter) :
                    <a href="https://wa.me/33620477064">le contacter sur WhatsApp</a>.</p>`
                 : ''}
               <p>Tu retrouveras cette facture à tout moment dans ton espace personnel.</p>`
            );
          }
        } catch {
          // Email de confirmation non critique : le paiement et l'accès
          // sont déjà enregistrés à ce stade, on ne fait pas échouer le
          // webhook pour un email qui ne part pas.
        }

        // Notification push admin à chaque achat, quel qu'il soit — pour
        // être au courant en temps réel, sans avoir à consulter l'admin.
        const emailAcheteur = session.customer_details?.email ?? session.customer_email ?? 'inconnu';
        await alerterAdminPush(
          '💰 Nouvel achat',
          `${emailAcheteur} — ${formule.nom} (${((session.amount_total ?? 0) / 100).toFixed(2)} €)`,
          '/admin/eleves'
        );
      }
    } else {
      // userId ou formule manquant/invalide (clé de formule renommée,
      // metadata corrompue...) : sans cette alerte, un vrai paiement
      // pourrait arriver sans jamais être crédité à l'élève, en silence
      // total. On prévient Sylvain pour qu'il puisse corriger la formule
      // manuellement depuis /admin/eleves en attendant.
      await alerterAdmin(
        'Paiement Stripe non crédité automatiquement',
        `Un paiement (session ${session.id}, ${((session.amount_total ?? 0) / 100).toFixed(2)} €) a été reçu ` +
        `mais n'a pas pu être crédité automatiquement : ${!userId ? "user_id manquant" : ''}` +
        `${!userId && !formule ? ' et ' : ''}${!formule ? `formule "${formuleNom}" introuvable dans le catalogue` : ''}. ` +
        `Vérifie la session dans le dashboard Stripe et attribue la formule manuellement depuis /admin/eleves si besoin.`
      );
    }
  }

  return NextResponse.json({ received: true });
}
