'use client';

import { usePathname } from 'next/navigation';

const LIENS = [
  { href: '/admin', label: "Vue d'ensemble" },
  { href: '/admin/planning', label: 'Planning collectif' },
  { href: '/admin/eleves', label: 'Élèves & paiements' },
  { href: '/admin/statistiques', label: 'Statistiques' },
  { href: '/admin/mentorship', label: 'Mentorat' },
  { href: '/admin/candidatures', label: 'Candidatures' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 640, margin: '20px auto 0', padding: '0 20px' }}>
      {LIENS.map((lien) => {
        const actif = lien.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(lien.href);
        return (
          <a
            key={lien.href}
            href={lien.href}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 999,
              textDecoration: 'none',
              border: `1px solid ${actif ? '#f0a' : '#333'}`,
              background: actif ? 'rgba(255,0,170,0.12)' : 'transparent',
              color: actif ? '#f0a' : 'inherit',
            }}
          >
            {lien.label}
          </a>
        );
      })}
    </nav>
  );
}
