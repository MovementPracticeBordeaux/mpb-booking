import { supabaseServer } from '@/lib/supabase-server';
import { COULEURS, FONTS_IMPORT_URL, POLICE_CORPS } from '@/lib/theme';

export const metadata = {
  title: 'Movement Practice Bordeaux — Calisthenics, Handstand, Locomotion & Mobilité',
  description: 'Coaching, cours et ateliers au poids de corps à Bordeaux : calisthenics, handstand, locomotion, mobilité.',
  keywords: ['calisthenics', 'handstand', 'locomotion', 'mobilité', 'Bordeaux', 'coaching sportif', 'mouvement'],
};

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/planning', label: 'Planning' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/coaching', label: 'Coaching' },
  { href: '/pro', label: 'Pro' },
  { href: '/factures', label: 'Mes factures' },
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
        <nav style={{
          display: 'flex', flexWrap: 'wrap', gap: 18, padding: '14px 20px',
          borderBottom: `1px solid ${COULEURS.bordure}`, alignItems: 'center', fontSize: 14,
          position: 'sticky', top: 0, background: 'rgba(11,11,13,0.9)', backdropFilter: 'blur(6px)', zIndex: 10,
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Movement Practice Bordeaux" style={{ height: 24 }} />
          </a>
          {LIENS.map((l) => (
            <a key={l.href} href={l.href} style={{ color: COULEURS.texteAtt, textDecoration: 'none' }}>{l.label}</a>
          ))}
          {estAdmin && <a href="/admin" style={{ color: '#FF2D78', textDecoration: 'none' }}>Admin</a>}
          <span style={{ flex: 1 }} />
          {user ? (
            <span style={{ color: COULEURS.texteFaible, fontSize: 13 }}>{user.email}</span>
          ) : (
            <a href="/login" style={{ color: '#FF2D78', textDecoration: 'none' }}>Connexion</a>
          )}
        </nav>
        {children}
      </body>
    </html>
  );
}
