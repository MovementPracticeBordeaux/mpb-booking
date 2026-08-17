'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PwaRegister() {
  const router = useRouter();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Échec silencieux : l'enregistrement du service worker n'est pas
        // critique, le site doit continuer à fonctionner normalement même
        // si ça échoue (navigateur trop ancien, etc.).
      });
    }

    // Une app installée en PWA sur iOS reste "gelée" (JS en pause) tant
    // qu'elle est en arrière-plan, et ne se rafraîchit jamais toute seule
    // en revenant au premier plan. Problème concret : un élève ouvre le
    // lien de connexion reçu par email (ce qui s'ouvre TOUJOURS dans
    // Safari sur iOS, jamais dans l'app installée — limitation d'Apple,
    // pas un bug ici), se connecte, puis revient sur l'icône de l'app :
    // sans ce correctif, elle affichait encore l'ancien écran "déconnecté"
    // figé, ce qui donnait l'impression que l'app était cassée et qu'il
    // fallait la réinstaller. On force donc un rafraîchissement des
    // données à chaque fois que l'app redevient visible.
    function surRetourAuPremierPlan() {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }
    document.addEventListener('visibilitychange', surRetourAuPremierPlan);
    // 'pageshow' avec persisted=true couvre le cas où iOS restaure la page
    // depuis son cache mémoire (bfcache) plutôt que de la recharger.
    function surPageshow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener('pageshow', surPageshow);

    return () => {
      document.removeEventListener('visibilitychange', surRetourAuPremierPlan);
      window.removeEventListener('pageshow', surPageshow);
    };
  }, [router]);

  return null;
}
