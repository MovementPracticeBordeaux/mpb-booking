// lib/mentorship-modules.ts
//
// Programme Mentorship — structure en arbre (08/2026).
//
// Un TRONC en 3 niveaux (l'Armure Organique — le socle de compétences
// générales) d'où partent 5 BRANCHES parallèles, elles-mêmes en 3 niveaux
// chacune : Force, Flexibilité, Locomotion, Connexion, Figures.
//
// Règle de déverrouillage :
// - Le tronc niveau N+1 se débloque quand le tronc niveau N est acquis.
// - Une branche niveau N se débloque quand : le TRONC niveau N est acquis
//   (le socle général doit être là avant d'aller chercher la spécialisation),
//   ET le niveau N-1 de LA MÊME branche est acquis (s'il existe),
//   ET tous les prérequis inter-branches du nœud sont acquis (ce qui
//   matérialise les correspondances entre domaines : un niveau de force
//   donné correspond à un niveau de figure donné, etc.)
//
// La théorie de chaque nœud n'est pas un résumé décoratif : c'est le
// support philosophique que l'élève doit s'approprier avant/pendant la
// pratique, tel que rédigé par Sylvain (repris et étoffé de son
// programme Wix "COMPRENDRE & CONSTRUIRE...").

import { ToolGroup } from './mentorship-tools';

export type Domaine = 'force' | 'flexibilite' | 'locomotion' | 'connexion' | 'figures';

export const DOMAINE_LABELS: Record<Domaine, string> = {
  force: 'Force',
  flexibilite: 'Flexibilité',
  locomotion: 'Locomotion',
  connexion: 'Connexion',
  figures: 'Figures',
};

// Couleur d'accent par domaine, pour que l'arbre soit lisible d'un coup d'œil.
export const DOMAINE_COULEURS: Record<Domaine, string> = {
  force: '#FF3B30',
  flexibilite: '#4FC3F7',
  locomotion: '#FFB74D',
  connexion: '#8B5CF6',
  figures: '#FF2D78',
};

export type ObjectifMentorship = {
  code: string;
  titre: string;
  cible: string;
};

export type FragmentTheorie = {
  titre: string;
  texte: string; // paragraphe complet, pas un résumé d'une ligne
};

export type NoeudCompetence = {
  id: string; // slug stable, sert de clé de progression — ne pas changer une fois publié
  domaine: Domaine;
  niveau: 1 | 2 | 3;
  titre: string;
  resume: string;
  objectifPedagogique: string;
  groupesOutils: ToolGroup[];
  objectifs: ObjectifMentorship[];
  jeuxSuggeres?: string[];
  theorie: FragmentTheorie[];
  // Prérequis dans D'AUTRES branches (en plus du tronc de même niveau et du
  // niveau précédent de la même branche, vérifiés automatiquement). C'est
  // ici que se matérialisent les correspondances entre domaines.
  prerequis?: { domaine: Domaine; niveauMin: number }[];
};

export type NoeudTronc = {
  id: string;
  niveau: 1 | 2 | 3;
  titre: string;
  resume: string;
  objectifPedagogique: string;
  groupesOutils: ToolGroup[];
  theorie: FragmentTheorie[];
};

// --- Le tronc : Armure Organique, en 3 niveaux ---------------------------
// Le socle général. Tant que le niveau N du tronc n'est pas acquis, aucune
// branche n'a de niveau N accessible : pas d'intérêt à se spécialiser sans
// les fondations générales correspondantes.

