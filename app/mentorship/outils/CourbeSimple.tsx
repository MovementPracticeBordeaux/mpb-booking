'use client';

import { COULEURS } from '@/lib/theme';

// Petite courbe SVG réutilisable — même logique visuelle que la courbe XP
// du tableau de bord Mentorat, adaptée à n'importe quelle série
// (date, valeur) : temps de tenue par session, volume par exercice, etc.
export default function CourbeSimple({
  points, unite, couleur = '#ff00aa',
}: {
  points: { date: string; valeur: number }[];
  unite: (v: number) => string;
  couleur?: string;
}) {
  if (points.length < 2) {
    return (
      <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', padding: '20px 0' }}>
        Encore trop peu de séances enregistrées pour tracer une courbe (au moins 2 nécessaires).
      </p>
    );
  }

  const recents = points.slice(-20);
  const svgW = 560, svgH = 180, padG = 40, padD = 12, padH = 16, padB = 26;
  const maxV = Math.max(...recents.map((p) => p.valeur), 1);
  const coords = recents.map((p, i) => ({
    x: padG + (i / (recents.length - 1)) * (svgW - padG - padD),
    y: padH + (1 - p.valeur / maxV) * (svgH - padH - padB),
    ...p,
  }));
  const aire = `M ${coords[0].x} ${svgH - padB} ` + coords.map((c) => `L ${c.x} ${c.y}`).join(' ') + ` L ${coords[coords.length - 1].x} ${svgH - padB} Z`;
  const ligne = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const gradId = `aire-${couleur.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={couleur} stopOpacity="0.35" /><stop offset="100%" stopColor={couleur} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padG} y1={svgH - padB} x2={svgW - padD} y2={svgH - padB} stroke={COULEURS.bordure} strokeWidth={1} />
      <path d={aire} fill={`url(#${gradId})`} />
      <path d={ligne} fill="none" stroke={couleur} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3.2} fill={couleur} />
          {(i === coords.length - 1 || i === 0) && (
            <text x={c.x} y={c.y - 10} fontSize={11} fill={COULEURS.texte} textAnchor="middle">{unite(c.valeur)}</text>
          )}
          <text x={c.x} y={svgH - 8} fontSize={9} fill={COULEURS.texteFaible} textAnchor="middle">
            {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </text>
        </g>
      ))}
    </svg>
  );
}
