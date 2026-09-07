import { describe, it, expect } from 'vitest';
import { estNoeudDeverrouille, TOUS_LES_NOEUDS } from './mentorship-modules';

// Nœuds réels du tronc et des branches, utilisés tels quels dans ces tests
// (armure-1/2/3, force-1/2/3, flexibilite-1/2/3, locomotion-1/2/3,
// connexion-1/2/3, figures-1/2/3) — voir TRONC / BRANCHES.
function trouver(id: string) {
  const n = TOUS_LES_NOEUDS.find((x) => x.id === id);
  if (!n) throw new Error(`Nœud introuvable dans les données réelles : ${id}`);
  return n;
}

describe('estNoeudDeverrouille — verrouillage global entre branches', () => {
  it('verrouille toute branche tant que le tronc n\'est pas complet', () => {
    const idsAcquis = new Set(['armure-1', 'armure-2']); // tronc incomplet (niveau 3 manquant)
    expect(estNoeudDeverrouille(trouver('force-1'), idsAcquis)).toBe(false);
  });

  it('débloque le niveau 1 de TOUTES les branches dès que le tronc est complet', () => {
    const idsAcquis = new Set(['armure-1', 'armure-2', 'armure-3']);
    for (const domaine of ['force', 'flexibilite', 'locomotion', 'connexion', 'figures']) {
      expect(estNoeudDeverrouille(trouver(`${domaine}-1`), idsAcquis)).toBe(true);
    }
  });

  it('ne débloque PAS le niveau 2 d\'une branche si une AUTRE branche n\'a pas encore acquis son niveau 1 (verrouillage global)', () => {
    const idsAcquis = new Set([
      'armure-1', 'armure-2', 'armure-3',
      'force-1', 'flexibilite-1', 'locomotion-1', 'connexion-1',
      // figures-1 volontairement absent : une seule branche en retard suffit à tout bloquer
    ]);
    expect(estNoeudDeverrouille(trouver('force-2'), idsAcquis)).toBe(false);
  });

  it('débloque le niveau 2 de TOUTES les branches une fois le niveau 1 acquis PARTOUT', () => {
    const idsAcquis = new Set([
      'armure-1', 'armure-2', 'armure-3',
      'force-1', 'flexibilite-1', 'locomotion-1', 'connexion-1', 'figures-1',
    ]);
    for (const domaine of ['force', 'flexibilite', 'locomotion', 'connexion', 'figures']) {
      expect(estNoeudDeverrouille(trouver(`${domaine}-2`), idsAcquis)).toBe(true);
    }
  });

  it('ne débloque pas le niveau 3 tant que le niveau 2 n\'est pas acquis dans toutes les branches, même avec le niveau 1 partout', () => {
    const idsAcquis = new Set([
      'armure-1', 'armure-2', 'armure-3',
      'force-1', 'flexibilite-1', 'locomotion-1', 'connexion-1', 'figures-1',
      'force-2', 'flexibilite-2', // seulement 2 branches ont acquis leur niveau 2
    ]);
    expect(estNoeudDeverrouille(trouver('force-3'), idsAcquis)).toBe(false);
  });

  it('une branche avancée à un niveau ne débloque pas pour autant le niveau suivant tant que les autres n\'ont pas rattrapé', () => {
    // force est en avance (niveau 1 ET 2 acquis) mais les autres branches
    // n'ont même pas encore leur niveau 1 -- force-3 doit rester verrouillé.
    const idsAcquis = new Set(['armure-1', 'armure-2', 'armure-3', 'force-1', 'force-2']);
    expect(estNoeudDeverrouille(trouver('force-3'), idsAcquis)).toBe(false);
  });
});
