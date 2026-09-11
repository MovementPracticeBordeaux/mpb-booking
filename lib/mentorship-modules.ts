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
//
// --- Nœuds à exercices indépendants (branches, v4 — 08/2026) --------------
// Un nœud de branche peut, en plus (ou au lieu) du modèle vidéo unique
// hérité du tronc, définir une liste `exercices` : chacun est validé
// indépendamment (sa propre vidéo, son propre statut acquis/en_attente/
// refusé côté `mentorship_progression`, sous la clé composite
// `${noeud.id}::${exercice.id}` comme `module_id`). Le nœud est considéré
// acquis quand TOUS ses `exercices` sont acquis.
//
// `progressionBonus` est la liste optionnelle des exercices "en plus" :
// ils ne bloquent/débloquent rien, mais rapportent un supplément d'XP et
// alimentent la "flamme" du nœud (voir plus bas). Même mécanique de
// validation indépendante que les exercices obligatoires.

export type Domaine = 'force' | 'flexibilite' | 'locomotion' | 'connexion' | 'figures';
export type DomaineOuTronc = 'tronc' | Domaine;

export const DOMAINE_LABELS: Record<Domaine, string> = {
  force: 'Force',
  flexibilite: 'Flexibilité',
  locomotion: 'Locomotion',
  connexion: 'Connexion',
  figures: 'Figures',
};

// Courte accroche par branche, affichée sous l'icône en haut de chaque
// colonne de l'arbre — donne un repère immédiat sur ce que couvre la branche.
export const DOMAINE_ACCROCHES: Record<Domaine, string> = {
  force: 'Puissance, gainage et contrôle',
  flexibilite: 'Amplitude, souplesse et relâchement',
  locomotion: 'Déplacement, flow et créativité',
  connexion: 'Mobilité, conscience corporelle et contrôle',
  figures: 'Maîtrise technique et équilibre',
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
export const COULEUR_TRONC = '#ff00aa'; // accent déjà utilisé pour les CTA du site

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

// Un exercice validable indépendamment à l'intérieur d'un nœud de branche.
export type ExerciceMentorship = {
  id: string; // slug unique DANS le nœud (ex. 'pushup-ring') — combiné à l'id du nœud pour la clé de progression
  nom: string;
  videoUrl: string;
  note?: string; // précision libre (ex. "à filmer", variante retenue, etc.)
  consigne?: string; // comment exécuter l'exercice — affiché à l'élève
  critereValidation?: string; // ce qui doit être visible pour que le coach valide — affiché à l'élève ET au coach
  theme?: 'recuperation' | 'force' | 'mobilite'; // regroupement visuel dans le panneau. 'recuperation' = outil santé
  // (respiration, système nerveux...), jamais soumis à validation : pas de pastille de statut, pas de formulaire de
  // soumission, non compté dans le X/Y validés. Sans theme, l'exercice reste dans la liste générale validée.
  outils?: { nom: string; videoUrl: string }[]; // outils de soutien spécifiquement recommandés pour CET objectif
  // (ex. Deep squat -> Flexion de cheville + Stretch mollet) -- distincts des exercices eux-mêmes : jamais soumis
  // à validation, juste des liens vidéo affichés en complément pour aider à progresser vers l'objectif.
};

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
  // Modèle "exercices indépendants" (branches, v4). Absent/vide = le nœud
  // suit encore l'ancien modèle à validation vidéo unique (tronc).
  exercices?: ExerciceMentorship[];
  progressionBonus?: ExerciceMentorship[];
  // Pastille visuelle dédiée à ce nœud précis (chemin dans /public), en
  // remplacement du pictogramme générique de la branche une fois le nœud
  // déverrouillé. Optionnel — objectif à terme : une pastille par nœud.
  image?: string;
};

