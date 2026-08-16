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
export async function envoyerPushAEleve(eleveId: string, titre: string, corps: string, url?: string) {
  configure();
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const admin = supabaseAdmin();
  const { data: abonnements } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('eleve_id', eleveId);

  for (const abo of abonnements ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
        JSON.stringify({ titre, corps, url: url ?? '/planning' })
      );
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', abo.id);
      }
      // Autres erreurs (réseau, etc.) : on ignore silencieusement pour un
      // élève, ça ne doit pas casser l'envoi aux autres.
    }
  }
}
