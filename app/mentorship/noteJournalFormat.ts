export type FormatNote = 'texte' | 'liste';

// Le format et le sujet d'une note sont rangés dans le texte même de la
// note (première ligne « ⟦meta:{...}⟧ »), ce qui évite toute modification
// de la table journal_entrainement. Une note en texte libre sans sujet est
// enregistrée telle quelle — les anciennes notes restent donc lisibles.
const PREFIXE_META = '⟦meta:';
const SUFFIXE_META = '⟧';

export function encoderNote(contenu: string, format: FormatNote, sujet: string | null): string {
  const s = sujet?.trim() || null;
  if (format === 'texte' && !s) return contenu;
  const meta: { f: FormatNote; s?: string } = { f: format };
  if (s) meta.s = s;
  return `${PREFIXE_META}${JSON.stringify(meta)}${SUFFIXE_META}\n${contenu}`;
}

export function decoderNote(brut: string): { contenu: string; format: FormatNote; sujet: string | null } {
  if (brut.startsWith(PREFIXE_META)) {
    const fin = brut.indexOf(SUFFIXE_META + '\n');
    if (fin > 0) {
      try {
        const meta = JSON.parse(brut.slice(PREFIXE_META.length, fin)) as { f?: string; s?: string };
        return {
          contenu: brut.slice(fin + SUFFIXE_META.length + 1),
          format: meta.f === 'liste' ? 'liste' : 'texte',
          sujet: meta.s?.trim() || null,
        };
      } catch {
        // Préfixe illisible : on affiche la note brute plutôt que de la perdre.
      }
    }
  }
  return { contenu: brut, format: 'texte', sujet: null };
}
