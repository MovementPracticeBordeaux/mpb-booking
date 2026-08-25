'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return "Ce code n'est plus valide (déjà utilisé, ou expiré). Redemande-en un nouveau.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState(false);
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

  // Alternative au clic sur le lien magique : indispensable en PWA iOS
  // (app ajoutée à l'écran d'accueil), où le lien reçu par email s'ouvre
  // toujours dans Safari — jamais dans la PWA, qui a un stockage de session
  // totalement séparé sur iOS. Saisir le code ici reste dans la PWA, donc
  // la session s'y enregistre correctement.
  async function validerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setVerification(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setVerification(false);
    if (error) setErreur(traduireErreur(error.message));
    else router.replace('/planning');
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1>Connexion</h1>
      {envoye ? (
        <>
          <p>Un email t'a été envoyé avec un code à 6 chiffres. Entre-le ci-dessous pour te connecter.</p>
          <form onSubmit={validerCode}>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 10, textAlign: 'center', fontSize: 20, letterSpacing: 4 }}
            />
            <button type="submit" disabled={verification} style={{ width: '100%', padding: 10 }}>
              {verification ? 'Vérification...' : 'Valider le code'}
            </button>
            {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
          </form>
        </>
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
