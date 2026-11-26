// Bibliographie du Mentorat, reprise du dossier de Sylvain « Mentorship :
// comprendre et construire » (section Bibliographie & lexique), avec en plus
// 4000 semaines d'Oliver Burkeman, ajouté le 26/11/2026.

export const INTRO_BIBLIOGRAPHIE =
  "Je vous partage ci-dessous les quelques ouvrages qui m'ont le plus inspiré dans ma quête de mouvement jusqu'à aujourd'hui. Il ne s'agit pas de livres techniques ou détaillés sur l'anatomie, sur l'exécution de mouvement ou sur la méthodologie de l'entraînement, mais plus de points de vue, d'idées et de concepts qui ont nourri ma vision, et qui j'espère nourriront la vôtre.";

export type Ouvrage = { auteur: string; titre: string; annee: number; editeur?: string };

export const BIBLIOGRAPHIE: { groupe: string; ouvrages: Ouvrage[] }[] = [
  {
    groupe: 'En rapport direct avec le mouvement ou sa méthodologie',
    ouvrages: [
      { auteur: 'Michel Serres', titre: "Mes profs de gym m'ont appris à penser", annee: 2020 },
      { auteur: 'Cal Newport', titre: 'Deep work', annee: 2017 },
      { auteur: 'Daniel Coyle', titre: 'Le talent code : on ne naît pas talentueux, on le devient', annee: 2020 },
      { auteur: 'Frédéric Delavier', titre: 'Guide des mouvements de musculation', annee: 2010 },
      { auteur: 'Rudolf Laban', titre: 'La maîtrise du mouvement', annee: 1994 },
    ],
  },
  {
    groupe: 'En rapport indirect avec le mouvement ou sa méthodologie',
    ouvrages: [
      { auteur: 'Daniel Goleman', titre: "L'intelligence émotionnelle, intégrale", annee: 2014 },
      { auteur: 'Yuval Noah Harari', titre: "Sapiens : une brève histoire de l'humanité", annee: 2015 },
      { auteur: 'Miyamoto Musashi', titre: 'Traité des cinq roues (Gorin-no-sho)', annee: 1983 },
      { auteur: 'Nassim Nicholas Taleb', titre: "Le Cygne noir : la puissance de l'imprévisible", annee: 2011 },
      { auteur: 'Jean-Pierre Astolfi', titre: "L'erreur, un outil pour enseigner", annee: 1997 },
      { auteur: 'Eugen Herrigel', titre: "Le zen dans l'art chevaleresque du tir à l'arc", annee: 1998 },
      { auteur: 'Avi Grinberg', titre: "La peur, la douleur et d'autres amis", annee: 1995 },
      { auteur: 'Christopher McDougall', titre: 'Tous des héros : comment une bande de hardis tocards a redécouvert les secrets ancestraux de la force et de l’endurance', annee: 2016 },
      { auteur: 'Oliver Burkeman', titre: "4000 semaines : antimanuel de gestion du temps à l'usage des mortels", annee: 2025, editeur: 'First' },
    ],
  },
];
