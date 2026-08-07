'use client';

import { useEffect, useRef, useState } from 'react';
import { COULEURS } from '@/lib/theme';

type Lien = { href: string; label: string };

export default function NavBar({
  liens,
  estAdmin,
  userEmail,
}: {
  liens: Lien[];
  estAdmin: boolean;
  userEmail: string | null;
}) {
  const [ouvert, setOuvert] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', surClicExterieur);
    document.addEventListener('touchstart', surClicExterieur);
    return () => {
      document.removeEventListener('mousedown', surClicExterieur);
      document.removeEventListener('touchstart', surClicExterieur);
    };
  }, [ouvert]);

  return (
    <nav
      ref={navRef}
      style={{
        borderBottom: `1px solid ${COULEURS.bordure}`,
        position: 'sticky',
        top: 0,
        background: 'rgba(11,11,13,0.9)',
        backdropFilter: 'blur(6px)',
        zIndex: 10,
      }}
    >
      <style>{`
        .nav-liens { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; }
        .nav-burger { display: none; }
        .nav-panel-mobile { display: none; }
        @media (max-width: 860px) {
          .nav-liens { display: none; }
          .nav-burger { display: block; }
          .nav-panel-mobile.ouvert { display: flex; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 20px', fontSize: 14 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Movement Practice Bordeaux" style={{ height: 24 }} />
        </a>

        <div className="nav-liens">
          {liens.map((l) => (
            <a key={l.href} href={l.href} style={{ color: COULEURS.texteAtt, textDecoration: 'none' }}>{l.label}</a>
          ))}
          {estAdmin && <a href="/admin" style={{ color: '#FF2D78', textDecoration: 'none' }}>Admin</a>}
        </div>

        <span style={{ flex: 1 }} />

        <div className="nav-liens">
          {userEmail ? (
            <a href="/profil" style={{ color: COULEURS.texteFaible, fontSize: 13, textDecoration: 'none' }}>{userEmail}</a>
          ) : (
            <a href="/profil" style={{ color: '#FF2D78', textDecoration: 'none' }}>Connexion</a>
          )}
        </div>

        <button
          className="nav-burger"
          onClick={() => setOuvert((o) => !o)}
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={ouvert}
          style={{ background: 'none', border: 'none', color: COULEURS.texte, fontSize: 22, cursor: 'pointer', padding: 4 }}
        >
          {ouvert ? '✕' : '☰'}
        </button>
      </div>

      <div className={`nav-panel-mobile ${ouvert ? 'ouvert' : ''}`} style={{ flexDirection: 'column', gap: 2, padding: '0 20px 16px', fontSize: 15 }}>
        {liens.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOuvert(false)}
            style={{ color: COULEURS.texteAtt, textDecoration: 'none', padding: '10px 0', borderBottom: `1px solid ${COULEURS.bordure}` }}
          >
            {l.label}
          </a>
        ))}
        {estAdmin && (
          <a href="/admin" onClick={() => setOuvert(false)} style={{ color: '#FF2D78', textDecoration: 'none', padding: '10px 0', borderBottom: `1px solid ${COULEURS.bordure}` }}>
            Admin
          </a>
        )}
        {userEmail ? (
          <a href="/profil" onClick={() => setOuvert(false)} style={{ color: COULEURS.texteFaible, textDecoration: 'none', padding: '10px 0' }}>
            {userEmail}
          </a>
        ) : (
          <a href="/profil" onClick={() => setOuvert(false)} style={{ color: '#FF2D78', textDecoration: 'none', padding: '10px 0' }}>
            Connexion
          </a>
        )}
      </div>
    </nav>
  );
}