export const TRONC_ARMURE_ORGANIQUE: NoeudTronc[] = [
  {
    id: 'armure-1',
    niveau: 1,
    titre: 'Fondations',
    resume: 'Mobilité articulaire de base, respiration, conscience corporelle — le point de départ commun à tout le reste.',
    objectifPedagogique: "Préparer le corps et poser la posture d'apprentissage avant toute spécialisation.",
    groupesOutils: ['CV', 'EP', 'SC', 'AB', 'MI'],
    theorie: [
      {
        titre: 'Pourquoi le Mouvement ?',
        texte: "Le Mouvement est une quête, une démarche de recherche et de développement personnel, un point de vue et une stratégie à la fois physique et mentale, axée sur l'apprentissage et l'acquisition d'expérience. Il n'existe pas de bon ou de mauvais mouvement dans l'absolu — seulement des mouvements que l'on est prêt à réaliser, et d'autres non. Le corps humain a été façonné par plusieurs millions d'années d'évolution en pleine nature, contre seulement quelques milliers d'années de vie sédentaire : il a conservé en mémoire l'ensemble de ses capacités originelles. La pratique du Mouvement freine notre inévitable dégénérescence, à condition d'être menée avec intelligence, dans une logique d'harmonie et de santé sur le long terme — ce qui n'est pas contradictoire avec la performance. Au contraire : sous ces conditions, la performance peut être mise au service de la santé.",
      },
      {
        titre: "L'armure organique",
        texte: "Dans la quête de maîtrise et d'excellence en matière de mouvement, l'« armure organique » émerge comme une métaphore puissante. Elle symbolise l'ensemble des outils et routines articulaires et musculaires utiles dans un but donné. Le terme « armure » évoque une protection, un équipement défensif conçu pour sauvegarder le corps ; « organique » fait référence à ce qui est vivant, en contraste avec l'inerte. L'armure organique n'est donc pas une simple protection statique, mais un système dynamique, en constante évolution — forgée non pas de métal, mais de muscles, d'os, de tendons, et d'une conscience aiguë du corps. Ce premier niveau pose les toutes premières pièces de cette armure : la mobilité de base et la capacité à sentir son corps.",
      },
      {
        titre: "La Mouvolution, phase de l'étudiant",
        texte: "Avant l'entraînement, il convient de structurer sa progression. La démarche d'apprentissage — la « Mouvolution » — se divise en trois phases. Ce premier niveau du tronc correspond à la phase de l'étudiant : étudier et pratiquer chaque secteur du Mouvement de manière isolée pour en comprendre les fondamentaux, en adoptant l'état d'esprit du débutant (le soshin), ouvert et avide d'expériences. Réalisée avec conscience et analyse, la répétition permet d'améliorer progressivement la qualité recherchée dans l'exécution d'une tâche — c'est la matière première de tout apprentissage.",
      },
    ],
  },
  {
    id: 'armure-2',
    niveau: 2,
    titre: 'Consolidation',
    resume: "Le travail de fond devient méthodique : le cycle d'apprentissage structure la progression.",
    objectifPedagogique: 'Passer du subjectif (ce qui me convient) vers l\'objectif (ce qui est mesurable et progressif).',
    groupesOutils: ['BC', 'HC'],
    theorie: [
      {
        titre: 'Le travail de fond : du subjectif vers l\'objectif',
        texte: "L'importance du travail de fond dans une pratique de mouvement est capitale pour construire l'armure organique, visant la santé et la protection physique sur le long terme. Ce travail est d'abord subjectif, s'adaptant aux besoins et capacités individuelles de chacun — comparable à l'œuvre qui se transforme sous les mains du forgeron, au travail minutieux qui façonne la matière avec précision et régularité. Par la suite, un travail plus objectif prend place, orienté vers des objectifs cibles personnels : le pratiquant commence à explorer le mouvement dans toute sa diversité, en fonction de ses projets. Cette étape est cruciale pour l'épanouissement personnel et la découverte de sa propre voie.",
      },
      {
        titre: "Le cycle d'apprentissage",
        texte: "Avant de mettre en place un nouvel apprentissage, il convient de définir précisément ses objectifs. Le cycle se déroule en quatre temps : Fragmenter, c'est-à-dire diviser un mouvement en fragments, chacun représentant une qualité sollicitée par son exécution, pour un travail isolé et ciblé. Assembler, c'est recréer des liens entre ces fragments, de la plus simple à la plus complexe combinaison — comme on passe de la note à l'accord en musique. Injecter, c'est intégrer une compétence acquise dans la Locomotion, l'environnement mouvant et créatif où elle devient réellement utilisable. Amplifier, enfin, c'est ajouter un cran de complexité par le jeu ou l'augmentation du niveau d'exigence. Ce cycle repart ensuite avec un nouvel objectif, cohérent avec les acquis précédents : chaque compétence devient une porte vers la suivante.",
      },
    ],
  },
  {
    id: 'armure-3',
    niveau: 3,
    titre: 'Intégration',
    resume: "L'armure organique devient un système vivant : chaque compétence se relie aux autres.",
    objectifPedagogique: 'Entrer dans la phase de l\'artisan : relier les domaines plutôt que les juxtaposer.',
    groupesOutils: ['CV', 'EP', 'SC', 'AB', 'MI', 'BC', 'HC'],
    theorie: [
      {
        titre: 'La Mouvolution, phase du chercheur puis de l\'artisan',
        texte: "Dans la phase du chercheur, la démarche évolue : on établit des liens et des connexions entre chacun des domaines étudiés précédemment, en cherchant à comprendre comment ils s'influencent mutuellement. Puis vient la phase de l'artisan, qui entremêle complètement les compétences et les secteurs, en pratiquant pleinement la transversalité. L'artisan peut introduire une dimension plus libre et artistique dans sa pratique, en exprimant sa créativité à travers le Mouvement. Cette phase vise une maîtrise globale, où le pratiquant est capable d'interagir de manière fluide avec son corps et son environnement, tout en exprimant librement sa propre identité artistique.",
      },
      {
        titre: 'La fabrique du multivers',
        texte: "À ce stade, l'armure organique s'inscrit dans une perspective globale où chaque compétence acquise devient une brique dans la construction d'un multivers de mouvements. Ce point de vue favorise la création de liens entre différents mouvements et domaines, encourageant le dépassement de soi, le transfert de compétences, la créativité et l'expression individuelle. C'est ce niveau d'intégration qui rend accessibles les compétences les plus exigeantes de chaque branche — celles qui demandent de mobiliser plusieurs domaines à la fois.",
      },
    ],
  },
];

// --- Branche FORCE ----------------------------------------------------------

