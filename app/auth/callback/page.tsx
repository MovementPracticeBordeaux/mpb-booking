'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

// Avec le flux 'implicit' (voir lib/supabase-browser.ts), les informations
// de connexion arrivent directement dans le fragment de l'URL
// (#access_token=...), jamais visibles côté serveur — c'est pour ça que
// cette page doit être un composant client, et non une route serveur comme
// avant. Le simple fait d'instancier le client Supabase ici déclenche
// l'analyse automatique du fragment (detectSessionInUrl, activé par
// défaut) et l'écriture de la session dans les cookies.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/planning');
      } else {
        setErreur(true);
        setTimeout(() => router.replace('/login?erreur=connexion'), 1500);
      }
    });
  }, [router]);

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 20, textAlign: 'center' }}>
      <p>{erreur ? 'Connexion impossible, redirection...' : 'Connexion en cours...'}</p>
    </main>
  );
}
