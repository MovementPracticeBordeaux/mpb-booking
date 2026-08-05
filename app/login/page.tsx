'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}` },
    });
    if (error) setErreur(error.message);
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