const FORCE: NoeudCompetence[] = [
  {
    id: 'force-1',
    domaine: 'force',
    niveau: 1,
    titre: "Force dans l'alignement",
    resume: 'Squats, poussées : construire une force symétrique et équilibrée, respectueuse de la posture.',
    objectifPedagogique: 'Poser les bases d\'un travail de force sûr avant de chercher à sortir de l\'alignement standard.',
    groupesOutils: ['BC', 'EP'],
    objectifs: [
      { code: 'FFS', titre: 'Front Squat', cible: '3 séries de 8 répétitions de Front Squat à 60% du poids de corps.' },
      { code: 'FPU', titre: 'Push Up Clean', cible: '1 série de 15 répétitions de Triceps Push Up avec une technique parfaite.' },
    ],
    theorie: [
      {
        titre: 'La force est relative et unique à chaque personne',
        texte: "Le travail de force regroupe l'ensemble des moyens permettant d'accroître la capacité à gérer la tension et l'intensité d'un mouvement. On distingue le travail dit « dans l'alignement » — où les efforts musculaires ont lieu en respectant une posture de référence, souvent symétrique — du travail dit « organique », qui cherche à sortir de cet alignement. Il est crucial de comprendre que le niveau de force d'un individu n'est pas une capacité figée : c'est une qualité qui peut être entraînée et développée, indépendamment de l'âge, du sexe ou de l'état de santé initial. Comparer sa capacité à celle d'autrui, sans considérer les différences de poids corporel et de niveau de force individuels, est non seulement inutile mais peut mener à des interprétations erronées. L'objectif est d'améliorer sa propre force relative, en se concentrant sur ses propres progrès. Une personne âgée qui parvient à réaliser 5 squats au poids du corps illustre parfaitement cette nature individuelle : pour elle, ces 5 squats constituent un véritable travail de force, mobilisant ses capacités musculaires maximales.",
      },
      {
        titre: "L'entraînement en force au service de l'autonomie",
        texte: "L'entraînement en force ne se limite pas à développer la masse musculaire : il joue un rôle clé dans l'entretien et l'amélioration de la fonction du système nerveux, contribuant à une meilleure qualité de vie et à un vieillissement en bonne santé. Il est essentiel pour maintenir l'autonomie dans la vieillesse : en renforçant l'élasticité des tissus, les muscles et la densification des os, il aide à prévenir les chutes et à maintenir la capacité à effectuer les tâches quotidiennes. Contrairement aux idées reçues, un entraînement en force bien structuré favorise un développement musculaire équilibré et fonctionnel, essentiel à la santé générale — indépendamment du sexe, de l'âge ou du niveau de forme physique.",
      },
    ],
  },
  {
    id: 'force-2',
    domaine: 'force',
    niveau: 2,
    titre: 'Tirage & chaîne postérieure',
    resume: "Suspension, tirages : rééquilibrer la chaîne postérieure, trop souvent sous-développée.",
    objectifPedagogique: "Développer une force de tirage autonome, complémentaire de la poussée travaillée au niveau 1.",
    groupesOutils: ['HC', 'SC'],
    objectifs: [
      { code: 'FRC', titre: 'Rowing Circle In', cible: '3 séries de 5 répétitions avec une technique d\'exécution parfaite.' },
    ],
    theorie: [
      {
        titre: 'Suspension et répulsion, un équilibre de forces',
        texte: "Dans la pratique du Mouvement, le travail en suspension (anneaux, barre, grimpe d'arbre) est équilibré par des mouvements en répulsion (locomotion, pompes, soulevé de terre, handstand). La suspension développe la force et la stabilité dans des positions défiant la gravité, tandis que la répulsion renforce la capacité à générer de la force contre une surface : ces deux aspects se complètent pour un développement musculaire et articulaire harmonieux. Les modes de vie sédentaires favorisent un déséquilibre musculaire où la chaîne postérieure est sous-développée comparativement à la chaîne antérieure — ce qui contribue à une posture affaiblie, des douleurs dorsales et des dysfonctionnements des épaules. Les exercices de tirage et de suspension sont cruciaux pour cibler ces muscles négligés : ils ne sont pas seulement importants pour les sportifs, mais aussi pour le grand public, car renforcer la chaîne postérieure améliore la posture, ce qui a un impact direct sur la respiration et, à son tour, sur la digestion et le bien-être général.",
      },
    ],
  },
  {
    id: 'force-3',
    domaine: 'force',
    niveau: 3,
    titre: 'Force organique & Strength Project',
    resume: "Sortir de l'alignement standard, vers l'appui unilatéral et la maîtrise totale du poids de corps.",
    objectifPedagogique: 'Rendre la force transférable et adaptable à toute situation, plutôt que dépendante de conditions d\'exécution fixes.',
    groupesOutils: ['HC', 'EP', 'SC'],
    objectifs: [],
    theorie: [
      {
        titre: "Le Strength Project",
        texte: "Un des fondements de la Voie de la Maîtrise est le « Strength Project », une étape cruciale qui ouvre la voie vers la force fonctionnelle. Cette progression se traduit par un travail méthodique sur les appuis au sol ou en suspension : de quatre appuis, puis trois, puis deux, et enfin un seul — représentant le sommet de l'entraînement en vue d'atteindre une maîtrise totale de son poids de corps. Cette progression vers l'effort unilatéral repose sur une compréhension profonde de la mécanique corporelle et de la manière dont les muscles interagissent pour produire une énergie utile, un mouvement fluide et puissant. Le point culminant — l'entraînement vers un appui au sol ou en suspension — demande un niveau de force, de contrôle et d'équilibre exceptionnel, où chaque muscle doit travailler en parfaite harmonie. Il est important de noter que cette progression ne repose pas que sur la force brute : elle développe également la stabilité articulaire, la mobilité fonctionnelle et la conscience corporelle.",
      },
      {
        titre: 'Force organique, sortir de l\'alignement',
        texte: "Le travail de force « organique » cherche à sortir de l'alignement standard en encourageant l'adaptation et l'organisation du corps à une situation donnée — l'objectif étant d'exprimer des qualités de force plus adaptables et moins dépendantes de conditions d'exécution fixes. C'est une force qui sait se réorganiser face à l'imprévu, plutôt qu'une force qui n'existe que dans une posture apprise.",
      },
    ],
  },
];

