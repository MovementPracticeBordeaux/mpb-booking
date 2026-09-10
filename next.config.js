/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirections 301 depuis les anciennes URLs Wix, encore indexées par
  // Google (confirmé via une recherche site:movementpracticebordeaux.com
  // le 10/09/2026 — /plans-pricing, /service-page/*, /locomotion,
  // /vidéos, /formation-mentorship renvoyaient tous un 404 sur le
  // nouveau site). Sans ça, les visiteurs qui cliquent un résultat Google
  // tombent sur une page cassée, et Google finit par dégrader le
  // classement du site à force d'accumuler ces erreurs.
  async redirects() {
    return [
      { source: '/plans-pricing', destination: '/tarifs', permanent: true },
      { source: '/formation-mentorship', destination: '/mentorat', permanent: true },
      // Toutes les anciennes fiches de cours individuelles (Wix) n'ont pas
      // d'équivalent direct sur le nouveau site, qui les regroupe sur la
      // page d'accueil et /planning — redirigées vers l'accueil.
      { source: '/service-page/:slug*', destination: '/', permanent: true },
      { source: '/locomotion', destination: '/', permanent: true },
      { source: '/vid%C3%A9os', destination: '/', permanent: true },
      { source: '/videos', destination: '/', permanent: true },
    ];
  },
};
module.exports = nextConfig;