// module_id composite utilisé dans `mentorship_progression` pour un exercice
// donné d'un nœud à exercices indépendants.
export function moduleIdExercice(noeud: NoeudMentorship | NoeudMentorshipPublic, exercice: ExerciceMentorship): string {
  return `${noeud.id}::${exercice.id}`;
}

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
        titre: 'Qu\'est-ce que le Mouvement ?',
        texte: "Le Mouvement est une quête, une démarche de recherche et de développement personnel, un point de vue et une stratégie originale à la fois physique et mentale, axée sur l'apprentissage et l'acquisition d'expérience. Peut-on le qualifier de pratique ou de discipline ? Oui, car il se distingue par sa démarche, sa communauté, et un domaine de pratique fortement identitaire : la Locomotion. Mais il reste aussi difficile à catégoriser, du fait de sa grande diversité de formes et de sa capacité de mutation. Une chose est sûre : il n'existe pas de bon ou de mauvais mouvement dans l'absolu — seulement des mouvements que nous sommes prêts à réaliser, et d'autres non.",
      },
      {
        titre: 'Pourquoi bouger ?',
        texte: "Comme le souligne Daniel Goleman dans « L'intelligence émotionnelle », le mot émotion se compose du verbe latin motere, « mouvoir », et du préfixe é-, qui indique un mouvement vers l'extérieur : nos émotions nous poussent à agir, comme un moteur qui nous mettrait en mouvement. Mais les stimulus qui poussaient nos ancêtres à agir ne sont plus d'actualité pour la plupart d'entre nous aujourd'hui, ce qui crée une perte de repères aux conséquences autant mentales (gestion émotionnelle, troubles de l'apprentissage) que physiques (sédentarité, pathologies articulaires précoces). Notre corps a pourtant été façonné par plusieurs millions d'années d'évolution en pleine nature, contre seulement quelques centaines d'années de vie moderne : il a conservé en mémoire l'ensemble de ses capacités originelles. Comme le résume Ido Portal : « Move because you can ! »",
      },
      {
        titre: 'Les bienfaits du Mouvement',
        texte: "Le mouvement stimule activement nos circulations — vasculaire (le squat est l'un des plus grands effets de pompe sanguine de l'organisme), lymphatique (balanciers, sauts). Au niveau cérébral, il stimule notre production hormonale, entretient la myéline de notre réseau nerveux et la matière grise du cerveau, nous rendant plus adaptables, réactifs et créatifs. Il redonne également de l'élasticité à nos tissus conjonctifs, élargit le diamètre de nos tendons et augmente notre densité osseuse — un effet aujourd'hui bien documenté : plusieurs méta-analyses récentes confirment que le travail contre résistance améliore mesurablement la densité minérale osseuse chez les seniors, notamment à la hanche et à la colonne. Le Mouvement freine ainsi notre inévitable dégénérescence, pratiqué avec intelligence, dans une logique de santé sur le long terme — ce qui n'est pas contradictoire avec la performance.",
      },
      {
        titre: "L'armure organique : la métaphore du forgeron",
        texte: "Les mains d'un forgeron s'adaptent au fil du temps à son travail : des callosités se forment en réponse aux frictions répétées, un renforcement musculaire se développe dans les mains, les poignets et les avant-bras. Ses mains deviennent un mélange de rigidité, nécessaire pour tenir fermement les outils, et de souplesse, pour effectuer des tâches délicates. C'est exactement cette dynamique d'adaptation que symbolise l'« armure organique » : le terme « armure » (du latin armatura) évoque une protection, un rempart contre les agressions extérieures ; « organique » (du grec organikos) évoque ce qui est vivant, capable de croître et de s'adapter. L'armure organique n'est donc pas une protection statique, mais un système dynamique, forgé non pas de métal mais de muscles, d'os, de tendons et d'une conscience aiguë du corps. Ce premier niveau pose les toutes premières pièces de cette armure.",
      },
    ],
    programmation: [
      {
        cible: "Routine complète (santé des épaules, élastique) + un exercice de respiration, chaque jour — 10 à 15 minutes",
        regression: "Isoler 2-3 exercices de la routine plutôt que l'ensemble, à faible amplitude",
        progression: "Ajouter du temps sous tension sur les fins d'amplitude, ralentir chaque mouvement",
      },
    ],
    exercices: [
      {
        id: 'standing-actif-1', nom: 'Standing actif 1', videoUrl: 'https://youtu.be/Vfc57qvPhQo',
        consigne: "Position debout, ancré, en réalisant les transitions et engagements proposés dans la vidéo avec lenteur et contrôle — sans précipitation.",
        critereValidation: "Tenue stable sur toute la séquence, sans perte d'équilibre ni précipitation dans les transitions.",
        theme: 'recuperation',
      },
      {
        id: 'perfect-breath', nom: 'The perfect breath', videoUrl: 'https://youtu.be/EuTvBdpUbWc',
        consigne: "Respiration diaphragmatique lente, inspiration par le nez, expiration longue et contrôlée. Rechercher le calme, pas la performance.",
        critereValidation: "5 minutes de pratique continue, respiration fluide et régulière, sans tension au niveau des épaules ou du cou.",
        theme: 'recuperation',
      },
      {
        id: 'deep-squat', nom: 'Deep squat', videoUrl: 'https://youtu.be/9PJymG3sedc',
        consigne: "Squat complet, talons au sol, buste le plus vertical possible — rester assis dans la position sans forcer.",
        critereValidation: "3 séries de 5 minutes cumulées en position, talons au sol en permanence, sans douleur articulaire.",
        theme: 'mobilite',
        outils: [
          { nom: 'Flexion active de cheville', videoUrl: 'https://youtu.be/Q6CHGnGFJRM' },
          { nom: 'Mollets - stretch actif', videoUrl: 'https://youtu.be/xM9sP2J1d6E' },
          { nom: 'Floor mobility training - introduction', videoUrl: 'https://youtu.be/6ETL4STnuJM' },
          { nom: 'Routine bas du corps', videoUrl: 'https://youtu.be/MQcmU9BQAGY' },
        ],
      },
      {
        id: 'scap-pushup-support', nom: 'Scap push up (protraction) sur support', videoUrl: 'https://youtu.be/GlfSSKJpU-k',
        consigne: "Bras tendus en appui sur support, mouvement isolé au niveau des omoplates (protraction/rétraction), sans plier les coudes.",
        critereValidation: "3 séries de 10 répétitions, mouvement localisé aux omoplates, coudes qui restent tendus tout du long.",
        theme: 'force',
        outils: [
          { nom: 'Routine haut du corps', videoUrl: 'https://youtu.be/V6JDf7t7vPQ' },
          { nom: 'Renforcement et santé des épaules', videoUrl: 'https://youtu.be/gdIxt_m35VE' },
          { nom: 'Push up excentrique genoux', videoUrl: 'https://youtu.be/lmGSzEfYHkE' },
        ],
      },
      {
        id: 'hollow-hold', nom: 'Hollow hold', videoUrl: 'https://youtu.be/axUNfJyWgWc',
        consigne: "Bas du dos plaqué au sol en permanence, jambes et bras tendus et légèrement décollés — respirer sans relâcher la position.",
        critereValidation: "3 séries de 30 secondes, bas du dos qui ne décolle jamais du sol.",
        theme: 'force',
        outils: [{ nom: 'Rowing bûcheron', videoUrl: 'https://youtu.be/SNBddEEl1UE' }],
      },
      {
        id: 'suspension-active-passive-1', nom: 'Suspension active / passive', videoUrl: 'https://youtu.be/1lpOQnht9jI',
        consigne: "Alterner suspension active (épaule engagée) et passive (relâchée), en gardant le contrôle sur les transitions.",
        critereValidation: "3 séries de 10 répétitions, transitions actif/passif contrôlées, sans à-coup.",
        theme: 'force',
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
        question: "Quelles sont les 5 qualités de l'armure organique ?",
        choix: ["Vitesse, puissance, endurance, agilité, souplesse", "Structure, Équilibre, Flexibilité, Résilience, Connexion", "Force, poids, taille, âge, expérience"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
    image: '/mentorship/armure-organique.jpg',
  },
  {
    id: 'armure-2',
    domaine: 'tronc',
    niveau: 2,
    titre: 'Consolidation',
    resume: "Le travail de fond devient méthodique : le cycle d'apprentissage structure la progression.",
    objectifPedagogique: "Passer du subjectif (ce qui me convient) vers l'objectif (ce qui est mesurable et progressif).",
    theorie: [
      {
        titre: "Les cinq qualités de l'armure organique",
        texte: "L'armure organique se compose de cinq qualités. La Structure : une densité osseuse importante et une masse musculaire structurelle (muscles profonds) dense et tonique. L'Équilibre : une masse musculaire « utile », apportant une tenségrité optimale et harmonieuse. La Flexibilité : un corps capable de se déformer, de se plier et de s'étirer de multiples façons. La Résilience : un corps capable de résister à de fortes contraintes puis de retrouver son état d'équilibre. La Connexion : un corps « disponible » dont chacune des parties peut être ressentie et utilisée indépendamment, alternativement ou simultanément, avec la plus grande vivacité ou la plus grande lenteur.",
      },
      {
        titre: 'Le travail de fond : du subjectif vers l\'objectif',
        texte: "Le travail de fond est d'abord subjectif, s'adaptant aux besoins et capacités individuelles de chacun. Il est comparable à l'œuvre qui se transforme sous les mains du forgeron : chaque coup de marteau, répété des centaines de fois, contribue à la forme finale. De la même façon, tes routines articulaires et musculaires doivent être exécutées avec une grande régularité pour développer les qualités physiques souhaitées — elles sont la base sur laquelle repose la progression future. Par la suite, un travail plus objectif prend place, orienté vers des objectifs cibles personnels : le pratiquant commence à explorer le mouvement dans toute sa diversité, en fonction de ses projets.",
      },
      {
        titre: 'Le travail en profondeur',
        texte: "Quel est le point commun entre un musicien professionnel, un sportif de haut niveau et un artiste peintre ? Le travail approfondi. Bâtir des compétences solides fait appel à un procédé inspiré de l'évolution biologique elle-même : la répétition (test/erreur/test/erreur…). Réalisée avec conscience et analyse, elle permet d'améliorer progressivement la qualité recherchée dans l'exécution d'une tâche — on parle de myélinisation des réseaux nerveux sollicités par l'action répétée. Une pratique désorganisée et irrégulière n'a jamais entraîné de résultats probants.",
      },
      {
        titre: "L'état d'esprit du débutant",
        texte: "L'état d'esprit du débutant (le soshin), ouvert et avide d'expériences, doit rester actif dans ta manière d'aborder la pratique. De même qu'on ne juge pas un débutant en apprentissage, un débutant ne devrait pas se juger lui-même et oublier d'où il vient. Une réussite se construit et sera toujours le fruit d'un travail — donc de nombreuses erreurs.",
      },
      {
        titre: 'Une bibliothèque qui grandit',
        texte: "À ce niveau, ta pratique de récupération et de bien-être s'enrichit : chaque nouvel outil rejoint ceux déjà acquis, pour te constituer une véritable bibliothèque de routines mobilisables selon ton besoin du moment — pas un remplacement du travail précédent, mais un ajout.",
      },
    ],
    programmation: [
      {
        cible: "Ajouter les nouveaux outils (bâton, balancier, routine assise) à ta pratique quotidienne existante, sur 2 semaines",
        regression: "Se limiter à intégrer un seul nouvel outil à la fois plutôt que tous simultanément",
        progression: "Enchaîner deux outils différents sans pause entre eux (chunk), en gardant la qualité d'exécution",
      },
    ],
    exercices: [
      {
        id: 'balancier', nom: 'Balancier', videoUrl: 'https://youtu.be/vHKC_KQsRWE',
        consigne: "Mouvement de balancier contrôlé, en gardant le tronc stable — l'amplitude vient des épaules et des hanches, pas d'un déséquilibre du corps.",
        critereValidation: "Séquence réalisée avec fluidité, sans perte de contrôle ni compensation du bas du dos.",
        theme: 'recuperation',
      },
      {
        id: 'angola-pu', nom: 'Angola PU', videoUrl: 'https://youtu.be/1jRXZLwnO7A',
        consigne: "Variante de push-up plus exigeante que la version genoux — amplitude complète, corps aligné, descente contrôlée.",
        critereValidation: "6 répétitions consécutives, amplitude complète, alignement du corps maintenu sans affaissement des hanches.",
        theme: 'force',
        outils: [
          { nom: 'LU raise wall', videoUrl: 'https://youtu.be/pRaD7ypSONs' },
          { nom: 'Elevation latérale haltère au sol', videoUrl: 'https://youtu.be/U-R8rIaQs84' },
          { nom: 'Rotation cubaine', videoUrl: 'https://youtu.be/FjnxcbgCy_8' },
          { nom: 'Dips scap à la barre', videoUrl: 'https://youtu.be/-LgdBltlUvY' },
        ],
      },
      {
        id: 'entree-rotation-pont', nom: 'Entrée en rotation sur le pont', videoUrl: 'https://youtu.be/f6-YFDBT2MA',
        consigne: "Combine l'entrée sur le pont avec la rotation — mouvement fluide, sans à-coup à l'entrée.",
        critereValidation: "Entrée réalisée avec contrôle, sans chute ni compensation, des deux côtés.",
        theme: 'mobilite',
        outils: [
          { nom: 'Trap raise 3 - 45°', videoUrl: 'https://youtu.be/FjzjHU2BrvA' },
          { nom: 'Parachutiste', videoUrl: 'https://youtu.be/VKYkH9mjj2I' },
        ],
      },
      {
        id: 'fragment-stretch-actif', nom: 'Fragment stretch actif', videoUrl: 'https://youtu.be/rRXI-rQXMBc',
        consigne: "Chaque position tenue activement (le muscle travaille pour maintenir l'amplitude, pas juste relâché) — respiration continue pendant la tenue.",
        critereValidation: "Chaque position tenue au moins 15 secondes en restant actif, sans tremblement excessif ni retenue du souffle.",
        theme: 'mobilite',
      },
      {
        id: 'routine-assise-complete', nom: 'Routine assise complète', videoUrl: 'https://youtu.be/x2hWwXRc8tA',
        consigne: "Routine complète au sol, transitions fluides, en gardant un contact conscient avec le sol à chaque instant.",
        critereValidation: "Routine réalisée en entier sans interruption, transitions maîtrisées.",
        theme: 'mobilite',
      },
      {
        id: 'suspension-active-passive-2', nom: 'Suspension passive', videoUrl: 'https://youtu.be/1lpOQnht9jI',
        consigne: "Suspension relâchée, épaule engagée passivement — pas de tension active recherchée ici, juste un relâchement contrôlé.",
        critereValidation: "60 secondes de maintien, sans douleur ni compensation.",
        theme: 'force',
      },
    ],
    qcm: [
      {
        id: 'armure2-q1',
        question: "Dans le cycle d'apprentissage, que signifie « Fragmenter » ?",
        choix: ["Répéter un mouvement complet en boucle", "Diviser un mouvement en qualités isolées à travailler spécifiquement", "Passer directement à la compétition"],
        bonneReponse: 1,
      },
      {
        id: 'armure2-q2',
        question: "Qu'est-ce qu'un « chunk » dans le cycle d'apprentissage ?",
        choix: ["Un mouvement isolé travaillé seul", "La fusion de 2 à 3 mouvements en une seule unité", "Un exercice de respiration"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
    image: '/mentorship/armure-organique.jpg',
  },
  {
    id: 'armure-3',
    domaine: 'tronc',
    niveau: 3,
    titre: 'Intégration',
    resume: "L'armure organique devient un système vivant : chaque compétence se relie aux autres, et ouvre la porte aux cinq branches.",
    objectifPedagogique: "Entrer dans la phase de l'artisan : relier les domaines, et se préparer concrètement à l'entrée dans les branches spécialisées.",
    theorie: [
      {
        titre: "La Mouvolution, phase du chercheur puis de l'artisan",
        texte: "Dans la phase du chercheur, la démarche évolue : on établit des liens et des connexions entre chacun des domaines étudiés précédemment — Force, Flexibilité, Locomotion, Connexion — en explorant comment ces secteurs s'influencent mutuellement et peuvent s'intégrer de manière harmonieuse. Puis vient la phase de l'artisan, qui entremêle complètement les compétences et les secteurs, en pratiquant pleinement la transversalité, avec une dimension plus libre et artistique — jusqu'à interagir de manière fluide avec son corps et son environnement, tout en exprimant librement sa propre identité.",
      },
      {
        titre: 'La fabrique du multivers',
        texte: "À ce stade, l'armure organique s'inscrit dans une perspective globale où chaque compétence acquise devient une brique dans la construction d'un multivers de mouvements, favorisant le dépassement de soi, le transfert de compétences et la créativité.",
      },
      {
        titre: 'Ouvrir des portes',
        texte: "L'armure organique a pour but d'ouvrir des portes. L'exploration commence par l'acquisition de compétences fondamentales, des tremplins vers des objectifs plus avancés — les « Grandes Portes » de ton parcours. Ce niveau termine cette phase : il rend abordables, en même temps, les premiers objectifs des cinq branches. C'est pour cela qu'une fois l'armure organique complète, tu débloques le niveau 1 de Force, Figures, Flexibilité, Locomotion et Connexion en même temps — pas une branche après l'autre.",
      },
    ],
    programmation: [
      {
        cible: "Routine complète (bien-être + force + mobilité) enchaînée en une seule séance de 25-30 minutes, sans pause entre les blocs",
        regression: "Garder une courte pause entre chaque bloc (bien-être / force / mobilité)",
        progression: "Enchaîner deux exercices de blocs différents sans transition (chunk), en gardant la qualité d'exécution",
      },
    ],
    exercices: [
      {
        id: 'uddiyana-bandha', nom: 'Uddiyana bandha', videoUrl: 'https://youtu.be/8wxUZdLyYBY',
        consigne: "À jeun de préférence, expiration complète puis rétraction abdominale — jamais en force, jamais en apnée prolongée si inconfort.",
        critereValidation: "Technique maîtrisée et confortable, sans vertige ni gêne — la régularité prime sur la durée.",
        theme: 'recuperation',
      },
      {
        id: 'push-up-clean', nom: 'Push up clean (triceps push up)', videoUrl: 'https://youtu.be/ODwUMicVonw',
        consigne: "Le vrai push-up complet : mains sous les épaules, corps aligné de la tête aux pieds, amplitude complète (poitrine proche du sol).",
        critereValidation: "1 série de 15 répétitions, technique d'exécution parfaite, amplitude complète, alignement maintenu du début à la fin.",
        theme: 'force',
        outils: [
          { nom: 'Trap raise 3 90°', videoUrl: 'https://youtu.be/BeTsJhg6JXI' },
          { nom: 'Rotateurs ext sleeper', videoUrl: 'https://youtu.be/Yc_Z1A0lyj0' },
          { nom: 'Iso dips (anneaux)', videoUrl: 'https://youtu.be/6Ols9v6UA0I' },
        ],
      },
      {
        id: 'rowing-circle-inside', nom: 'Rowing circle - inside', videoUrl: 'https://youtu.be/Ksd3whqPvZ0',
        consigne: "Tirage contrôlé en trajectoire circulaire, buste stable, sans élan du corps pour aider le mouvement.",
        critereValidation: "3 séries de 5 répétitions, technique d'exécution parfaite, sans élan.",
        theme: 'force',
        outils: [{ nom: 'Rowing anneaux', videoUrl: 'https://youtu.be/XzIFzhI-lrU' }],
      },
      {
        id: 'play-with-routine-assise', nom: 'Play with : routine assise', videoUrl: 'https://youtu.be/5eFKp3f8OXY',
        consigne: "Reprendre le vocabulaire de la routine assise en l'enchaînant avec fluidité et un peu de liberté d'exploration, sans figer le mouvement.",
        critereValidation: "Séquence enchaînée avec fluidité, transitions non figées, sans temps mort entre les éléments.",
        theme: 'mobilite',
        outils: [{ nom: 'Quadrupédie - basic work', videoUrl: 'https://youtu.be/YjzgKF-855o' }],
      },
      {
        id: 'routine-stretch-actif-full', nom: 'Routine stretch actif 1 full', videoUrl: 'https://youtu.be/0XyyLXF1tAo',
        consigne: "Routine complète, chaque position tenue activement avec un engagement musculaire réel, pas juste relâché en bout d'amplitude.",
        critereValidation: "Routine réalisée en entier, chaque position tenue activement, sans tremblement excessif.",
        theme: 'mobilite',
      },
      {
        id: 'front-squat', nom: 'Front squat', videoUrl: 'https://youtu.be/A-XHzbJnP7E',
        consigne: "Barre ou charge en position avant, descente contrôlée jusqu'en dessous de la parallèle si la mobilité le permet, dos neutre.",
        critereValidation: "3 séries de 8 répétitions à 60% du poids du corps, technique parfaite, amplitude complète.",
        theme: 'mobilite',
      },
      {
        id: 'suspension-active-passive-3', nom: 'Suspension passive', videoUrl: 'https://youtu.be/1lpOQnht9jI',
        consigne: "Suspension relâchée, épaule engagée passivement — pas de tension active recherchée ici, juste un relâchement contrôlé.",
        critereValidation: "90 secondes de maintien, sans douleur ni compensation.",
        theme: 'force',
      },
    ],
    qcm: [
      {
        id: 'armure3-q1',
        question: "Que caractérise la phase de l'artisan dans la Mouvolution ?",
        choix: ["L'étude isolée de chaque secteur", "La transversalité et l'expression libre et créative", "L'arrêt de la pratique une fois les bases acquises"],
        bonneReponse: 1,
      },
      {
        id: 'armure3-q2',
        question: "Une fois l'armure organique complète, que se passe-t-il ?",
        choix: ["Une seule branche se débloque, au choix", "Le niveau 1 des cinq branches se débloque en même temps", "Il faut attendre encore un niveau supplémentaire"],
        bonneReponse: 1,
      },
    ],
    contenuDefini: true,
    image: '/mentorship/armure-organique.jpg',
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
  {
    id: 'force-1',
    domaine: 'force',
    niveau: 1,
    titre: 'Force — niveau 1',
    resume: 'Bases de tirage, poussée et suspension unilatérale.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/force-1.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false, // exercices calés, théorie/QCM restent à rédiger
    exercices: [
      { id: 'pushup-ring', nom: 'Push up ring', videoUrl: 'https://youtu.be/VM9s-3m7bAQ' },
      { id: 'rowing-unilat', nom: 'Rowing unilatérale', videoUrl: 'https://youtu.be/bW-nMmiKrSk' },
      { id: 'suspension-unilat', nom: 'Suspension unilatérale', videoUrl: 'https://youtu.be/Av2UT-xcGtc' },
    ],
    progressionBonus: [
      { id: 'mu-horizontal', nom: 'MU Horizontal', videoUrl: 'https://youtu.be/FpASYrW6dwA' },
      { id: 'force-pushup', nom: 'Push-up variation (régression/référence)', videoUrl: 'https://youtu.be/dvKypiqTkJE' },
    ],
  },
  {
    id: 'force-2',
    domaine: 'force',
    niveau: 2,
    titre: 'Force — niveau 2',
    resume: 'Travail aux anneaux de gymnastique : dips, tractions, transition et skin the cat.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/force-2.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'dips-anneaux', nom: 'Dips aux anneaux de gymnastique', videoUrl: 'https://youtu.be/QqSfP_g5sCM' },
      { id: 'traction-anneaux', nom: 'Traction aux anneaux de gymnastique', videoUrl: 'https://youtu.be/P87xMGptjr4' },
      { id: 'skin-the-cat', nom: 'Skin the cat', videoUrl: 'https://youtu.be/Cayfdp36_2Q' },
    ],
    progressionBonus: [
      { id: 'transition-mu-anneaux', nom: 'Transition du muscle up aux anneaux de gymnastique', videoUrl: 'https://youtu.be/LGKT7v0HCp0' },
      { id: 'skin-the-cat-german-hang', nom: 'Skin the cat — progression German hang', videoUrl: 'https://youtu.be/SOWsMAIX2Tc' },
      { id: 'traction-faux-grip', nom: 'Traction faux grip', videoUrl: '', note: 'Vidéo à confirmer — non trouvée dans la bibliothèque classée' },
      { id: 'l-sit-ring', nom: 'L-sit ring', videoUrl: 'https://youtu.be/2l1Nf2CgRwA' },
    ],
  },
  {
    id: 'force-3',
    domaine: 'force',
    niveau: 3,
    titre: 'Force — niveau 3',
    resume: 'Muscle up, poussée/tirage unilatéraux avancés, toes to bar et session ring complète.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/force-3.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'muscle-up', nom: 'Muscle up', videoUrl: 'https://youtu.be/nzRhNyAtVf0' },
      { id: 'pu-unilat', nom: 'Unilatérale Push up', videoUrl: 'https://youtu.be/-zXIsHTl9AU' },
      { id: 'archer-chin-up', nom: 'Archer Chin Up', videoUrl: 'https://youtu.be/3fVu6hYk1Yc' },
      { id: 'toes-to-bar', nom: 'Toes to bar', videoUrl: 'https://youtu.be/_VPnwAtdWPw' },
    ],
    progressionBonus: [
      { id: 'pelican-curl', nom: 'Pelican curl', videoUrl: 'https://youtu.be/uVlNAUHdI-E' },
      { id: 'rings-session-1', nom: 'Rings session — Level 1', videoUrl: 'https://youtu.be/Sf_sn6jfvuc' },
      { id: 'rings-session-2', nom: 'Rings session — Level 2', videoUrl: 'https://youtu.be/-7E4fPzjNuw' },
      { id: 'rings-session-3', nom: 'Rings session — Level 3', videoUrl: 'https://youtu.be/Rpo3KH_IOOg' },
      { id: 'ring-rotation', nom: 'Ring rotation', videoUrl: 'https://youtu.be/ZV6m93LlElE' },
      { id: 'shoulder-stand', nom: 'Shoulder stand', videoUrl: 'https://youtu.be/4eXHJwbHSRs' },
    ],
  },
];
const FLEXIBILITE: NoeudMentorship[] = [
  {
    id: 'flexibilite-1',
    domaine: 'flexibilite',
    niveau: 1,
    titre: 'Flexibilité — niveau 1',
    resume: 'Jefferson curl, squats de mobilité et straddle assis-debout.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/flexibilite-1.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'jefferson-curl', nom: 'Jefferson curl', videoUrl: 'https://youtu.be/DpqNwfWy0dA' },
      { id: 'squat-bulgare-progression', nom: 'Squat bulgare — progression', videoUrl: 'https://youtu.be/rNh_ohNQBCc' },
      { id: 'straddle-assis-debout-progression', nom: 'Straddle assis-debout — progression', videoUrl: 'https://youtu.be/ncKMvHELMiA' },
      { id: 'pigeon-squat', nom: 'Pigeon squat', videoUrl: 'https://youtu.be/U3HpCKZ5yDc' },
    ],
    progressionBonus: [
      { id: 'straddle-swing', nom: 'Straddle swing', videoUrl: 'https://youtu.be/35ov0kOlB78' },
      { id: 'papillon-avec-charge', nom: 'Papillon avec charge', videoUrl: 'https://youtu.be/baLUesFruG0' },
    ],
  },
  {
    id: 'flexibilite-2',
    domaine: 'flexibilite',
    niveau: 2,
    titre: 'Flexibilité — niveau 2',
    resume: 'Routine active complète, Jefferson curl straddle et squats chargés.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/flexibilite-2.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'routine-stretch-actif-full', nom: 'Routine stretch actif 1 — full', videoUrl: 'https://youtu.be/0XyyLXF1tAo' },
      { id: 'jefferson-curl-straddle', nom: 'Jefferson curl straddle', videoUrl: 'https://youtu.be/exMdSnDCUyU' },
      { id: 'horse-squat', nom: 'Horse squat', videoUrl: 'https://youtu.be/sxyP-W2ql2g' },
      { id: 'dragon-squat-unilateral', nom: 'Dragon squat unilatéral', videoUrl: 'https://youtu.be/-HPktyi536s' },
    ],
    progressionBonus: [
      { id: 'sissy-squat-progression', nom: 'Sissy squat — progression', videoUrl: 'https://youtu.be/nW1k0BdzyqA' },
      { id: 'straddle-fermeture', nom: 'Straddle fermeture', videoUrl: 'https://youtu.be/7zLuNIW3qm0' },
    ],
  },
  {
    id: 'flexibilite-3',
    domaine: 'flexibilite',
    niveau: 3,
    titre: 'Flexibilité — niveau 3',
    resume: 'Diagonal stretch, pancake chargé et squats avancés.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/flexibilite-3.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'diagonal-stretch', nom: 'Diagonal stretch', videoUrl: 'https://youtu.be/2yqAw7LeRlk' },
      { id: 'pancake-loaded', nom: 'Pancake loaded', videoUrl: 'https://youtu.be/-0JIuM_S6zg' },
      { id: 'good-morning-unilateral', nom: 'Good morning unilatéral', videoUrl: 'https://youtu.be/1gJbxRFwS80', note: 'Vidéo classée dans Armure Organique, reprise ici' },
      { id: 'big-4-squats', nom: 'Big 4 squats', videoUrl: 'https://youtu.be/ediycvN5YdA' },
    ],
    progressionBonus: [
      { id: 'front-splits-to-straddle', nom: 'Front splits to straddle', videoUrl: 'https://youtu.be/wjFaZOS4SkI' },
    ],
  },
];
const LOCOMOTION: NoeudMentorship[] = [
  {
    id: 'locomotion-1',
    domaine: 'locomotion',
    niveau: 1,
    titre: 'Locomotion — niveau 1',
    resume: 'Bases de la quadrupédie, de la bipédie et du travail au sol.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/locomotion-1.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'quadrupedie-deplacement-base', nom: 'Quadrupédie — déplacements de base', videoUrl: 'https://youtu.be/EDhBUqhBX4o' },
      { id: 'bipedie-squats-fragment', nom: 'Bipédie — les squats de base (fragment)', videoUrl: 'https://youtu.be/4h65QpV3OY0' },
      { id: 'routine-assise-complete', nom: 'Routine assise complète', videoUrl: 'https://youtu.be/x2hWwXRc8tA' },
      { id: 'floor-work-basic', nom: 'Floor work basique', videoUrl: 'https://youtu.be/6ETL4STnuJM' },
    ],
    progressionBonus: [
      { id: 'integration-1', nom: 'Intégration 1', videoUrl: 'https://youtu.be/PvZbUfjxIHo' },
      { id: 'bipedie-squats-assemblage', nom: 'Bipédie — les squats de base (assemblage)', videoUrl: 'https://youtu.be/NB00Mhc9qA8' },
      { id: 'play-with-routine-assise', nom: 'Play with : routine assise', videoUrl: 'https://youtu.be/5eFKp3f8OXY' },
    ],
  },
  {
    id: 'locomotion-2',
    domaine: 'locomotion',
    niveau: 2,
    titre: 'Locomotion — niveau 2',
    resume: 'Transitions au sol, bases de la brachiation et rotation sur le pont bas.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/locomotion-2.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'basic-hand-transitions', nom: 'Basic hand transitions', videoUrl: 'https://youtu.be/2KjUURny8fY' },
      { id: 'brachiation-bases', nom: 'Locomotion — les bases de brachiation', videoUrl: 'https://youtu.be/nWe3uMHXQjE' },
      { id: 'rotation-pont-bas', nom: 'Rotation sur le pont bas', videoUrl: 'https://youtu.be/9G-WD45kN-E' },
      { id: 'au-cortado', nom: 'Au cortado', videoUrl: 'https://youtu.be/0J-LcVLkz1g' },
    ],
    progressionBonus: [
      { id: 'brachiation-assemblage', nom: 'Locomotion — assemblage brachiation', videoUrl: 'https://youtu.be/2O2Yk4y571c' },
      { id: 'integration-2', nom: 'Intégration 2', videoUrl: 'https://youtu.be/QEV3x4GL-4g' },
      { id: 'integration-3', nom: 'Intégration 3', videoUrl: 'https://youtu.be/l_8JDqPnhSg' },
    ],
  },
  {
    id: 'locomotion-3',
    domaine: 'locomotion',
    niveau: 3,
    titre: 'Locomotion — niveau 3',
    resume: 'Reptation, changement de QDR et jeu de self-dominance.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/locomotion-3.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'lizard-crawl-progression', nom: 'Lizard crawl — progression', videoUrl: 'https://youtu.be/tH99d4cs6Hc' },
      { id: 'qdr-switch', nom: 'QDR switch', videoUrl: 'https://youtu.be/jzRmpCTLMxs' },
      { id: 'self-dominance-squat', nom: 'Self-dominance squat', videoUrl: 'https://youtu.be/8FAjwRHjrx4', note: 'Vidéo 1/2 — voir aussi LOCOMOTION GAME - SELF DOMINANCE 2' },
    ],
    progressionBonus: [
      { id: 'entree-sortie-pont', nom: 'Entrée & sortie sur le pont', videoUrl: 'https://youtu.be/vPM8tf3Fjkw' },
      { id: 'entree-pont-par-qdr', nom: 'Entrée sur le pont par le QDR', videoUrl: 'https://youtu.be/c9KDc7I7NQE' },
      { id: 'chute-sur-qdr', nom: 'Chute sur QDR', videoUrl: 'https://youtu.be/EZeFqhHS_bY' },
    ],
  },
];
const CONNEXION: NoeudMentorship[] = [
  {
    id: 'connexion-1',
    domaine: 'connexion',
    niveau: 1,
    titre: 'Connexion — niveau 1',
    resume: 'Premiers jeux de coordination cerveau et manipulation de balle.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/connexion-1.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'brain-work-1', nom: 'Brain work 1', videoUrl: 'https://youtu.be/EdrHn-ipZS0' },
      { id: 'dribble-2-balles-coordonnees', nom: 'Dribble 2 balles coordonnées', videoUrl: 'https://youtu.be/tjXgfNBTz-M' },
      { id: 'manipulation-1-balle', nom: 'Connexion — manipulation 1 balle', videoUrl: 'https://youtu.be/qhfai2Nq0dI' },
    ],
    progressionBonus: [
      { id: 'reflexe-balle', nom: 'Réflexe balle', videoUrl: 'https://youtu.be/4y13rzDMJ2s' },
      { id: 'jeux-de-contact', nom: 'Jeux de contact debout / assis / couché', videoUrl: 'https://youtu.be/c_qf0nU341Q' },
      { id: 'brain-work-2', nom: 'Brain work 2', videoUrl: 'https://youtu.be/c4J3BNvYmjU' },
    ],
  },
  {
    id: 'connexion-2',
    domaine: 'connexion',
    niveau: 2,
    titre: 'Connexion — niveau 2',
    resume: 'Dribbles de pieds, deux balles et jeux de percussion.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/connexion-2.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'dribbles-pieds-phase-1', nom: 'Dribbles de pieds — phase 1', videoUrl: 'https://youtu.be/q9DWr5q_jd8' },
      { id: 'dribble-2-balles-2-mains', nom: 'Dribble 2 balles — 2 mains', videoUrl: 'https://youtu.be/ZWTVQqZSTPQ' },
      { id: 'brain-work-3', nom: 'Brain work 3', videoUrl: 'https://youtu.be/8ADflr3ygJk' },
      { id: 'jeux-de-percussion', nom: 'Jeux de percussion', videoUrl: 'https://youtu.be/lHr3wfgUQb0' },
    ],
    progressionBonus: [
      { id: 'brain-work-4', nom: 'Brain work 4', videoUrl: 'https://youtu.be/oS2ZUqftDfI' },
      { id: 'flexibilite-sauts-balanciers', nom: 'Flexibilité — sauts & balanciers', videoUrl: 'https://youtu.be/JETWpCgiNSs' },
    ],
  },
  {
    id: 'connexion-3',
    domaine: 'connexion',
    niveau: 3,
    titre: 'Connexion — niveau 3',
    resume: 'Monkey ball, manipulation avancée et dribbles progressifs.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/connexion-3.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'monkey-ball', nom: 'Monkey ball', videoUrl: 'https://youtu.be/baNnB3pNAgo' },
      { id: 'manipulation-ballon-front', nom: "Manipulation d'objet — ballon sur le front", videoUrl: 'https://youtu.be/M84UQmSCRJE' },
      { id: 'brain-work-5', nom: 'Brain work 5', videoUrl: 'https://youtu.be/Rlan5rrsMUU' },
      { id: 'dribbles-pieds-phase-2', nom: 'Dribbles de pieds — phase 2', videoUrl: 'https://youtu.be/BlZQRcE09rE' },
      { id: 'dribbles-2-balles-progression', nom: 'Dribbles 2 balles — progression', videoUrl: 'https://youtu.be/ayI2yRrud5Y' },
    ],
    progressionBonus: [
      { id: 'brain-work-6', nom: 'Brain work 6', videoUrl: 'https://youtu.be/0j2mWD2VmgU' },
      { id: 'dribbles-inversees', nom: 'Dribbles inversées', videoUrl: 'https://youtu.be/pJKhMBwCarI' },
    ],
  },
];
const FIGURES: NoeudMentorship[] = [
  {
    id: 'figures-1',
    domaine: 'figures',
    niveau: 1,
    titre: 'Figures — niveau 1',
    resume: 'Bases du pont, du handstand contre le mur et de l\'elbow lever.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/figures-1.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'pont-bas', nom: 'Pont bas', videoUrl: 'https://youtu.be/MD7sDoWnpAc' },
      { id: 'handstand-dos-au-mur', nom: 'Handstand dos au mur', videoUrl: 'https://youtu.be/XOPq9QtH6Lw' },
      { id: 'elbow-diamant', nom: 'Elbow diamant', videoUrl: 'https://youtu.be/sHHs-rS_Z1s' },
      { id: 'frog', nom: 'Frog', videoUrl: 'https://youtu.be/YPVYiqCGZfg' },
    ],
    progressionBonus: [
      { id: 'frog-transition-1', nom: 'Frog transition 1', videoUrl: 'https://youtu.be/FobsslhMKeA' },
      { id: 'pont-bas-touche-epaule', nom: 'Pont bas — touche épaules', videoUrl: 'https://youtu.be/EAv-Wes9Xdo' },
    ],
  },
  {
    id: 'figures-2',
    domaine: 'figures',
    niveau: 2,
    titre: 'Figures — niveau 2',
    resume: 'Handstand ventre au mur, L-sit et transitions frog/elbow.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/figures-2.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'handstand-ventre-au-mur', nom: 'Handstand ventre au mur', videoUrl: 'https://youtu.be/lNQYdhRlejI' },
      { id: 'l-sit', nom: 'L-sit', videoUrl: 'https://youtu.be/kO0ntgyhG0E' },
      { id: 'elbow-split', nom: 'Elbow split', videoUrl: '', note: 'Vidéo à confirmer — non trouvée dans la bibliothèque classée' },
      { id: 'frog-one-leg', nom: 'Frog one leg', videoUrl: 'https://youtu.be/pJWjfbpQvuQ', note: 'Vidéo retenue : Frog transition 2' },
    ],
    progressionBonus: [
      { id: 'frog-transition-3', nom: 'Frog transition 3', videoUrl: 'https://youtu.be/a5d_or-nXvc' },
      { id: 'lateral-frog', nom: 'Latéral frog (air baby)', videoUrl: 'https://youtu.be/cGv25OOYBEE' },
    ],
  },
  {
    id: 'figures-3',
    domaine: 'figures',
    niveau: 3,
    titre: 'Figures — niveau 3',
    resume: 'Handstand, QDR, pont haut et elbow straddle.',
    objectifPedagogique: 'À définir ensemble (théorie/QCM à rédiger — exercices déjà calés).',
    image: '/mentorship/figures-3.png',
    theorie: [],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'qdr', nom: 'QDR', videoUrl: 'https://youtu.be/1N-KzT5NiUk' },
      { id: 'pont-haut', nom: 'Pont haut', videoUrl: 'https://youtu.be/NcDCSB9dSU0' },
      { id: 'elbow-straddle', nom: 'Elbow straddle', videoUrl: 'https://youtu.be/6sKdFFP7qnM' },
      { id: 'handstand', nom: 'Handstand', videoUrl: 'https://youtu.be/Nx86xgOx0UY', note: 'Vidéo retenue : Handstand & kick up' },
    ],
    progressionBonus: [
      { id: 'handstand-straddle', nom: 'Handstand straddle', videoUrl: 'https://youtu.be/iGSNpzZEQZ4' },
      { id: 'souplesse-arriere', nom: 'Souplesse arrière', videoUrl: 'https://youtu.be/6NL67F76Wgw' },
      { id: 'elbow-lever', nom: 'Elbow lever', videoUrl: 'https://youtu.be/me2-E5q456M' },
    ],
  },
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
  // Verrouillage global (toutes branches) : le niveau N d'une branche ne se
  // débloque que lorsque le niveau N-1 est acquis dans les 5 branches à la
  // fois, pas seulement dans celle-ci — chaque palier avance ensemble,
  // plutôt qu'une branche pouvant filer devant les autres.
  return ORDRE_DOMAINES.every((domaine) => {
    const precedent = BRANCHES.find((n) => n.domaine === domaine && n.niveau === noeud.niveau - 1);
    return precedent ? idsAcquis.has(precedent.id) : true;
  });
}

