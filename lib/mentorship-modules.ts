// lib/mentorship-modules.ts
//
// Programme Mentorship restructuré (08/2026) : plus une liste d'articles à
// lire dans l'ordre du sommaire Wix, mais un vrai parcours de progression.
// Chaque étape a un objectif chiffré, des outils vidéo recommandés (voir
// lib/mentorship-tools.ts), et un fragment théorique injecté au moment où
// il sert vraiment — plutôt qu'imposé en préambule.
//
// Progression fermée : une étape se débloque quand la précédente est
// marquée "acquise" par l'élève (voir app/mentorship/page.tsx et
// supabase/migration_mentorship_progression.sql — le champ "vu" existant
// sert maintenant de "acquis").
//
// Pour éditer une étape, donne-moi simplement le champ à changer.
// Les résumés de théorie sont volontairement condensés — remplace-les par
// le texte définitif quand tu veux qu'il apparaisse mot pour mot.

import { ToolGroup } from './mentorship-tools';

export type ObjectifMentorship = {
  code: string; // ex: 'LC2', 'FG3'
  titre: string;
  cible: string; // l'objectif chiffré tel que rédigé pour l'élève
};

export type FragmentTheorie = {
  titre: string;
  resume: string; // condensé — à affiner avec le texte original si besoin
};

export type ModuleMentorship = {
  id: string; // slug stable, sert de clé pour le suivi de progression — ne pas changer une fois publié
  ordre: number;
  titre: string;
  resume: string; // ce qui est travaillé
  objectifPedagogique: string; // pourquoi cette étape existe
  groupesOutils: ToolGroup[];
  objectifs: ObjectifMentorship[];
  jeuxSuggeres?: string[];
  theorie: FragmentTheorie[];
};