// --- Branche FLEXIBILITÉ -----------------------------------------------------

const FLEXIBILITE: NoeudCompetence[] = [
  {
    id: 'flexibilite-1',
    domaine: 'flexibilite',
    niveau: 1,
    titre: 'Flexibilité passive & mobilité de base',
    resume: "Étirements tenus, mobilité articulaire : forger une souplesse fonctionnelle, pas juste une amplitude.",
    objectifPedagogique: "Distinguer flexibilité et mobilité, et poser des bases de mobilité saines avant de chercher l'amplitude.",
    groupesOutils: ['MI', 'BC'],
    objectifs: [],
    theorie: [
      {
        titre: 'Flexibilité active, passive, balistique',
        texte: "La flexibilité est une composante essentielle de la condition physique, souvent comparée à la nature d'un bambou : un corps capable d'absorber des contraintes significatives et de revenir à sa forme originale sans subir de dommages. Cette qualité joue un rôle crucial dans la prévention des blessures et le bien-être général. La flexibilité active implique l'utilisation de la force musculaire pour maintenir une position étirée — elle renforce les connexions neuromusculaires et améliore la coordination. La flexibilité passive se concentre sur le relâchement et l'étirement des muscles sans contraction active, pratiquée à travers des étirements tenus pour de longues durées : elle est bénéfique pour la détente musculaire et la stimulation du système nerveux parasympathique. La flexibilité balistique implique des mouvements rebondissants pour pousser les muscles à s'étendre un peu plus loin à chaque rebond — utile pour la résilience des tissus, mais à pratiquer avec précaution.",
      },
      {
        titre: 'Distinguer flexibilité et mobilité',
        texte: "Bien qu'elles soient souvent utilisées de manière interchangeable, flexibilité et mobilité sont deux concepts distincts. La flexibilité se réfère spécifiquement à la capacité des muscles et des tissus conjonctifs à s'étendre, souvent sur des axes précis. La mobilité, elle, se concentre sur la capacité des articulations à se mouvoir librement et sans douleur dans toute leur amplitude. Les routines de mobilité articulaire, les routines musculaires structurales et les bases de locomotion contribuent toutes à une bonne mobilité.",
      },
    ],
  },
  {
    id: 'flexibilite-2',
    domaine: 'flexibilite',
    niveau: 2,
    titre: 'Ouverture & pont bas',
    resume: "Étirements et extensions du pont bas, équilibrés par un travail de fermeture.",
    objectifPedagogique: "Développer l'ouverture épaules-hanches nécessaire au pont, sans négliger le travail de fermeture qui l'équilibre.",
    groupesOutils: ['EP', 'MI', 'CV'],
    objectifs: [
      { code: 'FG3', titre: 'Pont bas', cible: '3 x 30 secondes d\'isométrie en pont bas, ou 10 répétitions de Bridge Push Up en pont bas.' },
    ],
    prerequis: [{ domaine: 'force', niveauMin: 1 }],
    theorie: [
      {
        titre: 'Ouverture et fermeture, harmonie des mouvements',
        texte: "Les mouvements d'ouverture — impliquant des étirements et des extensions — sont équilibrés par des mouvements de fermeture, tels que la flexion et la compression. Cette dualité assure que les muscles et les articulations ne sont pas seulement flexibles, mais aussi forts dans diverses gammes de mouvement, favorisant une mobilité saine et fonctionnelle. Devenir spécialiste d'un seul type de posture (par exemple la quadrupédie, en fermeture) entraînerait inévitablement un enroulement de la colonne vers l'avant et un développement disproportionné de la chaîne antérieure — d'où l'importance d'implémenter, en parallèle, un travail d'inversion, de back bend et de tirage en suspension.",
      },
    ],
  },
  {
    id: 'flexibilite-3',
    domaine: 'flexibilite',
    niveau: 3,
    titre: 'Pont haut & inversion',
    resume: "L'inversion défie l'équilibre habituel et complète la station debout.",
    objectifPedagogique: "Gagner en confort en renversement et préparer le travail d'inversion complète.",
    groupesOutils: ['CV', 'EP'],
    objectifs: [],
    theorie: [
      {
        titre: 'Inversion et station debout, perspectives complémentaires',
        texte: "L'inversion, telle que le handstand, offre une perspective unique et défie notre équilibre et notre perception habituelle. Elle est complétée par la station debout, notre état le plus naturel et fonctionnel. La pratique de l'inversion stimule le système vestibulaire et nos circulations, améliorant l'équilibre et la coordination, tandis que la station debout renforce notre capacité à nous ancrer et à interagir efficacement avec notre environnement. L'immobilité, comme dans les postures de yoga ou la méditation, est un contrepoids essentiel à la mobilité : elle permet la prise de conscience corporelle et la récupération, tandis que la mobilité active le corps et améliore la circulation. En évitant une spécialisation excessive et en embrassant cette diversité de pratiques, on favorise un développement harmonieux et on réduit les risques de blessures.",
      },
    ],
  },
];