// --- Points Mouvement (XP) et niveau global ------------------------------
// Plus une compétence est haute dans l'arbre (niveau 3 > niveau 1), plus
// elle vaut de points — et le tronc, socle de tout le reste, vaut un peu
// plus que les branches à niveau égal. Une compétence "partiellement
// acquise" (QCM réussi ou vidéo envoyée, mais pas encore validée par
// Sylvain) rapporte une fraction des points ; "acquis" rapporte le total.

const XP_PAR_NIVEAU: Record<1 | 2 | 3, number> = { 1: 100, 2: 150, 3: 220 };
const MULTIPLICATEUR_TRONC = 1.5;
const FRACTION_PARTIELLEMENT_ACQUIS = 0.3;

export function xpMaxDuNoeud(noeud: NoeudMentorship | NoeudMentorshipPublic): number {
  const base = XP_PAR_NIVEAU[noeud.niveau];
  return Math.round(noeud.domaine === 'tronc' ? base * MULTIPLICATEUR_TRONC : base);
}

export type StatutProgressionXP = 'acquis' | 'partiellement_acquis' | 'non_acquis';

export function statutXP(statutBrut: 'en_attente' | 'acquis' | 'refuse' | null | undefined, quizReussi: boolean): StatutProgressionXP {
  if (statutBrut === 'acquis') return 'acquis';
  if (quizReussi || statutBrut === 'en_attente') return 'partiellement_acquis';
  return 'non_acquis';
}

