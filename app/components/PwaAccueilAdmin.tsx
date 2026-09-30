'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Quand Sylvain (admin) ouvre l'app installée sur son téléphone, il arrive
// directement sur son planning admin plutôt que sur le planning public.
// Détection côté appareil (mode "standalone" = lancée depuis l'icône), et
// une seule fois par lancement : il peut ensuite naviguer librement vers
// n'importe quelle page sans être renvoyé à l'admin. Fonctionne sans avoir
// à réinstaller l'icône (contrairement à une modification du manifest).
const CLE = 'mpb-pwa-accueil-admin-fait';

export default function PwaAccueilAdmin({ estAdmin }: { estAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!estAdmin) return;
    const estAppInstallee =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (!estAppInstallee) return;
    try {
      if (sessionStorage.getItem(CLE)) return;
      sessionStorage.setItem(CLE, '1');
    } catch {
      return;
    }
    if (!pathname.startsWith('/admin')) router.replace('/admin/planning');
    // Volontairement exécuté au premier affichage uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estAdmin]);

  return null;
}
