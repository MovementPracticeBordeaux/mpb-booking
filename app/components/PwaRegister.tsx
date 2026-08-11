'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Échec silencieux : l'enregistrement du service worker n'est pas
        // critique, le site doit continuer à fonctionner normalement même
        // si ça échoue (navigateur trop ancien, etc.).
      });
    }
  }, []);

  return null;
}