export function xpGagneParNoeud(noeud: NoeudMentorship | NoeudMentorshipPublic, statut: StatutProgressionXP): number {
  const max = xpMaxDuNoeud(noeud);
  if (statut === 'acquis') return max;
  if (statut === 'partiellement_acquis') return Math.round(max * FRACTION_PARTIELLEMENT_ACQUIS);
  return 0;
}

export const XP_BONUS_DEFI_QUOTIDIEN = 10;
const XP_PAR_PROGRESSION_BONUS_VALIDEE = 25;

// Généralise "ce nœud est-il acquis ?" aux deux modèles : ancien modèle
// (une seule ligne de progression, clé = noeud.id) et nouveau modèle à
// exercices indépendants (clé = moduleIdExercice pour chaque exercice
// obligatoire, TOUS doivent être acquis). `estModuleAcquis` est fourni par
// l'appelant (lit `mentorship_progression`, statut === 'acquis').
export function estNoeudAcquisDepuisProgression(
  noeud: NoeudMentorship | NoeudMentorshipPublic,
  estModuleAcquis: (moduleId: string) => boolean
): boolean {
  if (noeud.exercices && noeud.exercices.length > 0) {
    // Les outils "récupération" (respiration, système nerveux...) ne sont
    // jamais soumis à validation -- ce sont des outils santé à disposition,
    // pas des quêtes. Ils ne comptent donc pas dans la complétion du nœud.
    const exercicesValides = noeud.exercices.filter((ex) => ex.theme !== 'recuperation');
    if (exercicesValides.length === 0) return true;
    return exercicesValides.every((ex) => estModuleAcquis(moduleIdExercice(noeud, ex)));
  }
  return estModuleAcquis(noeud.id);
}

