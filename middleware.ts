import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Sans ce middleware, la session expire au bout d'environ 1h et n'est
// jamais renouvelée automatiquement côté serveur : l'utilisateur reste
// "connecté" en apparence mais les vérifications (ex: rôle admin) échouent
// silencieusement. Ce fichier corrige ça en rafraîchissant le jeton sur
// chaque requête et en le réécrivant dans les cookies de la réponse.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Ce simple appel déclenche le rafraîchissement du jeton si besoin,
  // et le réécrit dans les cookies via les fonctions set() ci-dessus.
  //
  // Filet de sécurité important : si Supabase met du temps à répondre
  // (ralentissement passager, incident réseau...), on ne bloque JAMAIS le
  // site entier pour autant — après 4 secondes on laisse simplement passer
  // la requête sans rafraîchir la session cette fois-ci (l'utilisateur sera
  // juste redemandé de se reconnecter un peu plus tôt que d'habitude si sa
  // session était sur le point d'expirer, ce qui est un bien moindre mal
  // qu'un site indisponible pour tout le monde).
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
  } catch {
    // On continue quand même : mieux vaut servir la page sans session
    // fraîchement rafraîchie que de faire planter tout le site.
  }

  return response;
}

export const config = {
  // Exclut les fichiers statiques ET les routes /api (webhook Stripe, cron...)
  // qui ont leur propre authentification (signature Stripe, secret de cron)
  // et n'ont aucun besoin du rafraîchissement de session par cookies -
  // les y soumettre quand même ne fait qu'ajouter un risque inutile.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
