'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { supabaseBrowser } from '@/lib/supabase-browser';

// Clé PUBLIQUE du widget Cloudflare Turnstile — sans risque en clair ici,
// seule la clé secrète (configurée dans Supabase Auth > Attack Protection)
// doit rester privée.
const TURNSTILE_SITE_KEY = '0x4AAAAAAEh03n9ZihBVb3MF';

// Si Turnstile n'a toujours pas produit de jeton après ce délai, on
// l'affiche clairement au lieu de laisser un bouton grisé sans explication.
const DELAI_ALERTE_TURNSTILE_MS = 8000;

// Mémorise l'étape "code envoyé" le temps de la session : sur iPhone,
// Safari décharge souvent l'onglet quand on bascule vers l'app Mail pour
// lire le code — sans ça, au retour, la page repartait de zéro (retour au
// champ email, nouvel envoi qui invalide le code précédent...).
const CLE_SESSION = 'mpb-login-en-cours';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return "Trop de demandes récentes pour cet email — attends une minute avant de réessayer. Si ça persiste, contacte Sylvain.";
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Adresse email invalide.';
  }
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return "Ce code n'est plus valide (déjà utilisé, expiré, ou un code plus récent a été demandé). Utilise le dernier code reçu, ou redemande-en un.";
  }
  if (m.includes('captcha')) {
    return 'La vérification anti-robot a échoué — recharge la page et réessaie.';
  }
  return message;
}

