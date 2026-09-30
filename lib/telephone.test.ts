import { describe, it, expect } from 'vitest';
import { normaliserTelephone, lienWhatsApp, formaterTelephone } from './telephone';

describe('normaliserTelephone', () => {
  it.each([
    ['06 12 34 56 78', '+33612345678'],
    ['06.12.34.56.78', '+33612345678'],
    ['0612345678', '+33612345678'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['+33 06 12 34 56 78', '+33612345678'],
    ['0033612345678', '+33612345678'],
    ['612345678', '+33612345678'],
    ['+44 7911 123456', '+447911123456'],
  ])('%s -> %s', (brut, attendu) => {
    expect(normaliserTelephone(brut)).toBe(attendu);
  });

  it.each(['', '123', 'abc', '06 12 34'])('refuse "%s"', (brut) => {
    expect(normaliserTelephone(brut)).toBeNull();
  });
});

describe('lienWhatsApp / formaterTelephone', () => {
  it('construit un lien wa.me sans le +', () => {
    expect(lienWhatsApp('06 12 34 56 78')).toBe('https://wa.me/33612345678');
  });
  it('affiche un numéro français lisible', () => {
    expect(formaterTelephone('+33612345678')).toBe('06 12 34 56 78');
  });
});
