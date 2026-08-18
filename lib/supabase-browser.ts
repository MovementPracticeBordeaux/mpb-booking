import { createBrowserClient } from '@supabase/ssr';

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Le flux PKCE (par défaut) exige que le lien magique soit cliqué
        // dans le MÊME navigateur que celui qui a fait la demande de
        // connexion (un secret temporaire y est stocké, sans lui
        // l'échange échoue). Or cliquer un lien reçu par email ouvre
        // presque toujours un navigateur différent (celui par défaut du
        // téléphone), donc ça échouait systématiquement, dès le premier
        // clic. Le flux 'implicit' inclut directement les informations de
        // connexion dans le lien lui-même : ça marche depuis n'importe
        // quel navigateur/appareil, sans rien à faire correspondre.
        flowType: 'implicit',
      },
    }
  );
}
