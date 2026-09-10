import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Pages privées/techniques qui n'ont rien à faire dans l'index
        // Google (connexion, espace élève, admin, API).
        disallow: ['/admin', '/api', '/login', '/profil', '/mentorship', '/factures', '/facture-externe'],
      },
    ],
    sitemap: 'https://www.movementpracticebordeaux.com/sitemap.xml',
  };
}