export const MODULES_MENTORSHIP: ModuleMentorship[] = [
  {
    id: 'outils-fondamentaux',
    ordre: 1,
    titre: 'Les outils fondamentaux',
    resume: 'Articulations, coordination, respiration, appuis, isolations simples.',
    objectifPedagogique: 'Préparer le corps et développer les bases structurelles avant d\'accéder aux routines complètes.',
    groupesOutils: ['CV', 'EP', 'SC', 'AB', 'MI'],
    objectifs: [],
    theorie: [
      {
        titre: 'Pourquoi le Mouvement ?',
        resume: 'Le Mouvement est une démarche de recherche et développement personnel, physique et mentale, axée sur l\'apprentissage. Il n\'y a pas de bons ou mauvais mouvements dans l\'absolu — seulement des mouvements qu\'on est prêt à réaliser ou non.',
      },
      {
        titre: 'L\'armure organique',
        resume: 'Métaphore de l\'ensemble des outils et routines qu\'on développe pour se protéger et progresser durablement — un système vivant, en constante adaptation, pas une protection figée.',
      },
    ],
  },
  {
    id: 'routine-assise',
    ordre: 2,
    titre: 'Routine assise',
    resume: 'Mobilité des hanches, colonne, chevilles ; transitions sol-bipédie.',
    objectifPedagogique: 'Recréer un lien avec le sol.',
    groupesOutils: ['BC', 'CV'],
    objectifs: [
      { code: 'LC1', titre: 'Sit Work', cible: 'Mémoriser, réaliser et jouer avec la routine assise.' },
    ],
    jeuxSuggeres: ['Jeu de Touches'],
    theorie: [],
  },
  {
    id: 'vocabulaire-bipedie',
    ordre: 3,
    titre: 'Vocabulaire de bipédie',
    resume: 'Squats, transferts de poids, équilibre, changements de direction.',
    objectifPedagogique: 'Ancrage, renforcement et mobilité du bas du corps.',
    groupesOutils: ['BC', 'MI'],
    objectifs: [
      { code: 'LC2', titre: 'Bipédie', cible: 'Mémoriser, réaliser et jouer avec les squats basiques.' },
    ],
    jeuxSuggeres: ['Jeux de Squat et Réflexes avec Bâton'],
    theorie: [
      {
        titre: 'La Bipédie, le socle du Mouvement',
        resume: 'Nous sommes naturellement bipèdes. Pratiquée pieds nus, la bipédie renforce et améliore la mobilité des membres inférieurs tout en travaillant équilibre, proprioception et coordination. Le squat n\'est pas qu\'un exercice : c\'est une transition entre la station debout et les autres formes de locomotion plus proches du sol.',
      },
    ],
  },
  {
    id: 'quadrupedie',
    ordre: 4,
    titre: 'Quadrupédie',
    resume: 'Appuis croisés, fluidité, coordination, création de flow.',
    objectifPedagogique: 'Coordination ipsi/contro, renforcement, mobilité et résilience générale.',
    groupesOutils: ['MI', 'EP', 'SC'],
    objectifs: [
      { code: 'LC3', titre: 'Quadrupédie', cible: 'Mémoriser, réaliser et jouer avec les différents éléments de quadrupédie basique.' },
    ],
    jeuxSuggeres: ["Jeux d'Appuis", 'Jeux de Contact'],
    theorie: [
      {
        titre: 'La Quadrupédie, le retour aux origines',
        resume: 'Se déplacer à quatre pattes rappelle l\'évolution du mouvement chez l\'enfant, en exigeant coordination des hémisphères et latéralisation. Un travail complémentaire d\'inversion, de tirage et d\'ouverture est nécessaire pour contrebalancer la tendance à l\'enroulement de la colonne.',
      },
    ],
  },
  {
    id: 'suspension',
    ordre: 5,
    titre: 'Suspension passive & active',
    resume: 'Grip, relâchement contrôlé, suspensions à un ou deux bras.',
    objectifPedagogique: 'Santé et force de la ceinture scapulaire.',
    groupesOutils: ['HC', 'AB'],
    objectifs: [],
    theorie: [
      {
        titre: 'Suspension et répulsion, un équilibre de forces',
        resume: 'Le travail en suspension (anneaux, barre, grimpe) est équilibré par des mouvements en répulsion (locomotion, pompes, handstand). Ces deux aspects se complètent pour un développement musculaire et articulaire harmonieux — les modes de vie sédentaires sous-développent souvent la chaîne postérieure au profit de la chaîne antérieure.',
      },
    ],
  },
  {
    id: 'transitions-mains',
    ordre: 6,
    titre: 'Transitions sur les mains',
    resume: 'Assembler les compétences de quadrupédie et de bipédie.',
    objectifPedagogique: 'Préparer à la brachiation.',
    groupesOutils: ['HC', 'MI'],
    objectifs: [],
    theorie: [
      {
        titre: 'Le cycle d\'apprentissage : assembler',
        resume: 'Après avoir fragmenté (travaillé isolément) les qualités nécessaires, l\'assemblage consiste à recréer des liens entre les éléments, du plus simple au plus complexe — comme on passe de la note à l\'accord en musique.',
      },
    ],
  },
  {
    id: 'pont-bas',
    ordre: 7,
    titre: 'Pont bas et ses outils',
    resume: 'Ouverture épaules-hanches, reptation dans le pont, transferts.',
    objectifPedagogique: 'Force d\'extension et préambule aux renversements et à l\'inversion.',
    groupesOutils: ['EP', 'MI', 'CV'],
    objectifs: [
      { code: 'FG3', titre: 'Pont bas', cible: '3 x 30 secondes d\'isométrie en pont bas, ou 10 répétitions de Bridge Push Up en pont bas.' },
    ],
    theorie: [
      {
        titre: 'Ouverture et fermeture, harmonie des mouvements',
        resume: 'Les mouvements d\'ouverture (étirements, extensions) sont équilibrés par des mouvements de fermeture (flexion, compression), assurant une mobilité saine et fonctionnelle des muscles et articulations.',
      },
    ],
  },
  {
    id: 'frog-stand',
    ordre: 8,
    titre: 'Frog stand / équilibre bas',
    resume: 'Compression active, positionnement bras/tronc, équilibre statique.',
    objectifPedagogique: 'Se préparer aux arm balance et à l\'équilibre sur les mains.',
    groupesOutils: ['EP', 'SC'],
    objectifs: [
      { code: 'FG1', titre: 'Frog Stand', cible: '3 x 30 secondes de Frog.' },
      { code: 'FG2', titre: 'L-Sit', cible: '3 x 10 secondes de L-Sit.' },
    ],
    theorie: [
      {
        titre: 'Figures statiques et dynamiques',
        resume: 'Les figures statiques (dont les postures d\'équilibre sur les mains) développent force, stabilité et endurance musculaire, et servent de fondation pour des compétences plus avancées. Une fois maîtrisées, elles se réinjectent dans la pratique généraliste de la locomotion.',
      },
    ],
  },
  {
    id: 'rotations-pont-bas',
    ordre: 9,
    titre: 'Rotations dans le pont bas',
    resume: 'Mobilité et renforcement.',
    objectifPedagogique: 'Rendre utilisables nos compétences de renversement.',
    groupesOutils: ['CV', 'EP'],
    objectifs: [],
    theorie: [],
  },
  {
    id: 'tractions',
    ordre: 10,
    titre: 'Tractions',
    resume: 'Renforcement, mobilité des épaules, pattern de tirage.',
    objectifPedagogique: 'Développement de la force et autonomie dans la suspension.',
    groupesOutils: ['HC', 'SC'],
    objectifs: [
      { code: 'FRC', titre: 'Rowing Circle In', cible: '3 séries de 5 répétitions avec une technique d\'exécution parfaite.' },
    ],
    theorie: [],
  },
  {
    id: 'brachiation',
    ordre: 11,
    titre: 'Brachiation au sol ou suspendue',
    resume: 'Coordination, force au-dessus de la tête.',
    objectifPedagogique: 'Entrée dans "l\'univers sur les mains".',
    groupesOutils: ['HC', 'EP'],
    objectifs: [
      { code: 'LC4', titre: 'Brachiation', cible: 'Mémoriser, réaliser et jouer avec les différents éléments de brachiation.' },
    ],
    jeuxSuggeres: ['Jeux de Perturbation', "Jeux d'Absorption"],
    theorie: [
      {
        titre: 'La Brachiation, l\'évolution vers l\'équilibre',
        resume: 'Le déplacement en utilisant les bras offre le plus de combinaisons possibles vers des mouvements de force ou d\'acrobaties douces. Met l\'accent sur la flexion de hanche, le gainage, et la poussée des omoplates — à compléter par un travail d\'extension de hanche et d\'ouverture.',
      },
    ],
  },
  {
    id: 'pont-haut',
    ordre: 12,
    titre: 'Pont haut',
    resume: 'Mobilité et renforcement.',
    objectifPedagogique: 'Gagner en confort en renversement et préparer le travail d\'inversion.',
    groupesOutils: ['CV', 'EP'],
    objectifs: [],
    theorie: [
      {
        titre: 'Inversion et station debout, perspectives complémentaires',
        resume: 'L\'inversion (comme le handstand) offre une perspective unique et défie notre équilibre habituel. Elle stimule le système vestibulaire et les circulations, tandis que la station debout renforce notre capacité à s\'ancrer et interagir avec l\'environnement.',
      },
    ],
  },
  {
    id: 'handstand',
    ordre: 13,
    titre: 'Handstand & prérequis',
    resume: 'Lignes, kick up, endurance verticale.',
    objectifPedagogique: 'Maîtrise du corps inversé, porte d\'entrée vers les figures sur les mains et les mouvements plus dynamiques de locomotion.',
    groupesOutils: ['HC', 'EP', 'SC'],
    objectifs: [],
    theorie: [
      {
        titre: 'Le Strength Project',
        resume: 'Un des fondements de la Voie de la Maîtrise : une progression méthodique du travail sur les appuis, de quatre appuis vers un seul, jusqu\'à la maîtrise totale du poids de corps. Elle ne repose pas que sur la force brute, mais aussi sur la stabilité articulaire et la conscience corporelle.',
      },
    ],
  },
];

// Déroulé de séance type (repris de "Cours collectif"), pour aider Sylvain
// ou les élèves à structurer une session autour de l'étape en cours.
export const STRUCTURE_SEANCE = [
  { etape: 'Accueil & intention du jour', detail: 'Fixer une intention claire, rappeler la logique de progression.' },
  { etape: 'Conditionnement général & spécifique', detail: 'Général : armure organique full body — Spécifique : mobilité/renfo ciblés, drill technique.' },
  { etape: 'Travail des objectifs de séance', detail: 'Selon la phase et les acquis : assise, bipédie, quadrupédie...' },
  { etape: 'Exploration & liens', detail: 'Hand transitions, assemblage (selon temps et niveau).' },
  { etape: 'Challenge / jeu', detail: 'Interaction, adaptation, imprévu, mise en situation.' },
  { etape: 'Retour au calme / intégration', detail: 'Respiration, verbalisation, recentrage.' },
] as const;
