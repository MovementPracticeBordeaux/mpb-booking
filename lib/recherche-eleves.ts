// Recherche d'élèves par prénom, nom ou email, sans tenir compte des
// majuscules ni des accents. Chaque mot tapé doit se retrouver quelque part
// ("mat flu" trouve "Mathieu Fluck").

export type EleveRecherche = { id: string; nom: string | null; email: string };

export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrerEleves<T extends EleveRecherche>(
  eleves: T[],
  requete: string,
  options: { exclure?: string[]; max?: number } = {},
): T[] {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return [];
  const exclus = new Set(options.exclure ?? []);
  const resultats = eleves
    .filter((e) => !exclus.has(e.id))
    .map((e) => {
      const nom = normaliser(e.nom ?? '');
      const email = normaliser(e.email);
      const texte = `${nom} ${email}`;
      if (!mots.every((m) => texte.includes(m))) return null;
      // Les noms qui commencent par ce qu'on tape passent devant.
      const debutMot = nom.split(/\s+/).some((partie) => partie.startsWith(mots[0]));
      return { e, score: debutMot ? 0 : 1 };
    })
    .filter((r): r is { e: T; score: number } => r !== null)
    .sort((a, b) => a.score - b.score || (a.e.nom ?? a.e.email).localeCompare(b.e.nom ?? b.e.email, 'fr'));
  return resultats.slice(0, options.max ?? 8).map((r) => r.e);
}
