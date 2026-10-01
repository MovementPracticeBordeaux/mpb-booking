import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { COULEURS, FONTS_IMPORT_URL, POLICE_CORPS } from '@/lib/theme';
import ChatWidget from './components/ChatWidget';
import NavBar from './components/NavBar';
import PwaRegister from './components/PwaRegister';
import PwaAccueilAdmin from './components/PwaAccueilAdmin';
import TelephoneObligatoire from './components/TelephoneObligatoire';
import RappelReglement from './components/RappelReglement';
import { FORMULES } from '@/lib/formules';
import { PRICE_IDS } from '@/lib/prix-stripe';

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
  let telephoneManquant = false;
  let reglementsEnAttente: { paiementId: string; formule: string; prixEnLigne: number; enLigne: boolean }[] = [];

  if (user) {
    const { data: profil } = await avecTimeout(
      supabase.from('profiles').select('role, telephone').eq('id', user.id).single(),
      { data: null } as any
    );
    estAdmin = profil?.role === 'admin';
    // Profil bien chargé (pas un repli après délai dépassé) et sans numéro.
    telephoneManquant = !!profil && !estAdmin && !profil.telephone;
    const { count } = await avecTimeout(
      supabase.from('abonnements').select('id', { count: 'exact', head: true }).eq('eleve_id', user.id).eq('abonnement_actif', true),
      { count: 0 } as any
    );
    aUneFormuleActive = (count ?? 0) > 0;
    if (!estAdmin) {
      const { data: aRegler } = await avecTimeout(
        supabaseAdmin().from('paiements').select('id, formule_nom').eq('eleve_id', user.id).eq('moyen_paiement', 'a_regler'),
        { data: [] } as any
      );
      reglementsEnAttente = ((aRegler ?? []) as { id: string; formule_nom: string }[]).map((r) => ({
        paiementId: r.id,
        formule: FORMULES[r.formule_nom]?.nom ?? r.formule_nom,
        prixEnLigne: FORMULES[r.formule_nom]?.prixIndicatif ?? 0,
        enLigne: !!PRICE_IDS[r.formule_nom]?.startsWith('price_'),
      }));
    }
  }

  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href={FONTS_IMPORT_URL} />
        {/* Données structurées (schema.org) pour le référencement local —
            aide Google à afficher adresse/téléphone/horaires directement
            dans les résultats de recherche et sur Google Maps. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ExerciseGym',
              name: 'Movement Practice Bordeaux',
              description: 'Coaching, cours et ateliers au poids de corps à Bordeaux : calisthenics, handstand, locomotion, mobilité.',
              url: 'https://www.movementpracticebordeaux.com',
              telephone: '+33620477064',
              email: 'contact@movementpracticebordeaux.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '87 Quai des Queyries',
                addressLocality: 'Bordeaux',
                postalCode: '33100',
                addressCountry: 'FR',
              },
              areaServed: 'Bordeaux',
              openingHoursSpecification: [
                { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Wednesday', 'Friday'], opens: '09:00', closes: '21:00' },
              ],
              sameAs: [
                'https://www.instagram.com/movement_practice_bordeaux/',
                'https://www.youtube.com/@movementpracticebordeaux',
                'https://www.tiktok.com/@movementpracticebordeaux',
              ],
            }),
          }}
        />
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
        {reglementsEnAttente.length > 0 && <RappelReglement reglements={reglementsEnAttente} />}
        {children}
        <ChatWidget aUneFormuleActive={aUneFormuleActive} />
        <PwaRegister />
        <PwaAccueilAdmin estAdmin={estAdmin} />
        {telephoneManquant && <TelephoneObligatoire />}
      </body>
    </html>
  );
}
