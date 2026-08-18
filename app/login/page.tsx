'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

// Traduit les messages d'erreur Supabase les plus courants en français
// compréhensible, plutôt que d'afficher le texte anglais brut.
function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit')) {
    return "Trop de demandes de connexion récentes pour cet email — attends quelques minutes avant de réessayer. Si ça persiste, contacte Sylvain.";
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Adresse email invalide.';
  }
  return message;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    // Le lien magique reçu par email a expiré, a déjà été utilisé, ou
    // l'échange de code a échoué pour une autre raison (voir
    // app/auth/callback/route.ts) — sans ce message, la personne se
    // retrouvait juste renvoyée ici sans aucune explication.
    if (searchParams.get('erreur') === 'connexion') {
      setErreur("Ce lien de connexion n'est plus valide (déjà utilisé, ou expiré). Redemande-en un ci-dessous.");
    }
  }, [searchParams]);

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErreur(traduireErreur(error.message));
    else setEnvoye(true);
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1>Connexion</h1>
      {envoye ? (
        <p>Un lien de connexion t'a été envoyé par email. Clique dessus pour te connecter.</p>
      ) : (
        <form onSubmit={envoyerLien}>
          <input
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10 }}>
            Recevoir mon lien de connexion
          </button>
          {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        </form>
      )}
    </main>
  );
}
