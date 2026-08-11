// Service worker minimal pour rendre le site installable en PWA.
// Volontairement simple : on ne met en cache "hors ligne" que l'app shell
// (mise en page, polices, icônes), jamais les pages elles-mêmes qui
// contiennent des données à jour (planning, tarifs, profil...). Et surtout,
// /mentorship est explicitement exclu de toute logique de cache tant que
// cette partie est en chantier, pour ne jamais servir une version périmée.

const VERSION = 'mpb-v1';
const APP_SHELL = ['/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Le Mentorship est encore en chantier : on ne veut jamais intercepter
  // ni mettre en cache quoi que ce soit sur ces pages, pour être certain
  // que les élèves voient toujours la toute dernière version.
  if (url.pathname.startsWith('/mentorship')) {
    return;
  }

  // Uniquement les icônes de l'app shell passent par le cache ; tout le
  // reste (pages, API, données) va toujours chercher la version la plus
  // récente sur le réseau.
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((reponse) => reponse || fetch(event.request))
    );
  }
});
