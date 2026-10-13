import { describe, it, expect } from 'vitest';
import { filtrerEleves } from './recherche-eleves';

const ELEVES = [
  { id: '1', nom: 'Mathieu Fluck', email: 'mathieu@exemple.fr' },
  { id: '2', nom: 'Albane Dupré', email: 'albane@exemple.fr' },
  { id: '3', nom: null, email: 'amorgos33@exemple.fr' },
  { id: '4', nom: 'Hélène Mathé', email: 'helene@exemple.fr' },
  { id: '5', nom: 'Ali Samat', email: 'ali@exemple.fr' },
];

describe('filtrerEleves', () => {
  it('ne propose rien tant que rien n\'est tapé', () => {
    expect(filtrerEleves(ELEVES, '')).toEqual([]);
    expect(filtrerEleves(ELEVES, '   ')).toEqual([]);
  });

  it('trouve par prénom ou par nom, sans majuscules ni accents', () => {
    expect(filtrerEleves(ELEVES, 'albane').map((e) => e.id)).toEqual(['2']);
    expect(filtrerEleves(ELEVES, 'DUPRE').map((e) => e.id)).toEqual(['2']);
    expect(filtrerEleves(ELEVES, 'helene').map((e) => e.id)).toEqual(['4']);
  });

  it('accepte plusieurs morceaux de mots', () => {
    expect(filtrerEleves(ELEVES, 'mat flu').map((e) => e.id)).toEqual(['1']);
  });

  it('cherche aussi dans l\'email quand il n\'y a pas de nom', () => {
    expect(filtrerEleves(ELEVES, 'amorgos').map((e) => e.id)).toEqual(['3']);
  });

  it('met devant les noms qui commencent par la recherche', () => {
    expect(filtrerEleves(ELEVES, 'mat').map((e) => e.id)).toEqual(['4', '1', '5']);
  });

  it('exclut les élèves déjà inscrits', () => {
    expect(filtrerEleves(ELEVES, 'mat', { exclure: ['1'] }).map((e) => e.id)).toEqual(['4', '5']);
  });
});
