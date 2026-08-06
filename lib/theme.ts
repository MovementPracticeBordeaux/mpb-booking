// Système de design partagé par tout le site — cohérent avec l'identité déjà
// utilisée sur les visuels Instagram (fond sombre, dégradé chaud, Bebas Neue).
export const COULEURS = {
  fond: '#0b0b0d',
  surface: 'rgba(255,255,255,0.04)',
  surfaceForte: 'rgba(255,255,255,0.08)',
  bordure: 'rgba(255,255,255,0.1)',
  texte: '#f5f5f0',
  texteAtt: 'rgba(245,245,240,0.62)',
  texteFaible: 'rgba(245,245,240,0.35)',
};

export const GRADIENT = 'linear-gradient(90deg, #FF3B30, #FF8A00, #FF2D78, #8B5CF6)';
export const GRADIENT_TEXTE = {
  backgroundImage: GRADIENT,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export const POLICE_DISPLAY = "'Bebas Neue', sans-serif";
export const POLICE_CORPS = "'Barlow Condensed', sans-serif";

export const FONTS_IMPORT_URL =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;1,400&display=swap';
