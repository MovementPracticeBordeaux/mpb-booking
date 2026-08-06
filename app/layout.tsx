import { supabaseServer } from '@/lib/supabase-server';

export const metadata = {
  title: 'Movement Practice Bordeaux - Réservation',
  description: 'Planning et réservation des cours Movement Practice Bordeaux',
};

const LIENS = [
  { href: '/', label: 'Planning' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/coaching', label: 'Mon coaching' },
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
      <body style={{ fontFamily: 'sans-serif', margin: 0, background: '#111', color: '#fff' }}>
        <nav style={{
          display: 'flex', flexWrap: 'wrap', gap: 16, padding: '12px 20px',
          borderBottom: '1px solid #333', alignItems: 'center', fontSize: 14,
        }}>
          {LIENS.map((l) => (
            <a key={l.href} href={l.href} style={{ color: '#ddd', textDecoration: 'none' }}>{l.label}</a>
          ))}
          {estAdmin && <a href="/admin" style={{ color: '#f0a', textDecoration: 'none' }}>Admin</a>}
          <span style={{ flex: 1 }} />
          {user ? (
            <span style={{ color: '#888' }}>{user.email}</span>
          ) : (
            <a href="/login" style={{ color: '#f0a', textDecoration: 'none' }}>Connexion</a>
          )}
        </nav>
        {children}
      </body>
    </html>
  );
}
