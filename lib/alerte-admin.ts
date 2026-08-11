import { envoyerEmail } from '@/lib/resend';

// Prévient Sylvain par email en cas de souci technique qui nécessite son
// attention (variable ADMIN_ALERT_EMAIL à définir dans Vercel > Settings >
// Environment Variables). Ne fait rien si la variable n'est pas définie, et
// échoue toujours silencieusement (une alerte qui plante ne doit jamais
// faire planter le code qui l'appelle).
export async function alerterAdmin(sujet: string, message: string) {
  const destinataire = process.env.ADMIN_ALERT_EMAIL;
  if (!destinataire) return;
  try {
    await envoyerEmail(destinataire, `⚠️ MPB — ${sujet}`, `<p>${message}</p>`);
  } catch {
    // Rien de plus à faire : si même l'alerte échoue, inutile de faire
    // échouer le code appelant pour ça.
  }
}
