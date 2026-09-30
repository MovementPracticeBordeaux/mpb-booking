'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Messages de succès/erreur de l'admin, affichés en bulle flottante au lieu
// d'un bandeau en haut de page. Deux problèmes réglés ici :
// 1. Après une action, la page se rechargeait et remontait tout en haut :
//    la position de défilement est mémorisée à l'envoi du formulaire et
//    restaurée au retour.
// 2. Le message restait dans l'adresse : recharger la page le réaffichait.
//    Il est retiré de l'adresse dès qu'il a été lu.
const CLE_DEFILEMENT = 'mpb-admin-defilement';

export default function AdminRetours() {
  const [message, setMessage] = useState<{ texte: string; type: 'succes' | 'erreur' } | null>(null);
  // Le layout admin reste monté d'une page à l'autre : il faut réagir à
  // chaque changement d'adresse, pas seulement au premier affichage.
  const parametres = useSearchParams();
  const cleParametres = parametres?.toString() ?? '';

  useEffect(() => {
    const memoriserPosition = () => {
      try {
        sessionStorage.setItem(CLE_DEFILEMENT, JSON.stringify({ chemin: location.pathname, y: window.scrollY }));
      } catch {}
    };
    document.addEventListener('submit', memoriserPosition, true);
    return () => document.removeEventListener('submit', memoriserPosition, true);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const succes = url.searchParams.get('succes');
    const erreur = url.searchParams.get('erreur');

    try {
      const sauvegarde = sessionStorage.getItem(CLE_DEFILEMENT);
      if (sauvegarde) {
        const { chemin, y } = JSON.parse(sauvegarde);
        sessionStorage.removeItem(CLE_DEFILEMENT);
        if (chemin === url.pathname) {
          // Deux passes : le contenu (carrousel, listes) peut finir de
          // s'afficher juste après le premier rendu.
          requestAnimationFrame(() => window.scrollTo(0, y));
          setTimeout(() => window.scrollTo(0, y), 150);
        }
      }
    } catch {}

    if (!succes && !erreur) return;
    setMessage(erreur ? { texte: erreur, type: 'erreur' } : { texte: succes!, type: 'succes' });
    url.searchParams.delete('succes');
    url.searchParams.delete('erreur');
    window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : '') + url.hash);
  }, [cleParametres]);

  // Disparition automatique, gérée à part : le nettoyage de l'adresse
  // ci-dessus relance l'effet précédent et annulerait sinon le minuteur.
  useEffect(() => {
    if (!message) return;
    const minuteur = setTimeout(() => setMessage(null), message.type === 'erreur' ? 9000 : 4500);
    return () => clearTimeout(minuteur);
  }, [message]);

  if (!message) return null;
  return (
    <div role="status" className={`bulle-admin bulle-admin-${message.type}`} onClick={() => setMessage(null)}>
      {message.type === 'succes' ? '✅ ' : '⚠️ '}
      {message.texte}
    </div>
  );
}
