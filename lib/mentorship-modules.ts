// lib/mentorship-modules.ts
//
// Programme Mentorship — structure en arbre (08/2026, v3).
//
// LE TRONC (Armure Organique) grimpe seul, niveau 1 -> 2 -> 3, strictement
// séquentiel. Les 5 BRANCHES (Force, Flexibilité, Locomotion, Connexion,
// Figures) restent toutes verrouillées tant que le tronc n'est pas validé
// EN ENTIER (niveau 3 acquis). Une fois ça fait, les 5 branches s'ouvrent
// en même temps, chacune démarrant à son niveau 1, et chaque branche
// progresse ensuite de façon indépendante des autres (pas de correspondance
// de niveau entre branches).
//
// Chaque niveau (tronc ou branche) est un petit module complet : théorie/
// philosophie, une programmation (cible + régression + progression, fidèle
// à la méthodologie de Sylvain), et un QCM propre à ce niveau.
//
// Parcours de validation d'un niveau déverrouillé :
//   1. L'élève lit la théorie, s'entraîne avec la programmation fournie.
//   2. Il passe le QCM de ce niveau -> doit le réussir pour débloquer
//      l'envoi de sa vidéo (le QCM sert de filtre : Sylvain ne regarde une
//      vidéo que si l'élève a prouvé qu'il maîtrise la théorie).
//   3. Il envoie le lien de sa vidéo -> Sylvain valide ou refuse.
//   4. Si validé, le niveau est acquis DÉFINITIVEMENT, le suivant se
//      débloque (ou les 5 branches s'ouvrent, si c'était le tronc niveau 3).
//
// Important — sécurité : les bonnes réponses des QCM (`bonneReponse`) ne
// doivent JAMAIS être envoyées au navigateur de l'élève. Ce fichier peut
// être importé côté serveur (page.tsx, actions.ts) sans problème ; avant de
// passer des données au composant client de l'arbre, utilise
// `noeudSansReponses()` pour les retirer. La correction du QCM se fait
// uniquement dans l'action serveur `repondreQCM`.

export type Domaine = 'force' | 'flexibilite' | 'locomotion' | 'connexion' | 'figures';
export type DomaineOuTronc = 'tronc' | Domaine;

export const DOMAINE_LABELS: Record<Domaine, string> = {
  force: 'Force',
  flexibilite: 'Flexibilité',
  locomotion: 'Locomotion',
  connexion: 'Connexion',
  figures: 'Figures',
};

// Palette dérivée du dégradé du site (lib/theme.ts : #FF3B30, #FF8A00,
// #FF2D78, #8B5CF6) — une couleur par branche, cohérente avec le reste du
// site plutôt qu'une palette arbitraire.
export const DOMAINE_COULEURS: Record<Domaine, string> = {
  force: '#FF3B30',
  flexibilite: '#FF6A3D',
  locomotion: '#FF8A00',
  connexion: '#FF2D78',
  figures: '#8B5CF6',
};
export const COULEUR_TRONC = '#f0a'; // accent déjà utilisé pour les CTA du site

export type FragmentTheorie = {
  titre: string;
  texte: string;
};

export type CiblesProgrammation = {
  cible: string;       // l'exercice/la compétence visée à ce niveau
  regression: string;  // variante plus accessible si la cible est hors de portée
  progression: string; // variante plus exigeante pour aller plus loin
};

export type QuestionQCM = {
  id: string;
  question: string;
  choix: string[];
  bonneReponse: number; // index dans `choix` — NE JAMAIS envoyer au client
};

// Version d'une question sans la bonne réponse, sûre à envoyer au navigateur.
export type QuestionQCMPublique = Omit<QuestionQCM, 'bonneReponse'>;

export type NoeudMentorship = {
  id: string; // slug stable, sert de clé de progression — ne pas changer une fois publié
  domaine: DomaineOuTronc;
  niveau: 1 | 2 | 3;
  titre: string;
  resume: string;
  objectifPedagogique: string;
  theorie: FragmentTheorie[];
  programmation: CiblesProgrammation[];
  qcm: QuestionQCM[];
  contenuDefini: boolean; // false = squelette provisoire, contenu à rédiger ensemble
};

