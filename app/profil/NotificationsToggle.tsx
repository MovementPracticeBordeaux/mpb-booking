'use client';

import { useEffect, useState } from 'react';
import { enregistrerAbonnementPush, supprimerAbonnementPush, definirPreferencesNotif } from './push-actions';

// Convertit la clé publique VAPID (base64 url-safe) au format attendu par
// pushManager.subscribe (obligatoire, c'est le format standard de l'API).
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const brut = window.atob(base64);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

type Etat = 'verification' | 'non-supporte' | 'ios-a-installer' | 'refuse' | 'inactif' | 'actif' | 'en-cours';

// Sur iPhone/iPad, Apple n'autorise les notifications web QUE depuis le site
// ajouté à l'écran d'accueil et ouvert depuis son icône — jamais depuis un
// onglet Safari classique (où l'API n'existe tout simplement pas).
function estAppareilApple() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function estAppInstallee() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

// Compare la clé VAPID avec laquelle l'abonnement existant a été créé à la
// clé actuelle : si elles diffèrent (clés régénérées), l'abonnement ne
// recevra plus jamais rien et doit être recréé.
function memeCle(abonnement: PushSubscription, cle: string) {
  const existante = abonnement.options?.applicationServerKey;
  if (!existante) return true; // navigateur qui ne l'expose pas : on ne peut pas vérifier
  const a = new Uint8Array(existante as ArrayBuffer);
  const b = urlBase64ToUint8Array(cle);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function NotificationsToggle({
  preferencesInitiales,
}: {
  preferencesInitiales: { rappel: boolean; confirmation: boolean };
}) {
  const [etat, setEtat] = useState<Etat>('verification');
  const [erreur, setErreur] = useState<string | null>(null);
  const [prefRappel, setPrefRappel] = useState(preferencesInitiales.rappel);
  const [prefConfirmation, setPrefConfirmation] = useState(preferencesInitiales.confirmation);

  const [messageTest, setMessageTest] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEtat(estAppareilApple() && !estAppInstallee() ? 'ios-a-installer' : 'non-supporte');
        return;
      }
      if (Notification.permission === 'denied') {
        setEtat('refuse');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        let abonnementExistant = await registration.pushManager.getSubscription();
        const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (abonnementExistant && cle && Notification.permission === 'granted') {
          // Abonnement créé avec d'anciennes clés : on le recrée.
          if (!memeCle(abonnementExistant, cle)) {
            await abonnementExistant.unsubscribe();
            abonnementExistant = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(cle),
            });
          }
          // Resynchronise systématiquement l'appareil avec le serveur : si la
          // ligne en base avait été supprimée (abonnement déclaré expiré,
          // changement de compte sur le même téléphone...), le bouton
          // affichait "actif" alors que plus rien n'était envoyé.
          await enregistrerAbonnementPush(abonnementExistant.toJSON() as any);
        }
        setEtat(abonnementExistant ? 'actif' : 'inactif');
      } catch {
        setEtat('inactif');
      }
    })();
  }, []);

  async function envoyerTest() {
    setMessageTest('Envoi...');
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const donnees = await res.json();
      setMessageTest(donnees.message ?? (donnees.ok ? 'Envoyée.' : 'Échec.'));
    } catch {
      setMessageTest('Échec de l\'envoi, vérifie ta connexion.');
    }
  }

  async function activer() {
    setErreur(null);
    setEtat('en-cours');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setEtat(permission === 'denied' ? 'refuse' : 'inactif');
        return;
      }
      const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!cle) {
        setErreur("Les notifications ne sont pas encore configurées côté serveur.");
        setEtat('inactif');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cle),
      });
      const resultat = await enregistrerAbonnementPush(abonnement.toJSON() as any);
      if (!resultat.ok) throw new Error(resultat.erreur);
      setEtat('actif');
    } catch (e: any) {
      setErreur(e?.message ?? 'Impossible d\'activer les notifications.');
      setEtat('inactif');
    }
  }

  async function desactiver() {
    setErreur(null);
    setEtat('en-cours');
    try {
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.getSubscription();
      if (abonnement) {
        await supprimerAbonnementPush(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat('inactif');
    } catch (e: any) {
      setErreur(e?.message ?? 'Impossible de désactiver les notifications.');
      setEtat('actif');
    }
  }

  async function basculerPreference(type: 'rappel' | 'confirmation', valeur: boolean) {
    if (type === 'rappel') setPrefRappel(valeur); else setPrefConfirmation(valeur);
    const resultat = await definirPreferencesNotif(type === 'rappel' ? { pushRappel: valeur } : { pushConfirmation: valeur });
    if (!resultat.ok) {
      // On annule le changement visuel si l'enregistrement échoue.
      if (type === 'rappel') setPrefRappel(!valeur); else setPrefConfirmation(!valeur);
      setErreur(resultat.erreur ?? 'Impossible d\'enregistrer cette préférence.');
    }
  }

  if (etat === 'verification') return null;

  if (etat === 'ios-a-installer') {
    return (
      <div style={{ fontSize: 13, opacity: 0.85, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
        <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Sur iPhone, les notifications passent par l'app :</p>
        <p style={{ margin: 0 }}>
          1. Dans Safari, appuie sur le bouton Partager (carré avec une flèche)<br />
          2. Choisis « Sur l'écran d'accueil »<br />
          3. Ouvre le site depuis cette nouvelle icône, reviens ici et active les notifications
        </p>
      </div>
    );
  }

  if (etat === 'non-supporte') {
    return <p style={{ fontSize: 12, opacity: 0.5 }}>Notifications non disponibles sur ce navigateur.</p>;
  }

  if (etat === 'refuse') {
    return (
      <p style={{ fontSize: 12, opacity: 0.6 }}>
        Notifications bloquées — active-les dans les réglages de ton navigateur/téléphone pour ce site si tu changes d'avis.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={etat === 'actif' ? desactiver : activer}
        disabled={etat === 'en-cours'}
        style={{
          padding: '10px 16px', borderRadius: 6, border: '1px solid #f0a', cursor: 'pointer',
          background: etat === 'actif' ? 'transparent' : '#f0a',
          color: etat === 'actif' ? '#f0a' : 'white',
        }}
      >
        {etat === 'en-cours' ? '...' : etat === 'actif' ? '🔔 Désactiver les notifications' : '🔕 Activer les notifications'}
      </button>
      {erreur && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{erreur}</p>}

      {etat === 'actif' && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={envoyerTest}
            style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 6, border: '1px solid #555', background: 'none', color: 'inherit', fontSize: 13, cursor: 'pointer' }}
          >
            Envoyer une notification de test
          </button>
          {messageTest && <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{messageTest}</p>}
          <p style={{ fontSize: 12, opacity: 0.6, margin: '6px 0 0' }}>Choisis ce que tu veux recevoir :</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefRappel}
              onChange={(e) => basculerPreference('rappel', e.target.checked)}
            />
            Rappels de cours (la veille)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefConfirmation}
              onChange={(e) => basculerPreference('confirmation', e.target.checked)}
            />
            Confirmations de réservation
          </label>
        </div>
      )}
    </div>
  );
}