// XP d'un nœud à exercices indépendants : le total du nœud (xpMaxDuNoeud)
// est réparti à parts égales entre ses exercices obligatoires, + un bonus
// fixe par progression bonus validée (indépendant du nombre de progressions
// disponibles sur le nœud, pour rester simple à expliquer).
export function xpNoeudExercices(
  noeud: NoeudMentorship | NoeudMentorshipPublic,
  estModuleAcquis: (moduleId: string) => boolean
): number {
  // Les outils "récupération" ne sont jamais validables (pas de formulaire de
  // soumission) -- ils ne doivent donc jamais entrer dans le calcul du XP,
  // sous peine de rendre le 100% du nœud impossible à atteindre.
  const exercices = (noeud.exercices ?? []).filter((ex) => ex.theme !== 'recuperation');
  if (exercices.length === 0) return 0;
  const xpParExercice = xpMaxDuNoeud(noeud) / exercices.length;
  const nbAcquis = exercices.filter((ex) => estModuleAcquis(moduleIdExercice(noeud, ex))).length;
  const bonus = noeud.progressionBonus ?? [];
  const nbBonusAcquis = bonus.filter((ex) => estModuleAcquis(moduleIdExercice(noeud, ex))).length;
  return Math.round(xpParExercice * nbAcquis) + nbBonusAcquis * XP_PAR_PROGRESSION_BONUS_VALIDEE;
}

