'use client';

import { usePathname } from 'next/navigation';

// 5 grandes rubriques au lieu de 10 onglets à plat. Les pages existantes
// gardent leur adresse : seul le regroupement change (sous-onglets).
const RUBRIQUES = [
  { label: 'Planning', pages: [{ href: '/admin/planning', label: 'Planning' }] },
  { label: 'Élèves', pages: [{ href: '/admin/eleves', label: 'Élèves' }] },
  {
    label: 'Finances',
    pages: [
      { href: '/admin/statistiques', label: 'Statistiques' },
      { href: '/admin/factures', label: 'Factures' },
    ],
  },
  {
    label: 'Animation',
    pages: [
      { href: '/admin/defis', label: 'Défi du mois' },
      { href: '/admin/evenements', label: 'Événements' },
    ],
  },
  {
    label: 'Mentorat',
    pages: [
      { href: '/admin/mentorship', label: 'Suivi' },
      { href: '/admin/objectifs', label: 'Objectifs' },
      { href: '/admin/candidatures', label: 'Candidatures' },
    ],
  },
];

export default function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname() ?? '';
  const rubriqueActive = RUBRIQUES.find((r) => r.pages.some((p) => pathname.startsWith(p.href)));
  const badgeRubrique = (r: (typeof RUBRIQUES)[number]) => r.pages.reduce((n, p) => n + (badges[p.href] ?? 0), 0);

  return (
    <nav className="nav-admin">
      <div className="nav-admin-pastilles">
        {RUBRIQUES.map((r) => {
          const actif = r === rubriqueActive;
          const badge = badgeRubrique(r);
          return (
            <a key={r.label} href={r.pages[0].href} className={actif ? 'pastille pastille-active' : 'pastille'}>
              {r.label}
              {badge > 0 && <span className="pastille-badge">{badge}</span>}
            </a>
          );
        })}
      </div>
      {rubriqueActive && rubriqueActive.pages.length > 1 && (
        <div className="nav-admin-sous">
          {rubriqueActive.pages.map((p) => (
            <a key={p.href} href={p.href} className={pathname.startsWith(p.href) ? 'sous-onglet sous-onglet-actif' : 'sous-onglet'}>
              {p.label}
              {(badges[p.href] ?? 0) > 0 && <span className="pastille-badge">{badges[p.href]}</span>}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