// --- Branche LOCOMOTION -------------------------------------------------------

const LOCOMOTION: NoeudCompetence[] = [
  {
    id: 'locomotion-1',
    domaine: 'locomotion',
    niveau: 1,
    titre: 'Floor work & Bipédie',
    resume: 'Le travail au sol et le squat : les deux extrémités du spectre de la locomotion, socle de tout le reste.',
    objectifPedagogique: 'Ancrage, renforcement et mobilité du bas du corps ; recréer un lien avec le sol.',
    groupesOutils: ['BC', 'CV', 'MI'],
    objectifs: [
      { code: 'LC1', titre: 'Sit Work', cible: 'Mémoriser, réaliser et jouer avec la routine assise.' },
      { code: 'LC2', titre: 'Bipédie', cible: 'Mémoriser, réaliser et jouer avec les squats basiques.' },
    ],
    jeuxSuggeres: ['Jeux de Squat et Réflexes avec Bâton'],
    theorie: [
      {
        titre: 'Le Floor Work, la danse avec la gravité',
        texte: "Le Floor work, ou travail au sol, est une forme fondamentale de locomotion. À la manière d'un enfant, il implique des mouvements où le corps est en contact constant avec le sol, demandant une mobilité générale, particulièrement au niveau de la colonne vertébrale, des pieds, des chevilles et des hanches. Bien que la pression du sol sur les articulations puisse être inconfortable au début, elle offre en contrepartie un massage musculaire et favorise le décollement des adhérences tissulaires. Cette pratique développe la fluidité, la conscience profonde du corps et de ses interactions avec le sol.",
      },
      {
        titre: 'La Bipédie, le socle du Mouvement',
        texte: "Nous, les humains adultes, sommes aujourd'hui naturellement des bipèdes. La bipédie, centrée sur des mouvements comme les squats, a cet énorme avantage d'être accessible à tous et fondamentale pour développer de solides compétences physiques. Pour en tirer tous les bienfaits, elle se pratique de préférence pieds nus : elle renforce et améliore la mobilité des membres inférieurs, des érecteurs du rachis, tout en travaillant l'équilibre, la proprioception et la coordination. Les squats ne sont pas seulement un exercice en soi, mais aussi un chemin, une transition entre la position debout et les autres formes de locomotion plus proches du sol.",
      },
    ],
  },
  {
    id: 'locomotion-2',
    domaine: 'locomotion',
    niveau: 2,
    titre: 'Quadrupédie',
    resume: 'Appuis croisés, coordination ipsi/contro : le retour aux origines du mouvement.',
    objectifPedagogique: 'Coordination, renforcement, mobilité et résilience générale.',
    groupesOutils: ['MI', 'EP', 'SC'],
    objectifs: [
      { code: 'LC3', titre: 'Quadrupédie', cible: 'Mémoriser, réaliser et jouer avec les différents éléments de quadrupédie basique.' },
    ],
    jeuxSuggeres: ["Jeux d'Appuis", 'Jeux de Contact'],
    theorie: [
      {
        titre: 'La Quadrupédie, le retour aux origines',
        texte: "La quadrupédie, qui implique de se déplacer à quatre pattes (pieds et mains alternativement au sol), présente un niveau de difficulté supérieur au floor work et à la bipédie. Elle rappelle l'évolution du mouvement à quatre pattes chez l'enfant, exigeant coordination des hémisphères et latéralisation. Bien exécutée, elle renforce le corps dans son ensemble, en mettant l'accent sur la protraction des omoplates, les deltoïdes, les quadriceps et les fléchisseurs du rachis. Cependant, comme toute pratique en fermeture, elle nécessite un travail complémentaire d'inversion, de tirage et d'ouverture pour contrebalancer la tendance à l'enroulement de la colonne vertébrale liée au développement de la chaîne antérieure.",
      },
    ],
  },
  {
    id: 'locomotion-3',
    domaine: 'locomotion',
    niveau: 3,
    titre: 'Brachiation, Reptation & pratique environnementale',
    resume: "L'univers le plus riche de la locomotion : le déplacement par les bras, l'agilité du reptile, et le terrain comme partenaire.",
    objectifPedagogique: "Entrer dans l'univers sur les mains, développer un gainage exigeant en bras fléchis, et utiliser l'environnement comme terrain de jeu.",
    groupesOutils: ['HC', 'EP', 'AB'],
    objectifs: [
      { code: 'LC4', titre: 'Brachiation', cible: 'Mémoriser, réaliser et jouer avec les différents éléments de brachiation.' },
      { code: 'LC5', titre: 'Reptation', cible: 'Mémoriser, réaliser et jouer avec les différents éléments de reptation.' },
    ],
    jeuxSuggeres: ['Jeux de Perturbation', "Jeux d'Absorption"],
    prerequis: [{ domaine: 'force', niveauMin: 2 }],
    theorie: [
      {
        titre: "La Brachiation, l'évolution vers l'équilibre",
        texte: "La brachiation au sol, bien que souvent associée au mode de déplacement en suspension des singes arboricoles, se concentre ici sur le sens littéral du mot : le déplacement en utilisant les bras. C'est l'univers le plus intéressant et le plus riche de la locomotion — les transitions sur les mains offrent un maximum de combinaisons et de connexions possibles vers des mouvements de force ou d'acrobaties douces. Ce style met l'accent sur la flexion de la hanche, le gainage, et le travail de poussée des omoplates en flexion d'épaule. Il prépare efficacement au travail d'équilibre sur les mains, de press et de microbatie, et doit être complété par des exercices d'extension de la hanche et d'ouverture pour un développement harmonieux.",
      },
      {
        titre: "La Reptation, l'agilité du reptile",
        texte: "La reptation, ou déplacement reptilien, implique de se mouvoir au ras du sol sans que le corps ne touche vraiment sa surface. Ce style de mouvement développe une force considérable en poussée et a l'avantage d'entraîner aux mouvements utilisant les bras fléchis. Elle implique un gainage solide, une bonne flexion d'épaule ainsi que le renforcement des pectoraux et des rotateurs internes de l'épaule. La reptation a la particularité de générer, à la manière d'un lézard, un mouvement vertébral ondulatoire sur le plan coronal pour pouvoir avancer. C'est une pratique très exigeante et assez spécifique au Mouvement, popularisée par la méthode Ido Portal.",
      },
      {
        titre: 'La pratique environnementale, jeux en hauteur',
        texte: "La pratique environnementale englobe des activités comme la brachiation en suspension, l'ascension d'arbres, de roche ou de structure urbaine, l'équilibre et les déplacements sur des surfaces en hauteur — en bref, utiliser sa créativité pour se déplacer à l'aide des éléments de son environnement. Elle est particulièrement bénéfique pour contrecarrer les effets musculosquelettiques de la quadrupédie et de la brachiation (enroulement vertébral vers l'avant, flexion de hanches), en demandant un fort engagement de la chaîne postérieure. C'est l'une des rares occasions de décompresser efficacement les poignets, les épaules et la colonne vertébrale, ou simplement de lutter contre le tassement gravitaire.",
      },
    ],
  },
];

