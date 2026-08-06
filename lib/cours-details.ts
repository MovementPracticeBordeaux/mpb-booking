// Détails par discipline : utilisés pour les cartes cliquables sur la homepage
// et comme base de connaissances supplémentaire pour le chat FAQ.
export type CoursDetail = {
  nom: string;
  intensite: number; // 1 à 5
  motsCles: string[];
  description: string;
};

export const COURS_DETAILS: Record<string, CoursDetail> = {
  Handstand: {
    nom: 'Handstand',
    intensite: 4,
    motsCles: ['handstand', 'équilibre', 'ATR', 'technique', 'préparation physique'],
    description:
      "Un apprentissage progressif de l'équilibre sur les mains et de ses variantes, entre compréhension technique fine et renforcement physique ciblé — pour progresser étape par étape, dans une ambiance conviviale.",
  },
  Calisthenics: {
    nom: 'Calisthenics',
    intensite: 3,
    motsCles: ['renforcement', 'poids de corps', 'musculation fonctionnelle', 'masse musculaire'],
    description:
      'Un renforcement complet au poids de corps, haut et bas du corps, pour développer force fonctionnelle, masse musculaire et contrôle, sans machines.',
  },
  Mobilité: {
    nom: 'Mobilité',
    intensite: 3,
    motsCles: ['mobilité', 'stretching actif', 'renforcement', 'squat', 'membres inférieurs', 'fessiers'],
    description:
      "Un entraînement tous niveaux dédié au développement de la masse musculaire et de la flexibilité du bas du corps, à travers un travail approfondi de squat et d'étirements actifs, au poids de corps ou avec charges additionnelles.",
  },
  Locomotion: {
    nom: 'Locomotion',
    intensite: 3,
    motsCles: ['locomotion', 'déplacement au sol', 'capoeira', 'acrobaties douces', 'motricité', 'coordination'],
    description:
      "Un mélange dynamique de mobilité et de renforcement en mouvement, centré sur les déplacements au sol — assez proche de la capoeira et des acrobaties douces : coordination, motricité et créativité au service d'une locomotion plus fluide.",
  },
  'Arm Balance': {
    nom: 'Arm Balance',
    intensite: 5,
    motsCles: ['hand balance', 'arm balance', 'figure sur les mains', 'force', 'équilibre'],
    description:
      'Un travail exigeant des figures en équilibre sur les mains et les avant-bras, entre force, contrôle et équilibre — pour repousser progressivement ses limites.',
  },
  Altinha: {
    nom: 'Altinha',
    intensite: 3,
    motsCles: ['altinha', 'jonglerie', 'futevôlei', 'balle de tennis', 'ballon de foot', 'coordination', 'jeu'],
    description:
      "Un jeu d'adresse au pied inspiré du futevôlei, à la balle de tennis comme au ballon de foot : jongle, enchaîne des figures de plus en plus complexes et progresse en t'amusant avec tes partenaires.",
  },
};
