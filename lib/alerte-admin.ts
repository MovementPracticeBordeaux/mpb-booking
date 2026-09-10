import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';
import { supabaseAdmin } from '@/lib/supabase-server';

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

// Prévient tous les admins par notification push (téléphone) — utilisé
// notamment pour signaler chaque nouvel achat (formule, événement...) en
// temps réel, sans attendre de consulter l'admin ou les emails. Échoue
// toujours silencieusement, même logique que alerterAdmin.
export async function alerterAdminPush(titre: string, corps: string, url = '/admin') {
  try {
    const admin = supabaseAdmin();
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    for (const a of admins ?? []) {
      try {
        await envoyerPushAEleve(a.id, titre, corps, url);
      } catch {
        // Un admin sans abonnement push valide ne doit pas bloquer les autres.
      }
    }
  } catch {
    // Non bloquant, même logique que alerterAdmin.
  }
}