// --- Branche CONNEXION ---------------------------------------------------------

const CONNEXION: NoeudCompetence[] = [
  {
    id: 'connexion-1',
    domaine: 'connexion',
    niveau: 1,
    titre: 'Connexion externe & interne',
    resume: 'Dribbles de pieds et de mains : la matrice du mouvement, entre coordination et attention.',
    objectifPedagogique: "Acquérir une première base de coordination, d'habileté et de contrôle du rythme.",
    groupesOutils: ['MI', 'HC'],
    objectifs: [
      { code: 'CO1', titre: 'Dribbles de pieds 1', cible: 'Réalisez 30 rebonds enchaînés.' },
      { code: 'CO3', titre: 'Dribbles de mains 1', cible: 'Réalisez 30 rebonds enchaînés.' },
    ],
    theorie: [
      {
        titre: "La connexion, accélérateur de l'apprentissage",
        texte: "La connexion, un aspect crucial et commun à l'ensemble de l'univers du mouvement, est la compétence clé de l'apprentissage — elle constitue en quelque sorte la matrice du mouvement. Elle peut être considérée sous deux angles. La connexion externe, au niveau physiologique, implique l'optimisation du contrôle de l'influx nerveux pour améliorer le timing, la précision et la maîtrise des mouvements : coordonner les membres de manière indépendante, manipuler des objets avec adresse, synchroniser ses mouvements avec ceux d'autrui. La connexion interne se rapporte à la capacité de rester immobile et concentré, en se connectant profondément avec ses processus internes — la méditation, le yoga et les exercices de respiration en sont des exemples. En combinant ces deux aspects, les pratiquants atteignent un niveau de maîtrise et d'harmonie dans leurs mouvements, ainsi qu'une meilleure intégration entre le corps et l'esprit.",
      },
    ],
  },
  {
    id: 'connexion-2',
    domaine: 'connexion',
    niveau: 2,
    titre: 'Jeux de Touches & de Contact',
    resume: "Précision, mobilité et adaptabilité, en interaction directe avec un partenaire.",
    objectifPedagogique: 'Renforcer la stabilité et la conscience corporelle en situation dynamique.',
    groupesOutils: ['MI', 'BC'],
    jeuxSuggeres: ['Jeu de Touches', 'Jeu de Contact'],
    objectifs: [],
    theorie: [
      {
        titre: 'Le Jeu de Touches',
        texte: "Un des partenaires (le « facilitateur ») place sa main à un endroit précis et impose une touche statique de 3 secondes ; l'autre (le « travailleur ») doit toucher cette main avec une partie du corps imposée, sans déplacer ses pieds. Ce jeu permet de travailler à la fois la précision du mouvement, la capacité à s'adapter rapidement à une contrainte, et la gestion de l'équilibre et du gainage dans des contextes variés — debout, sur un pied, en quadrupédie, en pont, en frog stand, suspendu à une barre. Le facilitateur apprend, lui, à moduler la difficulté et à observer la manière dont son partenaire s'adapte.",
      },
      {
        titre: 'Le Jeu de Contact',
        texte: "Le facilitateur tient une balle et impose un point de contact permanent avec une partie du corps du travailleur, qui doit le maintenir tout en restant dans une posture définie au départ. Le facilitateur se déplace ensuite autour du travailleur pour modifier l'angle et les contraintes. Ce jeu reprend le principe du jeu de touches, mais en imposant un temps de travail plus long, une interaction continue et une nécessité de transitions et d'adaptations constantes — il développe l'endurance posturale et la capacité à gérer un effort dans la durée.",
      },
    ],
  },
  {
    id: 'connexion-3',
    domaine: 'connexion',
    niveau: 3,
    titre: "Jeux d'Appuis, de Perturbation et d'Absorption",
    resume: "Les jeux les plus subtils : gérer des forces extérieures sans les subir.",
    objectifPedagogique: "Développer la capacité à absorber et gérer une force externe sans la subir, un principe fondamental du Mouvement.",
    groupesOutils: ['MI', 'CV'],
    jeuxSuggeres: ["Jeux d'Appuis", 'Jeux de Perturbation', "Jeux d'Absorption"],
    objectifs: [],
    theorie: [
      {
        titre: "Le Jeu d'Absorption",
        texte: "Le facilitateur utilise ses bras pour dessiner lentement des vecteurs imaginaires, simulant des trajectoires de force traversant le corps du travailleur — des mouvements doux et continus, à la manière du Tai Chi. Le travailleur doit absorber ces contraintes sans se faire toucher, en mobilisant sa colonne vertébrale, ses hanches et son bas du corps, sans fuir ni accélérer, mais en trouvant un chemin organique pour absorber et rediriger. Ce jeu est une approche puissante pour affiner la conscience corporelle : plutôt que de subir une contrainte, il s'agit de l'intégrer, de l'accompagner et de la rediriger — un principe fondamental dans de nombreuses disciplines physiques et artistiques.",
      },
      {
        titre: 'Le Jeu de Perturbation',
        texte: "Le travailleur, les yeux fermés pour renforcer sa proprioception, doit absorber des pressions successives appliquées par le facilitateur sur quatre points clés — les deux épaules et les crêtes iliaques — sans bouger ses pieds du sol. Son but est de retrouver efficacement sa stabilité et sa position de départ après chaque pression, en ajustant sa structure corporelle de manière fluide. Ce jeu met l'accent sur l'ancrage, la souplesse et la capacité à s'adapter en temps réel aux forces appliquées par un partenaire.",
      },
    ],
  },
];

