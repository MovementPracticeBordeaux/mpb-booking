import { describe, expect, it } from 'vitest';
import { CHAT_FAQ, trouverMeilleureReponse, type ChatFAQ } from './chat-faq';
import { COURS_DETAILS } from './cours-details';

const FIXTURE: ChatFAQ[] = [
  { question: 'Q1', reponse: 'Réponse un mot-clé', motsCles: ['alpha'] },
  { question: 'Q2', reponse: 'Réponse deux mots-clés', motsCles: ['alpha', 'beta'] },
  { question: 'Q3', reponse: 'Réponse sans rapport', motsCles: ['gamma'] },
];

describe('trouverMeilleureReponse', () => {
  it("ne trouve rien quand aucun mot-clé ne correspond", () => {
    expect(trouverMeilleureReponse('question totalement hors sujet', FIXTURE)).toEqual({ trouve: false });
  });

  it('retourne la réponse dont un mot-clé correspond', () => {
    expect(trouverMeilleureReponse('quelque chose avec gamma dedans', FIXTURE)).toEqual({
      trouve: true,
      reponse: 'Réponse sans rapport',
    });
  });

  it('préfère la réponse au score le plus élevé (plus de mots-clés présents)', () => {
    expect(trouverMeilleureReponse('alpha et beta ensemble', FIXTURE)).toEqual({
      trouve: true,
      reponse: 'Réponse deux mots-clés',
    });
  });

  it('est insensible à la casse', () => {
    expect(trouverMeilleureReponse('GAMMA en majuscules', FIXTURE)).toEqual({
      trouve: true,
      reponse: 'Réponse sans rapport',
    });
  });

  it('en cas d\'égalité de score, retient la première entrée rencontrée', () => {
    const exAequo: ChatFAQ[] = [
      { question: 'A', reponse: 'Première', motsCles: ['x'] },
      { question: 'B', reponse: 'Seconde', motsCles: ['x'] },
    ];
    expect(trouverMeilleureReponse('question avec x', exAequo)).toEqual({
      trouve: true,
      reponse: 'Première',
    });
  });

  it('utilise CHAT_FAQ par défaut si aucune liste n\'est fournie', () => {
    const resultat = trouverMeilleureReponse('où se trouve le lieu ?');
    expect(resultat.trouve).toBe(true);
  });
});

// Régression : un mot-clé générique dans une entrée "générale" (ex: 'handstand'
// dans la question "Quelles disciplines sont enseignées ?") était aussi le
// mot-clé propre à l'entrée FAQ spécifique de la discipline Handstand, ce qui
// créait une égalité de score et faisait parfois gagner la mauvaise réponse.
describe('CHAT_FAQ (base réelle) — pas de collision entre FAQ générale et FAQ disciplines', () => {
  it('aucun mot-clé des entrées générales ne coïncide avec un mot-clé propre à une discipline', () => {
    const motsClesDisciplines = new Set(
      Object.values(COURS_DETAILS).flatMap((c) => [c.nom.toLowerCase(), ...c.motsCles.map((m) => m.toLowerCase())])
    );

    const entreesGenerales = CHAT_FAQ.filter((item) => !item.question.startsWith('En quoi consiste le cours'));
    const collisions: string[] = [];
    for (const item of entreesGenerales) {
      for (const mot of item.motsCles) {
        if (motsClesDisciplines.has(mot)) {
          collisions.push(`"${mot}" dans "${item.question}"`);
        }
      }
    }

    expect(collisions).toEqual([]);
  });

  it('une question sur le handstand renvoie bien la réponse Handstand', () => {
    const resultat = trouverMeilleureReponse('parle-moi du handstand');
    expect(resultat).toEqual({
      trouve: true,
      reponse: expect.stringContaining('équilibre sur les mains'),
    });
  });
});
