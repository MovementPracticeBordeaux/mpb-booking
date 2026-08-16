'use client';

import { useEffect, useState } from 'react';
import { enregistrerAbonnementPush, supprimerAbonnementPush } from './push-actions';

// Convertit la clé publique VAPID (base64 url-safe) au format attendu par
// pushManager.subscribe (obligatoire, c'est le format standard de l'API).
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const brut = window.atob(base64);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

type Etat = 'verification' | 'non-supporte' | 'refuse' | 'inactif' | 'actif' | 'en-cours';

export default function NotificationsToggle() {
  const [etat, setEtat] = useState<Etat>('verification');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEtat('non-supporte');
        return;
      }
      if (Notification.permission === 'denied') {
        setEtat('refuse');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const abonnementExistant = await registration.pushManager.getSubscription();
      setEtat(abonnementExistant ? 'actif' : 'inactif');
    })();
  }, []);

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

  if (etat === 'verification') return null;

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
    </div>
  );
}