// --- Branche FIGURES (point de convergence) -----------------------------------

const FIGURES: NoeudCompetence[] = [
  {
    id: 'figures-1',
    domaine: 'figures',
    niveau: 1,
    titre: 'Frog Stand, première figure statique',
    resume: 'Compression active, équilibre sur les mains : la première porte vers les figures.',
    objectifPedagogique: "Maîtriser une première figure sur les mains, comprendre les mécanismes de l'équilibre, renforcer le centre et la résilience des poignets.",
    groupesOutils: ['EP', 'SC'],
    objectifs: [
      { code: 'FG1', titre: 'Frog Stand', cible: '3 x 30 secondes de Frog.' },
    ],
    prerequis: [{ domaine: 'force', niveauMin: 1 }, { domaine: 'connexion', niveauMin: 1 }],
    theorie: [
      {
        titre: 'Les figures : compétences de spécialiste au service du généraliste',
        texte: "L'établissement de standards et de niveaux de maîtrise est essentiel pour structurer l'apprentissage et mesurer les progrès. Les figures statiques sont la première étape de cette progression : maintenues en isométrie, les muscles y sont engagés sans mouvement apparent du corps. Ces postures exigeantes développent une force considérable, une stabilité et une endurance musculaire, ainsi qu'un contrôle et une précision exceptionnels. Elles servent de fondation solide pour des compétences plus avancées et aident à forger une discipline mentale et physique. Les standards servent d'indicateurs clés pour la progression : ils fournissent des objectifs clairs et mesurables, permettant aux pratiquants de se concentrer sur des améliorations spécifiques.",
      },
    ],
  },
  {
    id: 'figures-2',
    domaine: 'figures',
    niveau: 2,
    titre: 'L-Sit & Pont bas',
    resume: 'Fermeture de hanches et première figure de renversement.',
    objectifPedagogique: "Acquérir une fermeture de hanches de premier niveau et une première figure de renversement.",
    groupesOutils: ['EP', 'MI'],
    objectifs: [
      { code: 'FG2', titre: 'L-Sit', cible: '3 x 10 secondes de L-Sit.' },
    ],
    prerequis: [{ domaine: 'flexibilite', niveauMin: 2 }, { domaine: 'figures', niveauMin: 1 }],
    theorie: [
      {
        titre: 'Figures statiques et dynamiques : une fois maîtrisées, elles se réinjectent',
        texte: "Les figures dynamiques impliquent des transitions fluides et contrôlées entre différentes figures statiques ou mouvements — combinaisons au sol ou aux anneaux, passage d'une position de handstand à une autre posture. Elles nécessitent, en plus de la force et de la stabilité des figures statiques, une coordination, une agilité et une conscience spatiale accrues. Une fois maîtrisées, ces figures spécifiques sont réinjectées dans la pratique généraliste de la locomotion : cette intégration transforme des compétences isolées en un flux de mouvements plus complexe et expressif, renforçant la fluidité, la créativité et l'adaptabilité du pratiquant.",
      },
    ],
  },
  {
    id: 'figures-3',
    domaine: 'figures',
    niveau: 3,
    titre: 'Handstand & maîtrise du corps inversé',
    resume: "L'aboutissement des branches Force et Flexibilité : la maîtrise totale du corps inversé.",
    objectifPedagogique: "Porte d'entrée vers les figures sur les mains et les mouvements les plus dynamiques de locomotion.",
    groupesOutils: ['HC', 'EP', 'SC'],
    objectifs: [],
    prerequis: [{ domaine: 'force', niveauMin: 3 }, { domaine: 'flexibilite', niveauMin: 3 }, { domaine: 'figures', niveauMin: 2 }],
    theorie: [
      {
        titre: 'La fabrique du multivers : connecter les compétences',
        texte: "La « Voie de la Maîtrise » s'inscrit dans une perspective globale où chaque compétence acquise est une brique dans la construction d'un multivers de mouvements. Ce point de vue favorise la création de liens entre différents mouvements et domaines, encourageant le dépassement de soi, le transfert de compétences, la créativité et l'expression individuelle — toujours élargir le contenant que représente la pratique personnelle. Le handstand, aboutissement du travail de force organique et de flexibilité en inversion, n'est donc pas une fin en soi : c'est une porte vers un univers de mouvements encore plus vaste.",
      },
    ],
  },
];

