'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { supabaseBrowser } from '@/lib/supabase-browser';

// Clé PUBLIQUE du widget Cloudflare Turnstile (créé par Sylvain dans son
// dashboard Cloudflare) : sans risque de l'avoir en clair ici, seule la clé
// secrète associée doit rester privée (renseignée côté Supabase Auth, pas
// dans ce dépôt). Voir la note de configuration en bas de fichier.
const TURNSTILE_SITE_KEY = '0x4AAAAAAEh03n9ZihBVb3MF';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

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
  if (m.includes('captcha')) {
    return "Vérification anti-robot échouée — patiente une seconde et réessaie.";
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
  // Piège anti-bot : un champ invisible pour les humains (masqué en CSS),
  // que la plupart des bots remplissent quand même car ils remplissent
  // tout ce qu'ils trouvent. + une garde de temps : un envoi en moins de 2
  // secondes après l'affichage du formulaire est quasi toujours un bot
  // (aucun humain ne lit et remplit un champ email aussi vite). Combiné au
  // vrai CAPTCHA Turnstile ci-dessous pour une double protection.
  const [piege, setPiege] = useState('');
  const heureAffichage = useRef(Date.now());
  const conteneurTurnstile = useRef<HTMLDivElement>(null);
  const idWidgetTurnstile = useRef<string | undefined>(undefined);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstilePret, setTurnstilePret] = useState(false);

  useEffect(() => {
    heureAffichage.current = Date.now();
  }, []);

  useEffect(() => {
    // Le lien magique reçu par email a expiré, a déjà été utilisé, ou
    // l'échange de code a échoué pour une autre raison (voir
    // app/auth/callback/route.ts) — sans ce message, la personne se
    // retrouvait juste renvoyée ici sans aucune explication.
    if (searchParams.get('erreur') === 'connexion') {
      setErreur("Ce lien de connexion n'est plus valide (déjà utilisé, ou expiré). Redemande-en un ci-dessous.");
    }
  }, [searchParams]);

  function surChargementTurnstile() {
    if (!window.turnstile || !conteneurTurnstile.current) return;
    idWidgetTurnstile.current = window.turnstile.render(conteneurTurnstile.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    });
    setTurnstilePret(true);
  }

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');

    // Piège rempli = bot presque certain, on ne fait rien (mais on affiche
    // quand même "envoyé" pour ne pas révéler au bot que son inscription a
    // été bloquée, ce qui l'inciterait à s'adapter).
    if (piege) {
      setEnvoye(true);
      return;
    }
    // Formulaire soumis trop vite pour être humain.
    if (Date.now() - heureAffichage.current < 2000) {
      setEnvoye(true);
      return;
    }
    if (!turnstileToken) {
      setErreur('Vérification anti-robot en cours, patiente une seconde et réessaie.');
      return;
    }

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, captchaToken: turnstileToken },
    });
    // Un jeton Turnstile est à usage unique : qu'il ait fonctionné ou non,
    // il faut en redemander un pour toute nouvelle tentative.
    if (idWidgetTurnstile.current) window.turnstile?.reset(idWidgetTurnstile.current);
    setTurnstileToken('');
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
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={surChargementTurnstile} />
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
            type="text"
            name="site_web"
            value={piege}
            onChange={(e) => setPiege(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />
          <input
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <div ref={conteneurTurnstile} style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }} />
          <button type="submit" disabled={!turnstilePret} style={{ width: '100%', padding: 10 }}>
            Recevoir mon lien de connexion
          </button>
          {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        </form>
      )}
    </main>
  );
}

// --- Configuration restante côté Supabase (impossible à faire depuis ce
// dépôt : c'est un réglage du tableau de bord Supabase Auth, pas une
// donnée en base ni une variable d'environnement Vercel) ---
//
// Dans le dashboard Supabase du projet (aquvwqtwufdjlsjrqhux) :
// Authentication > Attack Protection > Enable Captcha protection
//   - Captcha provider : Cloudflare Turnstile
//   - Secret key : la clé secrète Turnstile générée par Sylvain (jamais
//     commitée ici par principe — un secret ne doit jamais vivre dans le
//     code source, seulement dans le dashboard qui en a besoin)
//
// Sans cette étape, le jeton Turnstile envoyé par ce formulaire est bien
// généré côté client, mais jamais vérifié côté serveur — la protection ne
// sera active qu'une fois ce réglage fait.