export type NoeudMentorshipPublic = Omit<NoeudMentorship, 'qcm'> & { qcm: QuestionQCMPublique[] };

export function noeudSansReponses(noeud: NoeudMentorship): NoeudMentorshipPublic {
  return { ...noeud, qcm: noeud.qcm.map(({ bonneReponse, ...q }) => q) };
}

// --- TRONC : Armure Organique --------------------------------------------
// Contenu réel, repris et étoffé du programme Wix déjà capturé.

export const TRONC: NoeudMentorship[] = [
  {
    id: 'armure-1',
    domaine: 'tronc',
    niveau: 1,
    titre: 'Fondations',
    resume: 'Mobilité articulaire de base, respiration, conscience corporelle — le point de départ commun à tout le reste.',
    objectifPedagogique: "Préparer le corps et poser la posture d'apprentissage avant toute spécialisation.",
    theorie: [
      {
        titre: 'Pourquoi le Mouvement ?',
        texte: "Le Mouvement est une quête, une démarche de recherche et de développement personnel, un point de vue et une stratégie à la fois physique et mentale, axée sur l'apprentissage et l'acquisition d'expérience. Il n'existe pas de bon ou de mauvais mouvement dans l'absolu — seulement des mouvements que l'on est prêt à réaliser, et d'autres non. Le corps humain a été façonné par plusieurs millions d'années d'évolution en pleine nature, contre seulement quelques milliers d'années de vie sédentaire : il a conservé en mémoire l'ensemble de ses capacités originelles. La pratique du Mouvement freine notre inévitable dégénérescence, à condition d'être menée avec intelligence, dans une logique d'harmonie et de santé sur le long terme — ce qui n'est pas contradictoire avec la performance.",
      },
      {
        titre: "L'armure organique",
        texte: "Dans la quête de maîtrise et d'excellence en matière de mouvement, l'« armure organique » émerge comme une métaphore puissante. Elle symbolise l'ensemble des outils et routines articulaires et musculaires utiles dans un but donné — forgée non pas de métal, mais de muscles, d'os, de tendons, et d'une conscience aiguë du corps. Ce premier niveau pose les toutes premières pièces de cette armure : la mobilité de base et la capacité à sentir son corps.",
      },
      {
        titre: "La Mouvolution, phase de l'étudiant",
        texte: "La démarche d'apprentissage — la « Mouvolution » — se divise en trois phases. Ce premier niveau du tronc correspond à la phase de l'étudiant : étudier et pratiquer chaque secteur du Mouvement de manière isolée pour en comprendre les fondamentaux, en adoptant l'état d'esprit du débutant (le soshin), ouvert et avide d'expériences. Réalisée avec conscience et analyse, la répétition permet d'améliorer progressivement la qualité recherchée dans l'exécution d'une tâche.",
      },
    ],
    programmation: [
      {
        cible: 'Routine de mobilité articulaire complète (colonne, épaules, hanches, chevilles), 10 à 15 minutes',
        regression: 'Isoler 2-3 articulations par séance plutôt que la routine complète, à faible amplitude',
        progression: 'Ajouter du temps sous tension sur les fins d\'amplitude, ralentir chaque mouvement',
      },
    ],
    qcm: [
      {
        id: 'armure1-q1',
        question: "Selon la philosophie du Mouvement, existe-t-il de bons et de mauvais mouvements ?",
        choix: ["Oui, certains mouvements sont toujours à éviter", "Non — seulement des mouvements qu'on est prêt à réaliser ou non", "Seulement les mouvements dangereux sont mauvais"],
        bonneReponse: 1,
      },
      {
        id: 'armure1-q2',
        question: "Que symbolise l'« armure organique » ?",
        choix: ["Une protection statique et figée", "L'ensemble des outils et routines qu'on développe, en constante évolution", "Une seule routine fixe à répéter à vie"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
  },
  {
    id: 'armure-2',
    domaine: 'tronc',
    niveau: 2,
    titre: 'Consolidation',
    resume: "Le travail de fond devient méthodique : le cycle d'apprentissage structure la progression.",
    objectifPedagogique: 'Passer du subjectif (ce qui me convient) vers l\'objectif (ce qui est mesurable et progressif).',
    theorie: [
      {
        titre: 'Le travail de fond : du subjectif vers l\'objectif',
        texte: "L'importance du travail de fond dans une pratique de mouvement est capitale pour construire l'armure organique, visant la santé et la protection physique sur le long terme. Ce travail est d'abord subjectif, s'adaptant aux besoins et capacités individuelles de chacun. Par la suite, un travail plus objectif prend place, orienté vers des objectifs cibles personnels : le pratiquant commence à explorer le mouvement dans toute sa diversité, en fonction de ses projets.",
      },
      {
        titre: "Le cycle d'apprentissage",
        texte: "Le cycle se déroule en quatre temps. Fragmenter, c'est diviser un mouvement en fragments, chacun représentant une qualité sollicitée par son exécution, pour un travail isolé et ciblé. Assembler, c'est recréer des liens entre ces fragments, de la plus simple à la plus complexe combinaison. Injecter, c'est intégrer une compétence acquise dans la Locomotion, où elle devient réellement utilisable. Amplifier, c'est ajouter un cran de complexité par le jeu ou l'augmentation du niveau d'exigence.",
      },
    ],
    programmation: [
      {
        cible: 'Appliquer le cycle Fragmenter/Assembler sur une compétence personnelle au choix, sur 2 semaines',
        regression: 'Se limiter à Fragmenter seul (isoler et travailler une qualité) sans chercher à assembler encore',
        progression: 'Aller jusqu\'à Injecter : intégrer la compétence fragmentée dans un mouvement de locomotion libre',
      },
    ],
    qcm: [
      {
        id: 'armure2-q1',
        question: "Dans le cycle d'apprentissage, que signifie « Fragmenter » ?",
        choix: ["Répéter un mouvement complet en boucle", "Diviser un mouvement en qualités isolées à travailler spécifiquement", "Passer directement à la compétition"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
  },
  {
    id: 'armure-3',
    domaine: 'tronc',
    niveau: 3,
    titre: 'Intégration',
    resume: "L'armure organique devient un système vivant : chaque compétence se relie aux autres.",
    objectifPedagogique: 'Entrer dans la phase de l\'artisan : relier les domaines plutôt que les juxtaposer.',
    theorie: [
      {
        titre: 'La Mouvolution, phase du chercheur puis de l\'artisan',
        texte: "Dans la phase du chercheur, on établit des liens et des connexions entre chacun des domaines étudiés précédemment. Puis vient la phase de l'artisan, qui entremêle complètement les compétences et les secteurs, en pratiquant pleinement la transversalité, avec une dimension plus libre et artistique.",
      },
      {
        titre: 'La fabrique du multivers',
        texte: "À ce stade, l'armure organique s'inscrit dans une perspective globale où chaque compétence acquise devient une brique dans la construction d'un multivers de mouvements, favorisant le dépassement de soi, le transfert de compétences et la créativité. C'est ce niveau d'intégration qui rend accessibles les cinq branches spécialisées.",
      },
    ],
    programmation: [
      {
        cible: 'Séance libre de 20 minutes reliant au moins 3 qualités travaillées aux niveaux 1 et 2 (mobilité + une compétence fragmentée + un enchaînement libre)',
        regression: 'Relier seulement 2 qualités plutôt que 3, avec des transitions guidées',
        progression: 'Improviser l\'enchaînement sans plan préétabli, en s\'adaptant en temps réel',
      },
    ],
    qcm: [
      {
        id: 'armure3-q1',
        question: "Que caractérise la phase de l'artisan dans la Mouvolution ?",
        choix: ["L'étude isolée de chaque secteur", "La transversalité et l'expression libre et créative", "L'arrêt de la pratique une fois les bases acquises"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
  },
];

// --- BRANCHES ---------------------------------------------------------------
// Squelette pour l'instant (contenuDefini: false) : titres et résumés
// provisoires. Théorie, programmation et QCM à rédiger ensemble, branche
// par branche, une fois le tronc et le visuel validés.

function squelette(domaine: Domaine, niveau: 1 | 2 | 3, titre: string, resume: string): NoeudMentorship {
  return {
    id: `${domaine}-${niveau}`,
    domaine,
    niveau,
    titre,
    resume,
    objectifPedagogique: 'À définir ensemble.',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
  };
}

const FORCE: NoeudMentorship[] = [
  squelette('force', 1, 'Force — niveau 1', 'Contenu à définir ensemble.'),
  squelette('force', 2, 'Force — niveau 2', 'Contenu à définir ensemble.'),
  squelette('force', 3, 'Force — niveau 3', 'Contenu à définir ensemble.'),
];
const FLEXIBILITE: NoeudMentorship[] = [
  squelette('flexibilite', 1, 'Flexibilité — niveau 1', 'Contenu à définir ensemble.'),
  squelette('flexibilite', 2, 'Flexibilité — niveau 2', 'Contenu à définir ensemble.'),
  squelette('flexibilite', 3, 'Flexibilité — niveau 3', 'Contenu à définir ensemble.'),
];
const LOCOMOTION: NoeudMentorship[] = [
  squelette('locomotion', 1, 'Locomotion — niveau 1', 'Contenu à définir ensemble.'),
  squelette('locomotion', 2, 'Locomotion — niveau 2', 'Contenu à définir ensemble.'),
  squelette('locomotion', 3, 'Locomotion — niveau 3', 'Contenu à définir ensemble.'),
];
const CONNEXION: NoeudMentorship[] = [
  squelette('connexion', 1, 'Connexion — niveau 1', 'Contenu à définir ensemble.'),
  squelette('connexion', 2, 'Connexion — niveau 2', 'Contenu à définir ensemble.'),
  squelette('connexion', 3, 'Connexion — niveau 3', 'Contenu à définir ensemble.'),
];
const FIGURES: NoeudMentorship[] = [
  squelette('figures', 1, 'Figures — niveau 1', 'Contenu à définir ensemble.'),
  squelette('figures', 2, 'Figures — niveau 2', 'Contenu à définir ensemble.'),
  squelette('figures', 3, 'Figures — niveau 3', 'Contenu à définir ensemble.'),
];

export const BRANCHES: NoeudMentorship[] = [...FORCE, ...FLEXIBILITE, ...LOCOMOTION, ...CONNEXION, ...FIGURES];
export const TOUS_LES_NOEUDS: NoeudMentorship[] = [...TRONC, ...BRANCHES];

export const ORDRE_DOMAINES: Domaine[] = ['force', 'flexibilite', 'locomotion', 'connexion', 'figures'];

export function noeudsDeLaBranche(branche: DomaineOuTronc): NoeudMentorship[] {
  return TOUS_LES_NOEUDS.filter((n) => n.domaine === branche).sort((a, b) => a.niveau - b.niveau);
}

// --- Logique de déverrouillage (fonction pure, pas d'accès DB) ------------
// idsAcquis : ensemble des ids de nœuds au statut "acquis" pour l'élève.

export function troncComplet(idsAcquis: Set<string>): boolean {
  return TRONC.every((n) => idsAcquis.has(n.id));
}

export function estNoeudDeverrouille(noeud: NoeudMentorship, idsAcquis: Set<string>): boolean {
  if (noeud.domaine === 'tronc') {
    if (noeud.niveau === 1) return true;
    const precedent = TRONC.find((n) => n.niveau === noeud.niveau - 1);
    return precedent ? idsAcquis.has(precedent.id) : true;
  }
  // Nœud d'une branche : verrouillé tant que le tronc n'est pas complet.
  if (!troncComplet(idsAcquis)) return false;
  if (noeud.niveau === 1) return true;
  const precedent = BRANCHES.find((n) => n.domaine === noeud.domaine && n.niveau === noeud.niveau - 1);
  return precedent ? idsAcquis.has(precedent.id) : true;
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
