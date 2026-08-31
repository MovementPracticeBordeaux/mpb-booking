import { supabaseServer } from '@/lib/supabase-server';
import { COULEURS, FONTS_IMPORT_URL, POLICE_CORPS } from '@/lib/theme';
import ChatWidget from './components/ChatWidget';
import NavBar from './components/NavBar';
import PwaRegister from './components/PwaRegister';

export const metadata = {
  metadataBase: new URL('https://www.movementpracticebordeaux.com'),
  title: 'Movement Practice Bordeaux — Calisthenics, Handstand, Locomotion & Mobilité',
  description: 'Coaching, cours et ateliers au poids de corps à Bordeaux : calisthenics, handstand, locomotion, mobilité.',
  keywords: ['calisthenics', 'handstand', 'locomotion', 'mobilité', 'Bordeaux', 'coaching sportif', 'mouvement'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MPB',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Movement Practice Bordeaux',
    description: 'Coaching, cours et ateliers au poids de corps à Bordeaux : calisthenics, handstand, locomotion, mobilité.',
    url: 'https://www.movementpracticebordeaux.com',
    siteName: 'Movement Practice Bordeaux',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Movement Practice Bordeaux' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movement Practice Bordeaux',
    description: 'Coaching, cours et ateliers au poids de corps à Bordeaux : calisthenics, handstand, locomotion, mobilité.',
    images: ['/og-image.jpg'],
  },
};

export const viewport = {
  themeColor: '#0b0b0d',
};

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/quiz', label: 'Quel cours ?' },
  { href: '/planning', label: 'Planning' },
  { href: '/defi', label: '🏆 Défi du mois' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/coaching', label: 'Coaching' },
  { href: '/mentorat', label: 'Mentorat' },
  { href: '/contact', label: 'Contact' },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();

  // Filet de sécurité important (même principe que sur middleware.ts après
  // l'incident du 504 MIDDLEWARE_INVOCATION_TIMEOUT) : tout ce bloc
  // s'exécute dans la mise en page racine, donc bloque l'affichage de
  // TOUTE page tant qu'il n'a pas fini. Sans timeout, un simple
  // ralentissement réseau ou base de données suffit à faire tourner le
  // site en boucle indéfiniment pour la personne connectée (site "qui ne
  // s'ouvre plus" signalé le 31/08/2026, corrige ce point précis).
  async function avecTimeout<T>(promesse: PromiseLike<T>, repli: T, ms = 4000): Promise<T> {
    try {
      return await Promise.race([
        Promise.resolve(promesse),
        new Promise<T>((resolve) => setTimeout(() => resolve(repli), ms)),
      ]);
    } catch {
      return repli;
    }
  }

  const { data: { user } } = await avecTimeout(supabase.auth.getUser(), { data: { user: null } } as any);
  let estAdmin = false;
  let aUneFormuleActive = false;

  if (user) {
    const { data: profil } = await avecTimeout(
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      { data: null } as any
    );
    estAdmin = profil?.role === 'admin';
    const { count } = await avecTimeout(
      supabase.from('abonnements').select('id', { count: 'exact', head: true }).eq('eleve_id', user.id).eq('abonnement_actif', true),
      { count: 0 } as any
    );
    aUneFormuleActive = (count ?? 0) > 0;
  }

  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href={FONTS_IMPORT_URL} />
      </head>
      <body style={{
        fontFamily: POLICE_CORPS, margin: 0, color: COULEURS.texte,
        backgroundColor: COULEURS.fond,
      }}>
        <div style={{
          position: 'fixed', inset: 0, zIndex: -1,
          backgroundImage: 'url(/texture-beton.jpg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '900px',
          filter: 'brightness(1.3) contrast(1.1)',
          opacity: 0.12,
          pointerEvents: 'none',
        }} />
        <NavBar liens={LIENS} estAdmin={estAdmin} userEmail={user?.email ?? null} />
        {children}
        <ChatWidget aUneFormuleActive={aUneFormuleActive} />
        <PwaRegister />
      </body>
    </html>
  );
}