export const ARBRE_COMPETENCES: NoeudCompetence[] = [...FORCE, ...FLEXIBILITE, ...LOCOMOTION, ...CONNEXION, ...FIGURES];

export function noeudsDuDomaine(domaine: Domaine): NoeudCompetence[] {
  return ARBRE_COMPETENCES.filter((n) => n.domaine === domaine).sort((a, b) => a.niveau - b.niveau);
}

// --- Logique de déverrouillage (fonction pure, pas d'accès DB) ------------

export function troncDeverrouille(noeud: NoeudTronc, idsAcquis: Set<string>): boolean {
  if (noeud.niveau === 1) return true;
  const precedent = TRONC_ARMURE_ORGANIQUE.find((t) => t.niveau === noeud.niveau - 1);
  return precedent ? idsAcquis.has(precedent.id) : true;
}

// Un nœud de branche est déverrouillé si : le tronc du MÊME niveau est
// acquis (le socle général doit être là), ET le niveau précédent de la
// MÊME branche est acquis (s'il existe), ET tous les prérequis inter-
// branches du nœud sont acquis.
export function estNoeudDeverrouille(noeud: NoeudCompetence, idsAcquis: Set<string>): boolean {
  const troncCorrespondant = TRONC_ARMURE_ORGANIQUE.find((t) => t.niveau === noeud.niveau);
  if (troncCorrespondant && !idsAcquis.has(troncCorrespondant.id)) return false;

  if (noeud.niveau > 1) {
    const precedent = ARBRE_COMPETENCES.find((n) => n.domaine === noeud.domaine && n.niveau === noeud.niveau - 1);
    if (precedent && !idsAcquis.has(precedent.id)) return false;
  }
  for (const prereq of noeud.prerequis ?? []) {
    const noeudsRequis = ARBRE_COMPETENCES.filter((n) => n.domaine === prereq.domaine && n.niveau === prereq.niveauMin);
    if (!noeudsRequis.some((n) => idsAcquis.has(n.id))) return false;
  }
  return true;
}

// Déroulé de séance type (repris de "Cours collectif").
export const STRUCTURE_SEANCE = [
  { etape: 'Accueil & intention du jour', detail: 'Fixer une intention claire, rappeler la logique de progression.' },
  { etape: 'Conditionnement général & spécifique', detail: 'Général : armure organique full body — Spécifique : mobilité/renfo ciblés, drill technique.' },
  { etape: 'Travail des objectifs de séance', detail: 'Selon la phase et les acquis : assise, bipédie, quadrupédie...' },
  { etape: 'Exploration & liens', detail: 'Hand transitions, assemblage (selon temps et niveau).' },
  { etape: 'Challenge / jeu', detail: 'Interaction, adaptation, imprévu, mise en situation.' },
  { etape: 'Retour au calme / intégration', detail: 'Respiration, verbalisation, recentrage.' },
] as const;
