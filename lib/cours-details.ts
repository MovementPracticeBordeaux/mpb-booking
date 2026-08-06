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
    motsCles: ['amplitude articulaire', 'mobilité', 'contrôle', 'stretching actif'],
    description:
      "Un travail d'amplitude articulaire et de contrôle, pour bouger sans limite et préparer le corps aux efforts plus intenses — la base de toute progression durable.",
  },
  Locomotion: {
    nom: 'Locomotion',
    intensite: 3,
    motsCles: ['locomotion', 'déplacement au sol', 'parkour', 'motricité', 'coordination'],
    description:
      "Un mélange dynamique de mobilité et de renforcement en mouvement, centré sur les déplacements au sol : coordination, motricité et créativité au service d'une locomotion plus fluide.",
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
    motsCles: ['altinha', 'jonglerie', 'futevôlei', 'coordination', 'jeu'],
    description:
      "Un jeu d'adresse au pied inspiré du futevôlei, à la balle de tennis : jongle, enchaîne des figures de plus en plus complexes et progresse en t'amusant avec tes partenaires.",
  },
};
