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
  { href: '/planning', label: 'Planning' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/coaching', label: 'Coaching' },
  { href: '/contact', label: 'Contact' },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let estAdmin = false;
  if (user) {
    const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    estAdmin = profil?.role === 'admin';
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
        <ChatWidget />
        <PwaRegister />
      </body>
    </html>
  );
}
