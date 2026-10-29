import { describe, it, expect } from 'vitest';
import { encoderNote, decoderNote } from './noteJournalFormat';

describe('notes du journal (format et sujet rangés dans le texte)', () => {
  it('laisse intactes les notes en texte libre sans sujet', () => {
    expect(encoderNote('3 tractions', 'texte', null)).toBe('3 tractions');
    expect(decoderNote('3 tractions')).toEqual({ contenu: '3 tractions', format: 'texte', sujet: null });
  });
  it('relit une liste avec son sujet', () => {
    const brut = encoderNote('point 1\npoint 2', 'liste', ' Muscle up ');
    expect(decoderNote(brut)).toEqual({ contenu: 'point 1\npoint 2', format: 'liste', sujet: 'Muscle up' });
  });
  it('garde une note au préfixe illisible plutôt que de la perdre', () => {
    const brut = '⟦meta:{pas du json⟧\nbonjour';
    expect(decoderNote(brut).contenu).toBe(brut);
  });
});