// Grille de niveaux par défaut — les seuils et les titres sont volontairement
// simples pour démarrer, à ajuster une fois que les vrais élèves progressent.
export const GRILLE_NIVEAUX = [
  { xpMin: 0, titre: 'Débutant' },
  { xpMin: 300, titre: 'Pratiquant régulier' },
  { xpMin: 900, titre: 'Pratiquant engagé' },
  { xpMin: 1800, titre: 'Praticien confirmé' },
  { xpMin: 3000, titre: 'Praticien avancé' },
  { xpMin: 5000, titre: 'Maître du Mouvement' },
] as const;

const XP_PAR_PALIER_NIVEAU = 300; // 1 niveau tous les 300 XP, indépendamment des titres ci-dessus

export function niveauGlobal(xpTotal: number): { niveau: number; titre: string; xpDansPalier: number; xpProchainPalier: number } {
  const niveau = 1 + Math.floor(xpTotal / XP_PAR_PALIER_NIVEAU);
  const titre = [...GRILLE_NIVEAUX].reverse().find((g) => xpTotal >= g.xpMin)?.titre ?? GRILLE_NIVEAUX[0].titre;
  const xpDansPalier = xpTotal % XP_PAR_PALIER_NIVEAU;
  return { niveau, titre, xpDansPalier, xpProchainPalier: XP_PAR_PALIER_NIVEAU };
}

