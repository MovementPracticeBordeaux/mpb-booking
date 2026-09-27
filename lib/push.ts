// Envoi de notifications push web (protocole standard, pas de service tiers
// comme Firebase — fonctionne nativement sur Android/desktop, et sur iOS à
// partir du moment où le site a été ajouté à l'écran d'accueil).
//
// Nécessite 3 variables d'environnement sur Vercel :
// - NEXT_PUBLIC_VAPID_PUBLIC_KEY (exposée au client, sert à s'abonner)
// - VAPID_PRIVATE_KEY (secrète, sert à signer les envois côté serveur)
// - VAPID_CONTACT_EMAIL (ex. 'mailto:contact@movementpracticebordeaux.com',
//   requis par la spec, sert de contact si un fournisseur nous bloque)
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-server';

let configure = () => {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL ?? 'mailto:contact@movementpracticebordeaux.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? ''
  );
  configure = () => {}; // ne configure qu'une fois
};

// Envoie une notification à TOUS les appareils abonnés d'un élève. Nettoie
// automatiquement les abonnements expirés/révoqués (status 404/410) pour ne
// pas les retenter indéfiniment.
//
// `type` permet de respecter les préférences granulaires de l'élève
// (colonnes notif_push_rappel / notif_push_confirmation sur profiles) — si
// omis, l'envoi n'est pas filtré (utile pour de futurs types ponctuels).
export async function envoyerPushAEleve(
  eleveId: string,
  titre: string,
  corps: string,
  url?: string,
  type?: 'rappel' | 'confirmation'
) {
  configure();
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const admin = supabaseAdmin();

  if (type) {
    const colonne = type === 'rappel' ? 'notif_push_rappel' : 'notif_push_confirmation';
    const { data: profil } = await admin.from('profiles').select(colonne).eq('id', eleveId).single();
    if (profil && (profil as any)[colonne] === false) return; // préférence désactivée par l'élève
  }

  const { data: abonnements } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('eleve_id', eleveId);

  let envoyes = 0;
  for (const abo of abonnements ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
        JSON.stringify({ titre, corps, url: url ?? '/planning' }),
        // urgency 'high' : sans ça, Android (Firebase) retarde les
        // notifications "normales" tant que le téléphone est en veille —
        // un rappel 1h30 avant un cours pouvait arriver après le cours.
        // TTL 6h : au-delà, un rappel de cours n'a plus de sens.
        { urgency: 'high', TTL: 6 * 3600 }
      );
      envoyes++;
    } catch (e: any) {
      const statut = e?.statusCode;
      // 404/410 : abonnement expiré ou révoqué. 403 : abonnement créé avec
      // d'autres clés VAPID, il ne fonctionnera plus jamais. Dans les 3
      // cas on le supprime ; l'appareil se réabonnera automatiquement à la
      // prochaine visite du site (voir NotificationsToggle).
      if (statut === 404 || statut === 410 || statut === 403) {
        await admin.from('push_subscriptions').delete().eq('id', abo.id);
      } else {
        console.error('Push : échec envoi', statut, e?.body ?? e?.message);
      }
    }
  }
  return envoyes;
}
