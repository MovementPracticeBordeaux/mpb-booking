// Position de défilement qui centre une carte dans son carrousel.
// Calculée à partir des positions réelles à l'écran (getBoundingClientRect)
// et non d'offsetLeft : offsetLeft est mesuré par rapport à la page, pas au
// carrousel, ce qui ajoutait la marge de la page au calcul. Invisible sur
// téléphone (carrousel collé au bord), mais sur tablette la page est centrée
// avec de larges marges et le jour du jour se retrouvait décalé.
export function positionCentree(conteneur: HTMLElement, carte: HTMLElement): number {
  const zone = conteneur.getBoundingClientRect();
  const cible = carte.getBoundingClientRect();
  return conteneur.scrollLeft + (cible.left - zone.left) - (zone.width - cible.width) / 2;
}

// Centrage à l'ouverture : refait après le premier rendu, puis une fois les
// polices chargées (elles changent la largeur des cartes), pour ne pas
// centrer sur une mise en page provisoire.
export function centrerAuChargement(conteneur: HTMLElement | null, index: number) {
  const centrer = () => {
    const carte = conteneur?.children[index] as HTMLElement | undefined;
    if (conteneur && carte) conteneur.scrollLeft = positionCentree(conteneur, carte);
  };
  centrer();
  requestAnimationFrame(centrer);
  if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(centrer).catch(() => {});
}