// --- Courbe XP dans le temps -----------------------------------------------
// Reconstitue un vrai historique jour par jour à partir des dates déjà
// enregistrées (quiz_valide_le pour la part "partiellement acquis",
// reviewed_at pour le complément une fois "acquis", jour des défis
// quotidiens validés) — pas de données inventées.

export type PointCourbeXP = { jour: string; xp: number };

export function courbeXPParJour(
  progressionRows: { module_id: string; statut: string | null; quiz_valide_le: string | null; reviewed_at: string | null }[],
  defisRows: { jour: string }[]
): PointCourbeXP[] {
  const gainsParJour = new Map<string, number>();
  const ajouter = (jourISO: string | null, montant: number) => {
    if (!jourISO || montant <= 0) return;
    const jour = jourISO.slice(0, 10);
    gainsParJour.set(jour, (gainsParJour.get(jour) ?? 0) + montant);
  };

  for (const p of progressionRows) {
    const noeud = TOUS_LES_NOEUDS.find((n) => n.id === p.module_id);
    if (!noeud) continue;
    const partiel = xpGagneParNoeud(noeud, 'partiellement_acquis');
    if (p.quiz_valide_le) ajouter(p.quiz_valide_le, partiel);
    if (p.statut === 'acquis' && p.reviewed_at) ajouter(p.reviewed_at, xpGagneParNoeud(noeud, 'acquis') - partiel);
  }
  for (const d of defisRows) ajouter(d.jour, XP_BONUS_DEFI_QUOTIDIEN);

  const jours = [...gainsParJour.keys()].sort();
  let cumule = 0;
  return jours.map((jour) => {
    cumule += gainsParJour.get(jour)!;
    return { jour, xp: cumule };
  });
}

