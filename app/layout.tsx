export const metadata = {
  title: 'Movement Practice Bordeaux - Réservation',
  description: 'Planning et réservation des cours Movement Practice Bordeaux',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'sans-serif', margin: 0, background: '#111', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