// Les claviers mobiles (iPhone surtout) ajoutent souvent un espace final
// après une suggestion d'adresse, ou une majuscule en début de champ.
function normaliserEmail(valeur: string) {
  return valeur.trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState(false);
  const [erreur, setErreur] = useState('');
  const conteneurTurnstile = useRef<HTMLDivElement>(null);
  const idWidgetTurnstile = useRef<string | undefined>(undefined);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileBloque, setTurnstileBloque] = useState(false);

  // Restaure l'étape "code envoyé" si l'onglet a été rechargé entre-temps.
  useEffect(() => {
    try {
      const sauvegarde = sessionStorage.getItem(CLE_SESSION);
      if (sauvegarde) {
        const { email: emailSauve, depuis } = JSON.parse(sauvegarde);
        // Un code Supabase expire au bout d'une heure : au-delà, inutile de
        // proposer de le saisir.
        if (emailSauve && Date.now() - depuis < 60 * 60 * 1000) {
          setEmail(emailSauve);
          setEnvoye(true);
        } else {
          sessionStorage.removeItem(CLE_SESSION);
        }
      }
    } catch {
      // sessionStorage indisponible (navigation privée ancienne) : sans gravité.
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('erreur') === 'connexion') {
      setErreur("Ce lien de connexion n'est plus valide (déjà utilisé, ou expiré). Redemande-en un ci-dessous.");
    }
  }, [searchParams]);

  const afficherTurnstile = useCallback(() => {
    if (!window.turnstile || !conteneurTurnstile.current) return;
    // Évite un double rendu dans le même conteneur (remontage du composant).
    if (idWidgetTurnstile.current) {
      try { window.turnstile.remove(idWidgetTurnstile.current); } catch {}
      idWidgetTurnstile.current = undefined;
    }
    idWidgetTurnstile.current = window.turnstile.render(conteneurTurnstile.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => { setTurnstileToken(token); setTurnstileBloque(false); },
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => { setTurnstileToken(''); setTurnstileBloque(true); },
    });
  }, []);

  // Le widget doit être (re)rendu à chaque fois que le formulaire email est
  // affiché : au premier chargement, mais aussi en revenant sur /login par
  // navigation interne, ou après "changer d'adresse" depuis l'écran du code.
  useEffect(() => {
    if (envoye) return;
    if (window.turnstile) afficherTurnstile();
    const minuteur = setTimeout(() => {
      setTurnstileBloque((dejaBloque) => dejaBloque || !idWidgetTurnstile.current);
    }, DELAI_ALERTE_TURNSTILE_MS);
    return () => clearTimeout(minuteur);
  }, [envoye, afficherTurnstile]);

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    const emailPropre = normaliserEmail(email);
    if (!turnstileToken) {
      setErreur(
        turnstileBloque
          ? "La vérification anti-robot ne se charge pas — voir le message ci-dessus."
          : 'Vérification anti-robot en cours, patiente une seconde et réessaie.'
      );
      return;
    }

    setEnvoiEnCours(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email: emailPropre,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, captchaToken: turnstileToken },
    });
    setEnvoiEnCours(false);
    // Jeton Turnstile à usage unique : en redemander un pour toute nouvelle tentative.
    if (idWidgetTurnstile.current) window.turnstile?.reset(idWidgetTurnstile.current);
    setTurnstileToken('');

    if (error) {
      setErreur(traduireErreur(error.message));
      return;
    }
    setEmail(emailPropre);
    setEnvoye(true);
    try {
      sessionStorage.setItem(CLE_SESSION, JSON.stringify({ email: emailPropre, depuis: Date.now() }));
    } catch {}
  }

  async function validerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setVerification(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email: normaliserEmail(email),
      token: code.replace(/\s/g, ''),
      type: 'email',
    });
    setVerification(false);
    if (error) {
      setErreur(traduireErreur(error.message));
      return;
    }
    try { sessionStorage.removeItem(CLE_SESSION); } catch {}
    router.replace('/planning');
  }

  function changerAdresse() {
    try { sessionStorage.removeItem(CLE_SESSION); } catch {}
    setEnvoye(false);
    setCode('');
    setErreur('');
  }

  const styleChamp: React.CSSProperties = { width: '100%', padding: 12, marginBottom: 10, fontSize: 16, boxSizing: 'border-box' };
  const styleBouton: React.CSSProperties = { width: '100%', padding: 12, minHeight: 44, fontSize: 16 };

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      {/* onReady (et non onLoad) : onLoad ne se déclenche qu'au tout premier
          chargement du script, jamais lors d'un retour sur la page par
          navigation interne — le widget n'apparaissait alors plus et le
          bouton restait grisé définitivement. */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={afficherTurnstile} />
      <h1>Connexion</h1>
      {envoye ? (
        <>
          <p>
            Un email avec un code de connexion a été envoyé à <strong>{email}</strong>. Entre-le ci-dessous.
          </p>
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Rien reçu après une minute ? Vérifie tes spams / courrier indésirable.
          </p>
          <form onSubmit={validerCode}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ ...styleChamp, textAlign: 'center', fontSize: 22, letterSpacing: 4 }}
            />
            <button type="submit" disabled={verification} style={styleBouton}>
              {verification ? 'Vérification...' : 'Valider le code'}
            </button>
            {erreur && <p style={{ color: '#ff8a8a' }}>{erreur}</p>}
          </form>
          <button
            type="button"
            onClick={changerAdresse}
            style={{ marginTop: 16, background: 'none', border: 'none', color: '#FF2D78', fontSize: 14, cursor: 'pointer', padding: 8 }}
          >
            ← Changer d'adresse ou renvoyer un code
          </button>
        </>
      ) : (
        <form onSubmit={envoyerCode}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styleChamp}
          />
          <div ref={conteneurTurnstile} style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', minHeight: 65 }} />
          {turnstileBloque && !turnstileToken && (
            <p style={{ fontSize: 13, color: '#ffb366', marginTop: 0 }}>
              La vérification anti-robot ne se charge pas. Ça vient souvent d'un bloqueur de contenu, du mode
              navigation privée ou du « Relais privé iCloud » sur iPhone. Recharge la page, ou essaie depuis Safari
              en navigation normale. Toujours bloqué ? Écris à Sylvain sur WhatsApp, il te réserve ta place.
            </p>
          )}
          <button type="submit" disabled={envoiEnCours} style={styleBouton}>
            {envoiEnCours ? 'Envoi...' : 'Recevoir mon code de connexion'}
          </button>
          {erreur && <p style={{ color: '#ff8a8a' }}>{erreur}</p>}
        </form>
      )}
    </main>
  );
}