// --- Flamme de nœud & badge élève (dépassement / progressions bonus) ------
//
// Flamme d'un nœud : % de `progressionBonus` validés (acquis) sur ce nœud
// précis, rapporté au nombre de progressions bonus disponibles pour ce
// nœud. Purement locale — ne dépend que de ce nœud.
//
// Badge élève : recalculé en continu à partir de TOUS les nœuds acquis de
// l'élève = % de ces nœuds acquis dont la flamme est Légendaire ou plus.
// Un seul nœud parfait ne suffit pas à décrocher un badge élevé — il faut
// répéter la performance sur plusieurs nœuds. Garde-fou : badge "Normal"
// tant que l'élève a moins de 3 nœuds acquis.

export type PalierFlamme = 'aucune' | 'normal' | 'epique' | 'legendaire' | 'mythique';

export const COULEUR_FLAMME: Record<PalierFlamme, string> = {
  aucune: 'transparent',
  normal: '#FFA500', // orange/jaune classique
  epique: '#8B5CF6', // violet — cohérent avec DOMAINE_COULEURS.figures
  legendaire: '#FFD700', // or
  mythique: 'linear-gradient(90deg, #FF3B30, #FF2D78, #8B5CF6)', // dégradé animé multicolore
};

const SEUIL_MIN_NOEUDS_ACQUIS_POUR_BADGE = 3;

// Calcule le % de progressions bonus acquises sur un nœud donné.
// `estAcquis` : fonction fournie par l'appelant, qui sait lire le statut
// d'un exercice donné (vient de `mentorship_progression`, clé
// `moduleIdExercice(noeud, exercice)`).
export function pourcentageFlammeNoeud(
  noeud: NoeudMentorship | NoeudMentorshipPublic,
  estAcquis: (moduleId: string) => boolean
): number {
  const bonus = noeud.progressionBonus ?? [];
  if (bonus.length === 0) return 0;
  const acquis = bonus.filter((ex) => estAcquis(moduleIdExercice(noeud, ex))).length;
  return acquis / bonus.length;
}

export function palierFlamme(pourcentage: number): PalierFlamme {
  if (pourcentage <= 0) return 'aucune';
  if (pourcentage < 0.5) return 'normal';
  if (pourcentage < 0.8) return 'epique';
  if (pourcentage < 1) return 'legendaire';
  return 'mythique';
}

// Est-ce qu'un nœud à exercices indépendants est acquis dans son ensemble ?
// (tous les exercices obligatoires acquis — la progression bonus ne compte pas).
export function noeudExercicesAcquis(
  noeud: NoeudMentorship | NoeudMentorshipPublic,
  estAcquis: (moduleId: string) => boolean
): boolean {
  const exercices = noeud.exercices ?? [];
  if (exercices.length === 0) return false;
  return exercices.every((ex) => estAcquis(moduleIdExercice(noeud, ex)));
}

// Badge global de l'élève à partir de la liste de ses nœuds acquis (déjà
// filtrés par l'appelant) et de leur % de flamme respectif.
export function badgeEleve(pourcentagesFlammeNoeudsAcquis: number[]): PalierFlamme {
  const total = pourcentagesFlammeNoeudsAcquis.length;
  if (total < SEUIL_MIN_NOEUDS_ACQUIS_POUR_BADGE) return 'normal';
  const nbLegendairePlus = pourcentagesFlammeNoeudsAcquis.filter((p) => palierFlamme(p) === 'legendaire' || palierFlamme(p) === 'mythique').length;
  const ratio = nbLegendairePlus / total;
  if (ratio < 0.3) return 'normal';
  if (ratio < 0.6) return 'epique';
  if (ratio < 0.9) return 'legendaire';
  return 'mythique';
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
