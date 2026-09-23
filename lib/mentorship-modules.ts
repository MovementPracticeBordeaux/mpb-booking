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
  flexibilite: '#39FF14',
  locomotion: '#6C5CE7',
  connexion: '#FF2D78',
  figures: '#FFD400',
};
export const COULEUR_TRONC = '#ff00aa'; // accent déjà utilisé pour les CTA du site

export type FragmentTheorie = {
  titre: string;
  texte: string;
  image?: string; // illustration optionnelle (schéma, diagramme) dans /public/mentorship/theorie
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
        titre: 'Fondations',
        texte: "Ce premier niveau porte bien son nom : avant toute spécialisation, il pose les fondations — la mobilité de base, la respiration, la conscience du corps — sur lesquelles tout le reste va se construire. Rien de ce qui suit dans ta pratique ne tiendra sans elles.",
      },
      {
        titre: 'Qu\'est-ce que le Mouvement ?',
        texte: "Le Mouvement est une quête, une démarche de recherche et de développement personnel, un point de vue et une stratégie originale à la fois physique et mentale, axée sur l'apprentissage et l'acquisition d'expérience. Peut-on le qualifier de pratique ou de discipline ? Oui, car il se distingue par sa démarche, sa communauté, et un domaine de pratique fortement identitaire. Mais il reste aussi difficile à catégoriser, du fait de sa grande diversité de formes et de sa capacité de mutation. Une chose est sûre : il n'existe pas de bon ou de mauvais mouvement dans l'absolu — seulement des mouvements que nous sommes prêts à réaliser, et d'autres non.",
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
        critereValidation: "Voir la vidéo : l'objectif de réalisation y est donné directement.",
        theme: 'recuperation',
      },
      {
        id: 'perfect-breath', nom: 'The perfect breath', videoUrl: 'https://youtu.be/EuTvBdpUbWc',
        consigne: "Respiration diaphragmatique lente : inspiration ET expiration par le nez, sans passer par la bouche. Rechercher le calme, pas la performance.",
        critereValidation: "15 minutes de pratique continue, respiration fluide et régulière, sans tension au niveau des épaules ou du cou.",
        theme: 'recuperation',
      },
      {
        id: 'deep-squat', nom: 'Deep squat', videoUrl: 'https://youtu.be/9PJymG3sedc',
        consigne: "Squat complet, talons au sol, buste le plus vertical possible. La tenue peut être passive (relâchée) ou active (engagée), et une récupération est possible entre les séries si besoin — pas d'obligation de rester en continu sans bouger.",
        critereValidation: "3 séries de 5 minutes cumulées en position (passive ou active, récupération autorisée au besoin), talons au sol en permanence, sans douleur articulaire.",
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
        consigne: "Pieds surélevés sur le support (pas les bras), mains au sol à l'aplomb des épaules, bras tendus. Mouvement isolé au niveau des omoplates (protraction/rétraction), en cherchant l'amplitude la plus complète possible, sans plier les coudes.",
        critereValidation: "3 séries de 10 répétitions, amplitude complète du mouvement des omoplates, coudes qui restent tendus tout du long, 3 minutes de récupération entre les séries.",
        theme: 'force',
        outils: [
          { nom: 'Routine haut du corps', videoUrl: 'https://youtu.be/V6JDf7t7vPQ' },
          { nom: 'Renforcement et santé des épaules', videoUrl: 'https://youtu.be/gdIxt_m35VE' },
          { nom: 'Push up excentrique genoux', videoUrl: 'https://youtu.be/lmGSzEfYHkE' },
          { nom: 'Rowing bûcheron', videoUrl: 'https://youtu.be/SNBddEEl1UE' },
        ],
      },
      {
        id: 'hollow-hold', nom: 'Hollow hold', videoUrl: 'https://youtu.be/axUNfJyWgWc',
        consigne: "Jambes et bras tendus et légèrement décollés. Lombaires écrasés au sol (les omoplates, elles, ne touchent pas le sol), bassin en rétroversion, abdos serrés — sternum et pubis qui se rapprochent, jamais de dos cambré. Respirer sans relâcher la position. Régression : exécuter jambes fléchies, puis les tendre petit à petit à mesure que le contrôle s'installe — tant que les lombaires restent plaqués au sol, c'est valable.",
        critereValidation: "3 séries de 30 secondes, lombaires plaqués au sol en permanence, bassin en rétroversion, aucune cambrure du dos.",
        theme: 'force',
      },
      {
        id: 'suspension-active-passive-1', nom: 'Suspension active / passive', videoUrl: 'https://youtu.be/1lpOQnht9jI',
        consigne: "Alterner suspension active (omoplates serrées, la tête sort des épaules) et passive (épaules relâchées, la tête rentre entre les épaules, corps complètement relâché), en gardant le contrôle sur les transitions. Grip : le pouce passe par-dessus l'index pour verrouiller la prise. Pour progresser sur le grip en dehors de cet exercice (aucune vidéo dédiée pour l'instant) : serrer fort une balle de tennis et maintenir, ou tenir des objets de plus en plus lourds et maintenir.",
        critereValidation: "3 séries de 10 répétitions, transitions actif/passif contrôlées, sans à-coup, prise verrouillée (pouce sur l'index).",
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
        titre: 'Consolidation',
        texte: "Ce deuxième niveau porte bien son nom : ce que tu as posé en Fondations se consolide ici — tes outils gagnent en exigence, ta pratique devient plus méthodique. On ne construit pas encore de nouvelles fondations, on solidifie celles qui existent déjà.",
      },
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
        consigne: "Mouvement de balancier contrôlé : tronc neutre, légèrement en fermeture sur le bassin (légère rétroversion), ceinture scapulaire complètement relâchée. L'amplitude vient des épaules et des hanches, pas d'un déséquilibre du corps.",
        critereValidation: "5 à 15 minutes de pratique — c'est le temps passé dans le mouvement qui produit l'effet recherché, pas un nombre de répétitions précis.",
        theme: 'recuperation',
      },
      {
        id: 'angola-pu', nom: 'Angola PU', videoUrl: 'https://youtu.be/1jRXZLwnO7A',
        consigne: "Variante de push-up plus exigeante que la version genoux. Garde le gainage, omoplates serrées sur les transitions. Le corps n'est pas aligné mais légèrement latéral. Le coude du bras de poussée doit rester à l'aplomb de la main — c'est le point le plus important de l'exercice. Erreur la plus commune à éviter : perdre la rétraction des omoplates et laisser monter l'épaule de poussée vers l'oreille.",
        critereValidation: "6 répétitions consécutives, coude du bras de poussée constamment à l'aplomb de la main (non négociable — sans ça, l'exercice n'est pas validé), omoplates qui restent serrées sur les transitions.",
        theme: 'force',
        outils: [
          { nom: 'Push up genoux', videoUrl: 'https://youtu.be/lmGSzEfYHkE' },
          { nom: 'Pec stretch', videoUrl: 'https://youtu.be/KdJ5z7G9nY8' },
          { nom: 'Elevation latérale haltère au sol', videoUrl: 'https://youtu.be/U-R8rIaQs84' },
          { nom: 'Rotation cubaine', videoUrl: 'https://youtu.be/FjnxcbgCy_8' },
        ],
      },
      {
        id: 'entree-rotation-pont', nom: 'Entrée en rotation sur le pont', videoUrl: 'https://youtu.be/f6-YFDBT2MA',
        consigne: "Mouvement circulaire pour entrer et sortir de la rotation, poussée maximale du bassin vers le ciel. Talon au sol ou sur la pointe des pieds — les deux sont valables. Main au sol à l'aplomb de l'épaule, main en rotation externe, épaule de soutien en rotation externe, contrôle de l'équilibre jusque dans les doigts. Les deux épaules restent superposées verticalement, sans aller plus loin.",
        critereValidation: "Entrée et sortie réalisées avec contrôle, sans chute ni compensation, des deux côtés, épaules superposées verticalement en permanence.",
        theme: 'mobilite',
        outils: [
          { nom: 'Routine haut du corps', videoUrl: 'https://youtu.be/V6JDf7t7vPQ' },
          { nom: 'Rotation cubaine', videoUrl: 'https://youtu.be/FjnxcbgCy_8' },
          { nom: 'Pec stretch', videoUrl: 'https://youtu.be/KdJ5z7G9nY8' },
          { nom: 'Routine colonne vertébrale', videoUrl: 'https://youtu.be/MYl0f4i7Bm0' },
          { nom: 'Elevation latérale allongé', videoUrl: 'https://youtu.be/U-R8rIaQs84' },
          { nom: 'Élévation de bassin', videoUrl: 'https://youtu.be/yBSKxCsVd68' },
          { nom: 'Stretch passif 1', videoUrl: 'https://youtu.be/NpBgqC_1j-4' },
        ],
      },
      {
        id: 'fragment-stretch-actif', nom: 'Fragment stretch actif', videoUrl: 'https://youtu.be/rRXI-rQXMBc',
        consigne: "Dos droit. Chaque position tenue activement (le muscle travaille pour maintenir l'amplitude, pas juste relâché) — respiration continue pendant la tenue.",
        critereValidation: "6 à 10 répétitions de chaque fragment, chaque position tenue au moins 5 secondes en restant actif.",
        theme: 'mobilite',
        outils: [
          { nom: 'Flexion active de cheville', videoUrl: 'https://youtu.be/Q6CHGnGFJRM' },
          { nom: 'Mollets - stretch actif', videoUrl: 'https://youtu.be/xM9sP2J1d6E' },
          { nom: 'Papillon avec charge', videoUrl: 'https://youtu.be/baLUesFruG0' },
          { nom: 'Routine bas du corps', videoUrl: 'https://youtu.be/MQcmU9BQAGY' },
        ],
      },
      {
        id: 'routine-assise-complete', nom: 'Routine assise complète', videoUrl: 'https://youtu.be/x2hWwXRc8tA',
        consigne: "Routine complète au sol, transitions fluides, en gardant un contact conscient avec le sol à chaque instant.",
        critereValidation: "Routine réalisée en entier sans interruption, transitions maîtrisées.",
        theme: 'mobilite',
        outils: [
          { nom: 'Floor mobility training - introduction', videoUrl: 'https://youtu.be/6ETL4STnuJM' },
        ],
      },
      {
        id: 'suspension-active-passive-2', nom: 'Suspension passive', videoUrl: 'https://youtu.be/1lpOQnht9jI',
        consigne: "Suspension relâchée : pas d'épaule engagée ici, juste du grip et du relâchement. Régression : repérer ton temps de suspension maximal et travailler à 80% de ce temps, sur 3 à 5 séries avec au minimum 3 minutes de récupération entre chaque (ou en répartissant le travail dans la journée). Même recommandation que pour le travail du grip vu au niveau précédent.",
        critereValidation: "3 à 5 séries à 80% du temps de suspension maximal, au moins 3 minutes de récupération entre les séries, sans douleur.",
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
    resume: "L'armure organique se consolide : les principes qui portent toute la pratique, quel que soit le domaine, et qui ouvrent la porte aux cinq branches.",
    objectifPedagogique: "Consolider les principes fondamentaux de l'entraînement, et se préparer physiquement à l'ouverture simultanée des branches spécialisées.",
    theorie: [
      {
        titre: 'Intégration',
        texte: "Ce troisième niveau porte bien son nom : les outils travaillés en Fondations et Consolidation s'intègrent maintenant les uns aux autres, et ton corps s'intègre à un tout — prêt à intégrer, une fois ce niveau achevé, les cinq branches qui s'ouvriront ensemble.",
      },
      {
        titre: 'La répétition, matière première de l\'entraînement',
        texte: "Chaque mouvement, chaque geste, trouve sa perfection dans la répétition. Elle est la pierre angulaire de tout progrès : répéter régulièrement et consciemment un mouvement permet de le comprendre en profondeur et de forger une connexion solide entre le corps et l'esprit — la base de tout apprentissage durable.",
      },
      {
        titre: "L'ambidextrie, l'équilibre entre les deux côtés",
        texte: "Développer la capacité à utiliser de manière équilibrée les deux côtés du corps renforce la coordination globale et la conscience corporelle. Ton « côté fort » doit régulièrement pouvoir soutenir et inspirer ton « côté faible » — un principe que tu retrouveras à chaque niveau, sur chaque exercice.",
      },
      {
        titre: "L'analyse de l'erreur",
        texte: "Les erreurs sont des opportunités d'apprentissage, pas des échecs. Les analyser en profondeur permet de comprendre les lacunes et de les transformer en occasions de progresser — tout en célébrant chacune des étapes franchies, aussi petite soit-elle, pour renforcer la confiance en soi et la motivation.",
      },
      {
        titre: 'Les avantages de la pratique généraliste',
        texte: "Sortir de sa zone de confort et développer un large éventail de compétences, au-delà des choix uniquement basés sur ses goûts et ses limites mentales du moment : voilà ce qu'encourage une pratique généraliste. Elle ouvre des perspectives, favorise la transversalité des compétences et la capacité d'adaptation — des atouts majeurs pour la santé, la performance et la longévité dans toute pratique physique.",
      },
      {
        titre: 'La fabrique du multivers',
        texte: "À ce stade, l'armure organique s'inscrit dans une perspective globale où chaque compétence acquise devient une brique dans la construction d'un multivers de mouvements, favorisant le dépassement de soi, le transfert de compétences et la créativité.",
      },
      {
        titre: 'Ouvrir des portes',
        texte: "L'armure organique a pour but d'ouvrir des portes. L'exploration commence par l'acquisition de compétences fondamentales, des tremplins vers des objectifs plus avancés — les « Grandes Portes » de ton parcours. Ce niveau termine cette phase : il rend abordables, en même temps, les premiers objectifs des cinq branches. C'est pour cela qu'une fois l'armure organique complète, tu débloques le niveau 1 de Force, Figures, Flexibilité, Locomotion et Connexion en même temps — pas une branche après l'autre.",
        image: '/mentorship/theorie/venn-5-branches.png',
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
        question: "Selon la Voie de la maîtrise, que faut-il faire d'une erreur ?",
        choix: ["L'ignorer et passer à autre chose", "L'analyser en profondeur, comme une opportunité d'apprentissage", "Recommencer depuis le tout début"],
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
    objectifPedagogique: "Comprendre l'équilibre entre suspension et répulsion, et pourquoi la chaîne postérieure mérite une attention particulière.",
    image: '/mentorship/force-1.png',
    theorie: [
      {
        titre: 'Suspension et répulsion : un équilibre de forces',
        texte: "Le travail en suspension (anneaux, barre) est équilibré par des mouvements en répulsion (pompes, locomotion, handstand). La suspension développe la force et la stabilité dans des positions qui défient la gravité ; la répulsion renforce la capacité à générer de la force contre une surface. Les modes de vie sédentaires favorisent un déséquilibre où la chaîne postérieure est sous-développée par rapport à la chaîne antérieure — une disproportion qui contribue à une posture affaiblie et des douleurs d'épaule. C'est pourquoi cette branche commence par le tirage (rowing) et la suspension, pas par la poussée : rééquilibrer avant d'ajouter.",
      },
      {
        titre: 'Ce que la Force construit pour les autres branches',
        texte: "La force construite ici n'est pas une fin en soi : elle nourrit directement les Figures (un handstand tient sur la force de poussée et d'épaule construite ici) et la Locomotion (chaque appui, chaque répulsion au sol s'appuie sur ce travail). Une bonne règle : si tu es sous 5 répétitions propres sur un exercice de Figures ou de Locomotion, la Force redevient prioritaire en attendant de rattraper ce socle.",
      },
      {
        titre: 'Fragmenter avant d\'assembler',
        texte: "Ce niveau applique très concrètement la première étape du Cycle d'apprentissage : Fragmenter. Plutôt que de te lancer directement sur un mouvement complexe (le muscle up, par exemple), on isole d'abord chaque qualité qui le compose — le tirage (rowing), la poussée (push-up), la suspension (tenue à un bras) — et on les travaille séparément. C'est exactement comme un musicien qui apprend d'abord ses notes avant de jouer un morceau : la qualité de cette phase de découpage conditionne directement la réussite de l'assemblage qui suivra aux niveaux 2 et 3.",
      },
      {
        titre: 'La coiffe des rotateurs, un point aveugle fréquent',
        texte: "Le rowing et la suspension sollicitent fortement les muscles stabilisateurs profonds de l'épaule (la coiffe des rotateurs), souvent négligés au profit des gros groupes musculaires visibles (pectoraux, dorsaux). Ces stabilisateurs sont pourtant ceux qui protègent l'articulation dans toutes les positions extrêmes que la suite de cette branche va explorer — anneaux, suspension à un bras, transitions. Un déficit ici ne se voit pas immédiatement, mais il finit toujours par limiter la progression ou par provoquer une gêne à l'épaule.",
        image: '/mentorship/theorie/protraction-retraction.png',
      },
      {
        titre: 'Ce que la force change vraiment dans le corps',
        texte: "Le travail de force ne se limite pas au volume musculaire. Il stimule la résilience des tendons et des os (leur densité augmente, réduisant le risque de blessure et d'ostéoporose), et agit en profondeur sur le système nerveux : le système nerveux central apprend à recruter plus de fibres musculaires à la fois (meilleure intensité de l'innervation), devient plus efficace et synchronisé (adaptabilité), et cet entraînement régulier retarde même la perte de neurones moteurs liée à l'âge. Le système nerveux périphérique — les nerfs qui relient la moelle épinière aux muscles — gagne lui aussi en qualité de transmission. La force n'est donc pas qu'une question de muscle : c'est un entraînement du système nerveux dans son ensemble.",
      },
      {
        titre: 'Peu de répétitions, beaucoup de récupération',
        texte: "Un exercice n'est un vrai travail de force que s'il ne peut être réalisé qu'entre 1 et 5 répétitions avec une technique correcte — au-delà, c'est déjà un travail d'endurance musculaire, une qualité différente. Ce seuil est propre à chacun : il dépend du poids corporel et du niveau de force du moment, pas d'une norme universelle. C'est pourquoi les temps de récupération sont ici volontairement longs (5 à 7 minutes) : le système nerveux, sollicité à haute intensité, a besoin de ce temps pour repartir aussi fort sur la série suivante.",
      },
      {
        titre: 'Déconstruire les idées reçues sur la force',
        texte: "Trois idées fausses circulent encore beaucoup autour du travail de force : qu'il conduirait automatiquement à une prise de volume musculaire excessive (« la gonflette »), qu'il serait réservé aux hommes, et qu'il serait sans intérêt pour les personnes plus âgées. Aucune de ces trois affirmations ne résiste à l'examen — bien structuré, le travail de force est bénéfique à tous les âges et à tous les genres, il prévient l'ostéoporose, stabilise les articulations, et n'a rien d'automatiquement synonyme de prise de masse. La force est une qualité entraînable par tout le monde, indépendamment du point de départ.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false, // théorie rédigée, QCM restant à écrire
    exercices: [
      { id: 'pushup-ring', nom: 'Push up ring', videoUrl: 'https://youtu.be/VM9s-3m7bAQ', theme: 'force',
        consigne: "Push-up complet sur les anneaux : mains sous les épaules, corps aligné de la tête aux pieds, poitrine qui vient frôler le niveau des anneaux. L'instabilité oblige les stabilisateurs de l'épaule à travailler en plus du grand pectoral et des triceps.",
        critereValidation: '3 séries de 10 répétitions, amplitude complète, alignement maintenu du début à la fin.',
        outils: [{ nom: 'Push-up scapulaire', videoUrl: 'https://youtu.be/EyquRXgGixk' }, { nom: 'Push up clean', videoUrl: 'https://youtu.be/ODwUMicVonw' }] },
      { id: 'rowing-unilat', nom: 'Rowing unilatérale', videoUrl: 'https://youtu.be/bW-nMmiKrSk', theme: 'force',
        consigne: "Rowing d'un seul bras à la fois. Tire avec le dos (rétraction scapulaire) plutôt qu'en fléchissant seulement le coude — corrige les déséquilibres gauche/droite avant la traction complète à un bras.",
        critereValidation: '3 séries de 8 répétitions par bras, tirage complet, buste stable sans rotation.',
        outils: [{ nom: 'Rowing anneaux (bilatéral)', videoUrl: 'https://youtu.be/XzIFzhI-lrU' }, { nom: 'Rowing circle - inside', videoUrl: 'https://youtu.be/Ksd3whqPvZ0' }] },
      { id: 'suspension-unilat', nom: 'Suspension unilatérale', videoUrl: 'https://youtu.be/Av2UT-xcGtc', theme: 'force',
        consigne: "Suspension à un seul bras, épaule engagée et non pendue : la scapula reste basse et rétractée, pas de hausse d'épaule vers l'oreille. Dernière brique avant la traction complète à un bras.",
        critereValidation: '3 tenues de 15 secondes par bras, épaule stable, pas de bascule du buste.',
        outils: [{ nom: 'Suspension active avec cambrure', videoUrl: 'https://youtu.be/M_kGV_n-p5o' }] },
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
    objectifPedagogique: "Comprendre pourquoi l'instabilité des anneaux ajoute une dimension de contrôle scapulaire à la force déjà acquise.",
    image: '/mentorship/force-2.png',
    theorie: [
      {
        titre: "L'instabilité comme amplificateur",
        texte: "Les anneaux ne pardonnent rien : la moindre stabilité manquante à l'épaule se voit immédiatement dans un tremblement ou une rotation parasite. C'est exactement pour ça qu'ils sont utilisés ici — la protraction et la rétraction scapulaire travaillées dans l'Armure Organique trouvent enfin un terrain où leur utilité devient évidente et nécessaire, pas seulement théorique.",
      },
      {
        titre: 'Skin the cat : la synthèse tirage-poussée',
        texte: "Le skin the cat combine dans un même mouvement ce que le tirage et la poussée ont construit séparément. C'est un bon indicateur : si la transition est brutale ou incontrôlée, c'est souvent le signe qu'un des deux axes (tirage ou poussée) est resté en retard sur l'autre.",
      },
      {
        titre: "Assembler : du fragment au chunk",
        texte: "Ce niveau correspond à la deuxième étape du Cycle d'apprentissage : Assembler. Les dips et tractions aux anneaux ne sont plus des qualités isolées mais des mouvements complets, où l'attention se porte sur la qualité d'exécution plutôt que sur le développement brut de la force. Le skin the cat va plus loin : il fusionne deux mouvements distincts (tirage et poussée) en une seule unité — ce que le document appelle un « chunk ». C'est la même logique qu'un musicien qui passe de la note isolée à l'accord.",
      },
      {
        titre: "Pourquoi l'instabilité change tout",
        texte: "Sur une surface fixe (barre, sol), le corps peut se reposer partiellement sur la structure elle-même. Sur des anneaux, chaque muscle stabilisateur doit rester actif en continu pour corriger les micro-oscillations — ce qui explique pourquoi un mouvement pourtant maîtrisé au sol ou à la barre redevient difficile aux anneaux. Cette exigence supplémentaire n'est pas un obstacle inutile : c'est elle qui construit la résilience articulaire qui protégera l'épaule dans les figures et transitions plus avancées.",
      },
      {
        titre: "Force dans l'alignement, puis force organique",
        texte: "On distingue le travail de force « dans l'alignement » — où l'effort respecte une posture de référence symétrique — de la force « organique », qui cherche au contraire à sortir de cet alignement pour apprendre au corps à s'adapter et à s'organiser face à une situation nouvelle. La force dans l'alignement est à privilégier en premier (c'est elle que tu as construite jusqu'ici) ; les anneaux, par leur instabilité, commencent déjà à demander cette force plus organique, adaptable, moins dépendante d'une position parfaite.",
      },
      {
        titre: 'Gérer son temps : trois façons de s\'organiser',
        texte: "À ce stade de la branche, la question de l'organisation de l'entraînement devient concrète. Trois approches existent : l'entraînement focalisé (une seule compétence à la fois, avec plus de récupération entre les séances car les mêmes zones sont sollicitées) ; l'entraînement priorisé (un groupe d'objectifs prioritaires et d'autres secondaires, qui se réorganisent au fur et à mesure des validations) ; l'entraînement diversifié (un objectif différent chaque jour, qui demande une régularité quasi quotidienne mais rend chaque compétence plus longue à approfondir). Aucune n'est meilleure dans l'absolu — c'est à toi de choisir celle qui correspond à ton emploi du temps et à ta patience.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'dips-anneaux', nom: 'Dips aux anneaux de gymnastique', videoUrl: 'https://youtu.be/QqSfP_g5sCM', theme: 'force',
        consigne: "Dips complet aux anneaux, épaules qui descendent sous les mains puis extension complète des coudes en haut. L'appui instable exige un verrouillage scapulaire fin en plus de la poussée triceps/pectoraux déjà acquise au sol.",
        critereValidation: '3 séries de 8 répétitions, amplitude complète, anneaux stables (pas de tremblement latéral en bas de mouvement).',
        outils: [{ nom: 'Iso dips (position basse)', videoUrl: 'https://youtu.be/6Ols9v6UA0I' }, { nom: 'Dips scap à la barre', videoUrl: 'https://youtu.be/-LgdBltlUvY' }] },
      { id: 'traction-anneaux', nom: 'Traction aux anneaux de gymnastique', videoUrl: 'https://youtu.be/P87xMGptjr4', theme: 'force',
        consigne: "Traction complète aux anneaux, menton au-dessus du niveau des mains. L'instabilité ajoute une exigence de stabilité scapulaire à la force de tirage déjà acquise au rowing.",
        critereValidation: '3 séries de 8 répétitions, amplitude complète (bras tendus en bas), anneaux stables.',
        outils: [{ nom: 'Traction progression', videoUrl: 'https://youtu.be/c8rqtZk83J4' }, { nom: 'Traction excentrique', videoUrl: 'https://youtu.be/Ksd3whqPvZ0' }] },
      { id: 'skin-the-cat', nom: 'Skin the cat', videoUrl: 'https://youtu.be/Cayfdp36_2Q', theme: 'force',
        consigne: "Depuis la suspension, enroule les jambes et fais basculer tout le corps en rotation arrière jusqu'à la position inversée, puis reviens en contrôlant la remontée. S'appuie directement sur la protraction/rétraction scapulaire de l'Armure Organique, qui donne la stabilité d'épaule nécessaire à la transition.",
        critereValidation: '3 répétitions complètes, montée ET descente contrôlées (pas de chute libre en fin de mouvement).',
        outils: [{ nom: 'Skin the cat — progression German hang', videoUrl: 'https://youtu.be/SOWsMAIX2Tc' }, { nom: 'Toes to bar', videoUrl: 'https://youtu.be/_VPnwAtdWPw' }] },
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
    objectifPedagogique: "Comprendre le muscle up comme synthèse complète, et ce que la force unilatérale libère pour la suite du parcours.",
    image: '/mentorship/force-3.png',
    theorie: [
      {
        titre: 'Le muscle up, sommet et synthèse',
        texte: "Le muscle up n'introduit aucune qualité nouvelle : il exige simplement que le tirage, la poussée et la stabilité scapulaire construits jusqu'ici fonctionnent ensemble, sans faille, dans une seule transition. C'est un excellent test — pas un but en soi.",
      },
      {
        titre: 'La force unilatérale, passerelle vers les autres branches',
        texte: "Travailler un seul côté à la fois (push-up unilatéral, traction à un bras) révèle et corrige les déséquilibres gauche/droite que les mouvements bilatéraux masquent facilement. Cette force asymétrique se retrouve directement dans les figures qui demandent du tirage (skin the cat, muscle up), et dans la Locomotion en suspension et en brachiation, où le poids du corps change constamment de côté.",
      },
      {
        titre: 'Amplifier et injecter : la suite du cycle',
        texte: "Ce niveau correspond aux deux dernières étapes du Cycle d'apprentissage. Amplifier : la difficulté augmente non pas en ajoutant un mouvement nouveau, mais en complexifiant ce qui existe déjà (passer du bilatéral à l'unilatéral, ajouter une transition). Injecter : la force construite dans cette branche est désormais réutilisée comme un simple « outil » au service d'objectifs plus larges — un handstand push-up en Figures, une brachiation en Locomotion. Le travail isolé d'une compétence n'a de sens que s'il finit par se recycler ailleurs.",
      },
      {
        titre: "Jouer sa peau : s'engager dans la durée",
        texte: "Une compétence de force se perd si elle n'est pas entretenue — c'est particulièrement vrai pour les mouvements avancés comme le muscle up, qui demandent un volume d'entraînement régulier pour rester acquis. S'engager dans ce travail (ce que le document appelle « jouer sa peau », en référence à Nassim Taleb) suppose d'accepter cette exigence sur la durée, pas seulement de viser la première réussite.",
      },
      {
        titre: 'Le Strength Project : de quatre appuis à un seul',
        texte: "Le sommet de la maîtrise du poids du corps suit une progression précise : quatre appuis, puis trois, puis deux, puis un seul — au sol ou en suspension. Chaque réduction d'appui oblige le corps à réajuster la répartition du poids et l'activation musculaire, renforçant au passage les muscles stabilisateurs et la coordination intermusculaire. Le travail unilatéral de ce niveau (push-up et traction à un bras) est exactement cette dernière marche : l'appui unique, où chaque muscle sollicité doit travailler en parfaite harmonie pour maintenir la position. Ce n'est pas qu'un exercice de force brute — c'est aussi un travail de stabilité articulaire et de conscience corporelle très fine.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'muscle-up', nom: 'Muscle up', videoUrl: 'https://youtu.be/nzRhNyAtVf0', theme: 'force',
        consigne: "Tirage puissant jusqu'à passer les anneaux/la barre au niveau du bassin, puis transition en poussée pour terminer bras tendus au-dessus. Repose entièrement sur les fondations scapulaires (protraction/rétraction) construites en Armure Organique.",
        critereValidation: '3 répétitions strictes (sans élan de jambes), transition fluide sans à-coup.',
        outils: [{ nom: 'Muscle up excentrique', videoUrl: 'https://youtu.be/nzRhNyAtVf0' }, { nom: 'MU Horizontal', videoUrl: 'https://youtu.be/FpASYrW6dwA' }, { nom: 'Muscle up - ring transition', videoUrl: 'https://youtu.be/LGKT7v0HCp0' }] },
      { id: 'pu-unilat', nom: 'Unilatérale Push up', videoUrl: 'https://youtu.be/-zXIsHTl9AU', theme: 'force',
        consigne: "Push-up sur un seul bras, l'autre main sert d'appui léger ou est placée dans le dos selon le niveau d'assistance. Sommet de la chaîne Pousser — cette force se retrouve directement dans le handstand push-up et la répulsion au sol en Locomotion.",
        critereValidation: '3 séries de 5 répétitions par bras avec assistance minimale, amplitude complète.',
        outils: [{ nom: 'Deep archer push up', videoUrl: 'https://youtu.be/7wxcOHEmA4k' }, { nom: 'Rings push ups', videoUrl: 'https://youtu.be/VM9s-3m7bAQ' }] },
      { id: 'archer-chin-up', nom: 'Archer Chin Up', videoUrl: 'https://youtu.be/3fVu6hYk1Yc', theme: 'force',
        consigne: "Traction où un bras tire pleinement pendant que l'autre reste tendu sur le côté en soutien. Prépare la charge asymétrique de la traction à un bras, dans la continuité de la suspension et du rowing unilatéral déjà acquis.",
        critereValidation: '3 séries de 5 répétitions par bras, bras opposé qui reste tendu (pas plié pour compenser).',
        outils: [{ nom: 'Typewriter chin up', videoUrl: 'https://youtu.be/jdmX7q0BReA' }, { nom: 'One arm chin up — progression 1', videoUrl: 'https://youtu.be/z5ciI56RhUY' }] },
      { id: 'toes-to-bar', nom: 'Toes to bar', videoUrl: 'https://youtu.be/_VPnwAtdWPw', theme: 'force',
        consigne: "En suspension bras tendus, amène les pieds jusqu'à la barre sans balancer le corps ni fléchir excessivement les coudes. Vrai test de la sangle abdominale en bras tendus, complémentaire du hollow hold de l'Armure Organique.",
        critereValidation: '3 séries de 8 répétitions, jambes tendues, pas d\'élan (kip) pour se faciliter la tâche.',
        outils: [{ nom: 'Genou poitrine en suspension', videoUrl: 'https://youtu.be/_VPnwAtdWPw' }, { nom: 'Skin the cat — progression German hang', videoUrl: 'https://youtu.be/SOWsMAIX2Tc' }] },
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
    objectifPedagogique: "Comprendre que l'amplitude construite ici doit rester fonctionnelle, pas seulement esthétique.",
    image: '/mentorship/flexibilite-1.png',
    theorie: [
      {
        titre: 'Une souplesse qui sert le mouvement',
        texte: "En Flexibilité, l'amplitude prime sur l'intensité : chercher la régularité plutôt que la performance. Mais l'objectif n'est jamais l'étirement pour lui-même — une souplesse développée sans intégration au mouvement reste un talent isolé, sans utilité réelle. Chaque position travaillée ici (Jefferson curl, straddle, squats de mobilité) doit à terme se retrouver disponible en mouvement, pas seulement statique.",
      },
      {
        titre: 'Ce que la Flexibilité prépare ailleurs',
        texte: "La souplesse construite ici nourrit directement la Locomotion, qui a besoin de grandes amplitudes de hanche pour la quadrupédie et le floor work, et les Figures, où le handstand et le pont exigent une ouverture d'épaule que la force seule ne donne pas. Une pratique qui ne travaille que la force sans la flexibilité complémentaire finit toujours par se limiter elle-même.",
      },
      {
        titre: 'Fragmenter une amplitude, articulation par articulation',
        texte: "Comme en Force, ce niveau applique la logique du Fragmenter : plutôt que de chercher une souplesse générale et vague, chaque exercice isole une articulation ou une chaîne précise — la colonne (Jefferson curl), la hanche en rotation externe (pigeon squat), la cheville (squat bulgare). Cette précision permet d'identifier clairement où se trouve la vraie limite du corps, plutôt que de deviner.",
      },
      {
        titre: 'Étirement statique et dynamique : deux outils différents',
        texte: "La science du sport distingue l'étirement statique (tenu, comme le Jefferson curl) de l'étirement dynamique (en mouvement contrôlé). Le premier construit l'amplitude passive, le second la rend utilisable en action — c'est pour cela que cette branche combine les deux dès le départ plutôt que de se limiter à l'un ou l'autre. Un corps qui n'a que de la souplesse statique reste souvent lent à mobiliser cette amplitude quand le mouvement l'exige réellement.",
      },
      {
        titre: 'Flexibilité ou mobilité ? Deux mots, deux réalités',
        texte: "Ces deux termes sont souvent confondus. La flexibilité désigne la capacité des muscles et des tissus conjonctifs à s'étendre, sur un axe précis. La mobilité, elle, concerne la capacité d'une articulation à bouger librement et sans douleur dans toute son amplitude. On peut être flexible sans être mobile (un muscle qui s'étire bien mais une articulation raide) ou l'inverse. Cette branche travaille les deux ensemble : les routines de mobilité articulaire construisent la mobilité, les étirements tenus construisent la flexibilité — les squats de mobilité de ce niveau (bulgare, pigeon) ciblent spécifiquement l'articulation, pas seulement le muscle.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'jefferson-curl', nom: 'Jefferson curl', videoUrl: 'https://youtu.be/DpqNwfWy0dA', theme: 'mobilite',
        consigne: "Debout sur un support surélevé, enroule la colonne vertèbre par vertèbre vers le bas, genoux tendus, jusqu'à l'étirement maximal de la chaîne postérieure, puis déroule dans l'autre sens. En flexibilité l'amplitude prime sur l'intensité : cherche la régularité plutôt que la performance.",
        critereValidation: '3 séries de 8 répétitions lentes et contrôlées, sans à-coup ni rebond.',
        outils: [{ nom: 'Routine stretch actif 1 — full', videoUrl: 'https://youtu.be/0XyyLXF1tAo' }] },
      { id: 'squat-bulgare-progression', nom: 'Squat bulgare — progression', videoUrl: 'https://youtu.be/rNh_ohNQBCc', theme: 'mobilite',
        consigne: "Pied arrière surélevé sur un support, descends en squat sur la jambe avant en gardant le buste droit. Travail débutant des squats unilatéraux — la cheville avant doit pouvoir fléchir librement sans que le talon décolle.",
        critereValidation: '3 séries de 8 répétitions par jambe, talon avant au sol du début à la fin.',
        outils: [{ nom: 'Squat cosaque ouvert', videoUrl: 'https://youtu.be/rwQvten_dg0' }] },
      { id: 'straddle-assis-debout-progression', nom: 'Straddle assis-debout — progression', videoUrl: 'https://youtu.be/ncKMvHELMiA', theme: 'mobilite',
        consigne: "Assis jambes écartées (straddle), pousse au sol pour passer en position debout sans refermer les jambes ni plier les genoux. Travaille la chaîne antérieure des adducteurs en amplitude active.",
        critereValidation: "3 tentatives avec assistance minimale (mains au sol), jambes qui restent tendues et écartées tout du long.",
        outils: [{ nom: 'Straddle fermeture', videoUrl: 'https://youtu.be/7zLuNIW3qm0' }, { nom: 'Straddle swing', videoUrl: 'https://youtu.be/35ov0kOlB78' }] },
      { id: 'pigeon-squat', nom: 'Pigeon squat', videoUrl: 'https://youtu.be/U3HpCKZ5yDc', theme: 'mobilite',
        consigne: "Une jambe pliée devant en rotation externe de hanche (position pigeon), l'autre tendue en arrière : descends et remonte en gardant le bassin face à l'avant. Travail intermédiaire de rotation externe de la hanche.",
        critereValidation: '3 séries de 6 répétitions par côté, bassin qui reste carré (pas de rotation compensatoire).',
        outils: [{ nom: 'Horse squat', videoUrl: 'https://youtu.be/sxyP-W2ql2g' }] },
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
    objectifPedagogique: "Comprendre la différence entre stretch passif et stretch actif, et pourquoi la charge accélère la progression.",
    image: '/mentorship/flexibilite-2.png',
    theorie: [
      {
        titre: 'Stretch actif : engager plutôt que relâcher',
        texte: "Un stretch tenu passivement (le poids du corps qui relâche dans la position) construit de l'amplitude, mais une amplitude fragile, difficile à utiliser en mouvement. Le stretch actif — engager les muscles autour de l'articulation étirée pendant l'étirement — construit une amplitude que le corps sait aussi contrôler, pas seulement atteindre.",
      },
      {
        titre: 'La charge comme accélérateur, pas comme objectif',
        texte: "Ajouter une charge (squat chargé, papillon avec charge) intensifie l'étirement en fin d'amplitude, là où le poids du corps seul ne suffit plus. Cette charge sert la progression du squat unilatéral en Flexibilité et prépare indirectement les positions chargées qu'on retrouve en Figures (pont haut) et en Force (positions statiques exigeantes).",
      },
      {
        titre: "Assembler : la routine complète",
        texte: "Ce niveau applique l'étape Assembler du Cycle d'apprentissage : les fragments travaillés isolément au niveau 1 (une articulation, une chaîne) sont désormais enchaînés en une routine complète, sans interruption. L'attention se déplace de la qualité brute de l'étirement vers la fluidité de l'enchaînement — exactement comme des notes isolées qui deviennent une phrase musicale.",
      },
      {
        titre: 'Pourquoi le stretch actif construit plus que de la souplesse',
        texte: "Contracter les muscles autour d'une articulation pendant qu'elle est étirée (stretch actif) entraîne le système nerveux à tolérer et contrôler cette amplitude, pas seulement le tissu à s'allonger. C'est cette différence qui explique pourquoi certaines personnes très souples passivement (jambes qui touchent le sol en grand écart passif) restent incapables de lever la jambe aussi haut activement : la souplesse existe, mais le contrôle moteur pour l'utiliser n'a jamais été construit.",
      },
      {
        titre: 'Trois flexibilités, trois usages',
        texte: "Au-delà de la distinction actif/passif, il existe une troisième forme : la flexibilité balistique, qui utilise des mouvements rythmiques et rebondissants pour repousser progressivement l'amplitude à chaque rebond. Elle renforce la résilience des tissus musculaires et tendineux face aux forces soudaines, mais demande davantage de précaution (les à-coups mal maîtrisés peuvent blesser). La flexibilité passive, elle, active le système nerveux parasympathique — elle est aussi un outil de récupération et de gestion du stress, pas seulement un moyen de gagner en amplitude.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'routine-stretch-actif-full', nom: 'Routine stretch actif 1 — full', videoUrl: 'https://youtu.be/0XyyLXF1tAo', theme: 'mobilite',
        consigne: "Enchaîne la routine complète de stretch actif : chaque position est tenue en engageant les muscles autour de l'articulation étirée (contraction active), pas juste relâchée passivement. Construit une souplesse utilisable en mouvement, pas seulement en statique.",
        critereValidation: 'Routine complète enchaînée sans interruption, chaque position tenue activement.',
        outils: [{ nom: 'Fragment stretch actif', videoUrl: 'https://youtu.be/rRXI-rQXMBc' }] },
      { id: 'jefferson-curl-straddle', nom: 'Jefferson curl straddle', videoUrl: 'https://youtu.be/exMdSnDCUyU', theme: 'mobilite',
        consigne: "Jefferson curl jambes écartées (straddle) : enroule la colonne vers le bas entre les jambes. Cible en plus des adducteurs et des rotateurs externes de hanche, en complément du Jefferson curl classique.",
        critereValidation: '3 séries de 8 répétitions lentes, amplitude progressive sans forcer.',
        outils: [{ nom: 'Jefferson curl', videoUrl: 'https://youtu.be/DpqNwfWy0dA' }] },
      { id: 'horse-squat', nom: 'Horse squat', videoUrl: 'https://youtu.be/sxyP-W2ql2g', theme: 'mobilite',
        consigne: "Squat large, pieds tournés vers l'extérieur, descends en gardant le dos droit et les genoux dans l'axe des pieds. Ouvre la hanche en rotation externe, base de tous les squats unilatéraux qui suivent.",
        critereValidation: '3 séries de 10 répétitions, amplitude complète, genoux qui ne rentrent pas vers l\'intérieur.',
        outils: [{ nom: 'Squat cosaque ouvert', videoUrl: 'https://youtu.be/rwQvten_dg0' }, { nom: 'Straddle swing', videoUrl: 'https://youtu.be/35ov0kOlB78' }] },
      { id: 'dragon-squat-unilateral', nom: 'Dragon squat unilatéral', videoUrl: 'https://youtu.be/-HPktyi536s', theme: 'mobilite',
        consigne: "Squat sur une jambe, l'autre tendue sur le côté (position dragon). La cheville de la jambe porteuse doit fléchir librement — c'est souvent elle, plus que la force du quadriceps, qui limite la descente.",
        critereValidation: '3 séries de 5 répétitions par jambe, talon qui reste au sol.',
        outils: [{ nom: 'Flexion cheville active', videoUrl: 'https://youtu.be/Q6CHGnGFJRM' }, { nom: 'Sissy squat — progression', videoUrl: 'https://youtu.be/nW1k0BdzyqA' }] },
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
    objectifPedagogique: "Comprendre pourquoi la mobilité de cheville conditionne les squats unilatéraux plus que la force des quadriceps.",
    image: '/mentorship/flexibilite-3.png',
    theorie: [
      {
        titre: 'La cheville, facteur limitant caché',
        texte: "Une cheville peu flexible limite tous les squats unilatéraux (bulgare, dragon, sissy), même avec de bons quadriceps — le corps compense en levant le talon ou en penchant le buste, ce qui casse la technique bien avant que la force ne manque. Travailler ses points faibles plutôt que ses points forts est ici la clé, même quand c'est moins gratifiant.",
      },
      {
        titre: 'Chaîne antérieure et postérieure, une paire indissociable',
        texte: "Pour le bas du corps, la chaîne antérieure (quadriceps, fléchisseurs de hanche) et la chaîne postérieure (ischios, fessiers) sont complémentaires, tout comme la rotation interne et externe de hanche. Négliger l'une pour l'autre crée exactement le même déséquilibre que celui décrit entre tirage et poussée en Force — la logique d'équilibre systémique traverse toutes les branches, pas seulement celle-ci.",
      },
      {
        titre: 'Amplifier et injecter : une souplesse qui devient outil',
        texte: "Ce dernier niveau amplifie la complexité (diagonale, charge, enchaînement des 4 squats) puis injecte cette souplesse comme un outil au service d'autres apprentissages : le pancake sert le travail au sol en Locomotion, l'ouverture de hanche sert les figures les plus exigeantes. La flexibilité cesse ici d'être un objectif en soi pour devenir une ressource disponible ailleurs.",
      },
      {
        titre: 'Pourquoi travailler ses points faibles plutôt que ses points forts',
        texte: "Il est tentant de s'entraîner sur ce qu'on réussit déjà bien, car c'est gratifiant. Mais en flexibilité plus qu'ailleurs, c'est le maillon le plus faible qui détermine ce que le corps peut réellement faire : une cheville raide limite un squat même avec d'excellents quadriceps, une hanche fermée limite une amplitude de jambe même avec un dos très souple. Identifier honnêtement sa propre limite, sans la contourner, est ce qui distingue une progression solide d'une progression illusoire.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'diagonal-stretch', nom: 'Diagonal stretch', videoUrl: 'https://youtu.be/2yqAw7LeRlk', theme: 'mobilite',
        consigne: "Étirement en diagonale qui combine chaîne postérieure et rotation — un pied avancé en diagonale, buste qui s'enroule vers la jambe opposée. Niveau intermédiaire, juste après le sissy squat dans la progression.",
        critereValidation: '3 tenues de 20 secondes par côté, respiration calme, pas de compensation dans le bas du dos.',
        outils: [{ nom: 'Jefferson curl', videoUrl: 'https://youtu.be/DpqNwfWy0dA' }] },
      { id: 'pancake-loaded', nom: 'Pancake loaded', videoUrl: 'https://youtu.be/-0JIuM_S6zg', theme: 'mobilite',
        consigne: "Pancake (buste vers l'avant jambes tendues écartées) avec une charge additionnelle sur le dos pour intensifier l'étirement. Niveau avancé de la famille straddle, juste avant l'objectif final de la branche.",
        critereValidation: '3 tenues de 30 secondes, buste qui reste plat et actif (pas juste posé par la charge).',
        outils: [{ nom: 'Papillon avec charge', videoUrl: 'https://youtu.be/baLUesFruG0' }] },
      { id: 'good-morning-unilateral', nom: 'Good morning unilatéral', videoUrl: 'https://youtu.be/1gJbxRFwS80', theme: 'mobilite',
        consigne: "Sur une jambe, buste qui bascule vers l'avant en gardant le dos plat, l'autre jambe qui se lève en extension à l'arrière (chaîne postérieure en unilatéral). Complémentaire de la chaîne antérieure travaillée par les squats de la branche.",
        critereValidation: '3 séries de 6 répétitions par jambe, dos plat du début à la fin, pas de rotation du bassin.',
        outils: [{ nom: 'Good morning unilatéral — flexion de cheville', videoUrl: 'https://youtu.be/Vf_zMK1oov8' }] },
      { id: 'big-4-squats', nom: 'Big 4 squats', videoUrl: 'https://youtu.be/ediycvN5YdA', theme: 'mobilite',
        consigne: "Enchaînement des 4 squats unilatéraux majeurs de la branche (bulgare, dragon, pigeon, sissy) à la suite. Objectif final des squats unilatéraux : la mobilité de cheville, souvent le vrai facteur limitant, conditionne la réussite ici plus que la force des quadriceps.",
        critereValidation: 'Les 4 squats enchaînés, 3 répétitions chacun par jambe, sans pause prolongée entre eux.',
        outils: [{ nom: 'Flexion cheville active', videoUrl: 'https://youtu.be/Q6CHGnGFJRM' }, { nom: 'Stretch mollets', videoUrl: 'https://youtu.be/xM9sP2J1d6E' }] },
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
    objectifPedagogique: "Comprendre les caractéristiques propres à la Locomotion : intention, maîtrise et contrôle plutôt que simple exécution.",
    image: '/mentorship/locomotion-1.png',
    theorie: [
      {
        titre: 'Intention, maîtrise, contrôle',
        texte: "Chaque déplacement en Locomotion est dirigé par une intention claire, qui engage tout le corps et oriente chaque appui. L'objectif n'est pas d'exécuter un mouvement mais de le maîtriser pleinement : cela implique un dosage fin de la tension musculaire, de l'équilibre et de la respiration. Ralentir la cadence permet de ressentir et d'affiner les détails du geste — le corps reste actif en permanence, même dans les transitions les plus lentes.",
      },
      {
        titre: 'La Locomotion exprime ce que les autres branches construisent',
        texte: "Cette branche est celle où tout ce qui est développé ailleurs se retrouve intégré : la force de la branche Force soutient chaque répulsion au sol, la souplesse de la branche Flexibilité permet les amplitudes de hanche nécessaires à la quadrupédie. La Locomotion ne construit pas des qualités isolées, elle les exprime dans un mouvement global et intentionnel.",
      },
      {
        titre: 'Une progression qui suit un ordre logique',
        texte: "Le travail au sol se construit dans un ordre précis : Floor work, puis Bipédie, puis Quadrupédie, puis Brachiation, puis Reptation. Chaque famille prépare la suivante — la quadrupédie développe la coordination des membres inférieurs et supérieurs ensemble, indispensable avant d'aborder la brachiation en suspension. Sauter les étapes fonctionne rarement : la dette de coordination se paie tôt ou tard.",
      },
      {
        titre: "Le Cycle d'apprentissage, pensé pour la Locomotion",
        texte: "Le Cycle d'apprentissage (Fragmenter → Assembler → Amplifier → Injecter) concerne toutes les branches, mais c'est en Locomotion qu'il prend tout son sens, car c'est l'exemple même sur lequel il a été pensé : on se constitue d'abord un vocabulaire de base de mouvements isolés (Fragmenter), on étudie ensuite comment créer des liens entre eux, du plus simple au plus complexe (Assembler), puis on utilise ces compétences dans des jeux créatifs et d'expression (Amplifier), avant de réinjecter le tout dans un apprentissage plus vaste (Injecter). Toute cette branche est construite sur cette logique, niveau après niveau.",
        image: '/mentorship/theorie/cycle-apprentissage.png',
      },
      {
        titre: 'Le sol comme partenaire, pas comme obstacle',
        texte: "Le sol est un allié avec lequel on apprend : il guide à travers de nombreux retours sensoriels — équilibre instable, glissements, résistance à la pression. Ces informations révèlent la qualité de l'implication corporelle. Plutôt que de s'imposer à lui, on cherche un compromis, une qualité d'échange avec ce qu'il transmet. Les freins les plus courants sont d'ailleurs souvent mentaux (le regard des autres, le refus du contact avec le sol) avant d'être physiques — il est plus simple de préparer le corps que de déconstruire ces réticences, d'où l'intérêt d'y aller progressivement.",
      },
      {
        titre: "Des modes de déplacement organisés par altitude",
        texte: "Les différents modes de locomotion s'organisent selon une logique d'éloignement vertical du sol : de la reptation (au sol) à la brachiation (suspendu), en passant par la quadrupédie, la bipédie et jusqu'au saut. Chaque mode sollicite le corps différemment et développe une expérience motrice distincte — c'est pourquoi cette branche les explore tous plutôt que de se spécialiser dans un seul registre.",
      },
      {
        titre: "Sortir de la salle : la pratique environnementale",
        texte: "La Locomotion ne se limite pas à un espace dédié : elle inclut la capacité à interagir avec un environnement réel — urbain ou naturel. Un arbre, un muret, un relief deviennent des partenaires d'entraînement à part entière, ajoutant une dimension d'adaptabilité et de créativité qu'aucune salle ne peut recréer à l'identique. Cette pratique développe en prime la pensée spatiale et la prise de décision rapide : le terrain change, jamais deux séances en extérieur ne se ressemblent vraiment.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'quadrupedie-deplacement-base', nom: 'Quadrupédie — déplacements de base', videoUrl: 'https://youtu.be/EDhBUqhBX4o', theme: 'mobilite',
        consigne: "Déplacements à quatre appuis (mains + pieds) : avance en gardant le bassin bas et les hanches mobiles, poids réparti entre les 4 points d'appui plutôt que porté par les bras. Base de toute la famille Quadrupédie.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les différents éléments de quadrupédie basique.',
        outils: [{ nom: 'Quadrupédie — basic work', videoUrl: 'https://youtu.be/YjzgKF-855o' }] },
      { id: 'bipedie-squats-fragment', nom: 'Bipédie — les squats de base (fragment)', videoUrl: 'https://youtu.be/4h65QpV3OY0', theme: 'mobilite',
        consigne: "Fragment isolé du squat de déplacement en bipédie : travaille la qualité de chaque squat (profondeur, contrôle) séparément avant de l'enchaîner en mouvement continu.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les Squats basiques.',
        outils: [{ nom: 'Bipédie — les squats de base (assemblage)', videoUrl: 'https://youtu.be/NB00Mhc9qA8' }] },
      { id: 'routine-assise-complete', nom: 'Routine assise complète', videoUrl: 'https://youtu.be/x2hWwXRc8tA', theme: 'mobilite',
        consigne: "Enchaîne la routine assise complète telle que démontrée : chaque transition au sol reliée à la suivante sans à-coup. Fragment de base du travail assis, avant d'y ajouter du jeu libre.",
        critereValidation: 'Mémoriser, réaliser et jouer avec la routine.',
        outils: [{ nom: 'Play with : routine assise', videoUrl: 'https://youtu.be/5eFKp3f8OXY' }] },
      { id: 'floor-work-basic', nom: 'Floor work basique', videoUrl: 'https://youtu.be/6ETL4STnuJM', theme: 'mobilite',
        consigne: "Bases du travail au sol : transitions simples entre positions assises, couchées et à quatre appuis, en gardant le mouvement continu plutôt que des arrêts francs entre chaque position.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les transitions de base au sol.',
        outils: [{ nom: 'Roulade arrière', videoUrl: 'https://youtu.be/XPEPsuS9cKc' }] },
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
    objectifPedagogique: "Comprendre les bienfaits physiques spécifiques de la Locomotion : force organique, endurance, équilibre dynamique.",
    image: '/mentorship/locomotion-2.png',
    theorie: [
      {
        titre: 'Force organique et équilibre dynamique',
        texte: "Le corps apprend ici à produire et transférer la force dans des mouvements globaux, en chaîne, sans déperdition — c'est ce qu'on appelle la force organique, différente de la force isolée travaillée en musculation classique. La brachiation ajoute une dimension supplémentaire : gérer l'équilibre en déplacement suspendu, en rotation, en transition d'un bras à l'autre, sans jamais perdre le contrôle.",
      },
      {
        titre: 'Le pont, pont entre les branches',
        texte: "La rotation sur le pont bas suppose déjà la posture du pont maîtrisée côté Figures — c'est un exemple concret de la manière dont les branches se nourrissent entre elles plutôt que de progresser isolément. Une compétence acquise dans une branche devient souvent le point de départ d'un chunk dans une autre.",
      },
      {
        titre: 'Le corps comme système, pas comme collection de muscles',
        texte: "En Locomotion, le mouvement part de l'intérieur : tout est relié, aucune zone n'est passive. C'est là que la pratique corporelle cesse d'être une collection de compétences isolées (un bon dos, de bonnes épaules, de bonnes jambes) pour devenir un système cohérent. La brachiation en particulier ne fonctionne que si l'épaule, le tronc et le regard collaborent en continu — isoler un seul de ces éléments fait s'effondrer tout le reste.",
      },
      {
        titre: 'Endurance et respiration, un couple indissociable',
        texte: "La locomotion mobilise le corps sur des temps sous tension prolongés, ce qui génère une fatigue progressive — gérée par une respiration fluide, intimement liée au rythme du mouvement. C'est une différence importante avec le travail de force pure : ici, retenir sa respiration ou la désynchroniser du mouvement épuise beaucoup plus vite que l'effort musculaire lui-même.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'basic-hand-transitions', nom: 'Basic hand transitions', videoUrl: 'https://youtu.be/2KjUURny8fY', theme: 'mobilite',
        consigne: "Transitions des mains qui mélangent bipédie et brachiation : change d'appui (mains/pieds) sans temps mort, en gardant le regard sur la trajectoire plutôt que sur les mains.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les transitions de base.',
        outils: [{ nom: 'Brachiation — basic works', videoUrl: 'https://youtu.be/2ooV-ZXMCDM' }] },
      { id: 'brachiation-bases', nom: 'Locomotion — les bases de brachiation', videoUrl: 'https://youtu.be/nWe3uMHXQjE', theme: 'mobilite',
        consigne: "Déplacement suspendu (brachiation) : le transfert de poids se fait en anticipant l'appui suivant, épaule engagée plutôt que pendue à chaque prise. Développe la mobilité et la résilience de la chaîne antérieure, épaules et hanches.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les différents éléments de brachiation.',
        outils: [{ nom: 'Brachiation — basic works', videoUrl: 'https://youtu.be/2ooV-ZXMCDM' }, { nom: 'Brachiation assemblage', videoUrl: 'https://youtu.be/ZL4NPELHrfI' }] },
      { id: 'rotation-pont-bas', nom: 'Rotation sur le pont bas', videoUrl: 'https://youtu.be/9G-WD45kN-E', theme: 'mobilite',
        consigne: "Depuis le pont bas, fais pivoter le bassin et les appuis pour tourner autour de son axe sans casser la posture d'ouverture. Suppose la posture du pont déjà maîtrisée côté Figures.",
        critereValidation: '3 rotations complètes de chaque côté, posture du pont maintenue tout du long.',
        outils: [{ nom: 'Structure du pont', videoUrl: 'https://youtu.be/v_LhRiLbbBA' }] },
      { id: 'au-cortado', nom: 'Au cortado', videoUrl: 'https://youtu.be/0J-LcVLkz1g', theme: 'mobilite',
        consigne: "Mouvement avancé de brachiation qui enchaîne rotation et changement de direction en suspension. Sommet de la famille Brachiation, une fois les bases et l'assemblage acquis.",
        critereValidation: 'Mouvement réalisé de façon fluide, sans hésitation entre les phases.',
        outils: [{ nom: 'Roue contro-ipsi', videoUrl: 'https://youtu.be/vmPUrEFhzYM' }] },
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
    objectifPedagogique: "Comprendre la Locomotion comme langage corporel et terrain d'exploration sans fin, pas comme une liste de tricks à cocher.",
    image: '/mentorship/locomotion-3.png',
    theorie: [
      {
        titre: 'Un langage qui révèle le travail interne',
        texte: "La Locomotion est un langage qui traduit la qualité du travail interne : elle révèle la précision, la concentration, la finesse du contrôle. Un pratiquant expérimenté donne une impression de facilité, de gestes lissés et continus, sans à-coup — même dans l'explosivité, tout reste fluide et délibéré. C'est ici que la branche Connexion prend tout son sens : la précision du contrôle moteur fin qu'elle développe se voit directement dans la qualité visuelle du mouvement.",
      },
      {
        titre: 'La self-dominance : laisser le corps décider',
        texte: "Le jeu de self-dominance inverse la logique habituelle d'apprentissage : au lieu de suivre un pattern fixe, on laisse le corps improviser et décider du mouvement suivant. C'est l'aboutissement naturel de tout ce qui précède — un vocabulaire de mouvement suffisamment intégré pour ne plus avoir besoin d'être pensé consciemment à chaque instant.",
      },
      {
        titre: 'Une créativité qui devient personnelle',
        texte: "Avec le temps et la pratique régulière, chaque pratiquant s'approprie son propre vocabulaire de mouvement et développe un style qui lui est propre — les choix de trajectoire, de rythme et d'engagement varient d'une personne à l'autre. La Locomotion est un terrain d'exploration sans fin : elle ne s'épuise pas, elle évolue avec le pratiquant. Ce niveau ne marque donc pas une fin, mais le moment où le travail dirigé laisse place à une recherche plus personnelle.",
      },
      {
        titre: "De l'étudiant au chercheur",
        texte: "Étudier Force, Flexibilité, Locomotion et Connexion séparément, comme tu viens de le faire à travers ces cinq branches, correspond à la démarche de l'étudiant : comprendre chaque secteur en profondeur, un par un. L'étape suivante, celle du chercheur, consiste à explorer les intersections entre ces secteurs — comment la force d'épaule nourrit le handstand, comment la souplesse de hanche libère la quadrupédie. Tu as déjà commencé cette démarche sans le savoir, à chaque fois qu'un lien entre deux branches t'a été signalé dans ce parcours.",
      },
      {
        titre: 'Une école du corps, pas une collection de tricks',
        texte: "La Locomotion ne montre pas un « trick » isolé, elle enseigne comment bouger intelligemment. La capacité à lire, décoder et déconstruire les mouvements des autres pratiquants (Injecter, dans le Cycle d'apprentissage) devient à ce niveau aussi importante que la capacité à les exécuter soi-même — c'est elle qui permet de continuer à progresser seul, bien après la fin de ce parcours guidé.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'lizard-crawl-progression', nom: 'Lizard crawl — progression', videoUrl: 'https://youtu.be/tH99d4cs6Hc', theme: 'mobilite',
        consigne: "Déplacement lézard au sol : torse qui frôle le sol à chaque passage, coude et genou opposés qui avancent ensemble. Ajoute fluidité et vitesse au déplacement de base.",
        critereValidation: 'Mémoriser, réaliser et jouer avec les différents éléments de reptation.',
        outils: [{ nom: 'Lizard — base reptation', videoUrl: 'https://youtu.be/K6pRL2rdYaM' }] },
      { id: 'qdr-switch', nom: 'QDR switch', videoUrl: 'https://youtu.be/jzRmpCTLMxs', theme: 'mobilite',
        consigne: "Depuis la position de QDR (quadrupédie renversée/isolée), change de côté sans reposer les appuis au sol entre les deux. Suppose la figure du QDR déjà maîtrisée côté Figures.",
        critereValidation: '3 changements de côté par série, contrôle maintenu sans à-coup.',
        outils: [{ nom: 'Routine isolation 2 — QDR', videoUrl: 'https://youtu.be/OeSxhqDIm7A' }] },
      { id: 'self-dominance-squat', nom: 'Self-dominance squat', videoUrl: 'https://youtu.be/8FAjwRHjrx4', theme: 'mobilite',
        consigne: "Jeu d'improvisation en squat : laisse le corps décider du mouvement suivant plutôt que de suivre un pattern fixe, en restant fluide et bas. Développe la self-dominance — la capacité à improviser sans perdre en qualité de mouvement.",
        critereValidation: '2 minutes de mouvement continu sans temps mort ni répétition du même pattern.',
        outils: [{ nom: 'Locomotion game — self dominance 2', videoUrl: 'https://youtu.be/hTCr4hWAs_E' }] },
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
    objectifPedagogique: "Comprendre la Connexion comme travail interne, distinct des autres branches par sa nature même.",
    image: '/mentorship/connexion-1.png',
    theorie: [
      {
        titre: "Un travail d'un autre ordre",
        texte: "Là où Force, Flexibilité, Figures et Locomotion développent des qualités physiques visibles, la Connexion travaille quelque chose de plus interne : la concentration, la mémorisation, la proprioception, la coordination. Ce sont des compétences cognitives et psychomotrices — le premier ordre de priorité dans toute progression, avant même la mobilité ou la force, car un mouvement mal ressenti ne peut pas être bien corrigé.",
      },
      {
        titre: 'Contenu et contenant : la dualité du mouvement',
        texte: "Le travail de Rudolf Laban, pionnier de l'analyse du mouvement, distingue le « contenant » d'un mouvement (sa forme visible, ce qui permet de le reconnaître et de le nommer) et son « contenu » (l'intention et les qualités déployées pour le réaliser — coordination, force, équilibre, mémorisation). Un même contenant peut être rempli de contenus très différents selon le niveau du pratiquant : deux personnes qui font « le même » mouvement ne recrutent jamais exactement les mêmes qualités avec la même intensité.",
        image: '/mentorship/theorie/fragmenter-biceps-curl.png',
      },
      {
        titre: 'Qualités majeures et qualités mineures',
        texte: "Chaque mouvement recrute une qualité majeure (son noyau) entourée de qualités mineures. Un biceps curl sollicite principalement la force du bras, avec très peu de couches autour. Un handstand, à l'inverse, recrute un nombre de qualités bien supérieur — équilibre, force d'épaule, mobilité de poignet, contrôle postural, concentration — empilées en couches successives. Apprendre à repérer cette différence, c'est apprendre à juger correctement la difficulté réelle d'un mouvement avant de s'y lancer.",
        image: '/mentorship/theorie/fragmenter-handstand.png',
      },
      {
        titre: 'Connexion externe : le corps qui répond vite et juste',
        texte: "Au niveau physiologique, la connexion externe consiste à optimiser le contrôle de l'influx nerveux pour améliorer le timing, la précision et la maîtrise du geste. Elle englobe la capacité à coordonner les membres de manière indépendante, à manipuler des objets avec adresse, à synchroniser ses mouvements avec ceux d'un partenaire, et à développer des réflexes rapides face à l'imprévu — exactement ce que travaillent les jeux de dribble et de manipulation de cette branche.",
      },
      {
        titre: 'Connexion interne : rester immobile et présent',
        texte: "À l'opposé, la connexion interne est la capacité à rester immobile et concentré, connecté à ses propres processus internes — la conscience de soi, la capacité à canaliser son attention, la maîtrise de l'esprit. C'est le registre de la méditation, de la respiration consciente, du tir à l'arc. Une pratique du mouvement complète a besoin des deux : l'externe sans l'interne devient de l'agitation sans direction ; l'interne sans l'externe reste une théorie jamais mise en action.",
      },
      {
        titre: "L'équilibre interne au service de l'externe",
        texte: "La Connexion apporte un équilibre entre le contrôle interne (ce que tu ressens et diriges consciemment) et l'expression externe (ce que ton corps produit réellement). Un pratiquant très fort ou très souple mais peu connecté à son corps aura du mal à affiner son geste ; la Connexion est ce qui permet aux autres branches de gagner en précision, pas seulement en amplitude ou en puissance.",
      },
      {
        titre: 'Immobilité et mobilité : le yin et le yang du mouvement',
        texte: "L'immobilité — comme dans une posture tenue ou un moment de concentration avant un geste précis — est un contrepoids essentiel à la mobilité. Elle permet la prise de conscience corporelle et active le système parasympathique (relaxation, récupération), tandis que la mobilité active le système sympathique et renforce le corps. Une pratique qui ne serait que mouvement, sans jamais de moment d'immobilité consciente, se prive de la moitié de ce que le corps a à offrir.",
      },
      {
        titre: 'Pourquoi cette branche vient en premier dans la priorité',
        texte: "Dans l'organisation générale de la pratique, l'ordre de priorité recommandé est : cognitif et psychomoteur d'abord (concentration, mémorisation, proprioception, coordination), puis mobilité et renforcement, puis stretch, puis force. Ce n'est pas un hasard : un geste mal ressenti ne peut pas être bien corrigé, quelle que soit la force ou la souplesse disponible pour l'exécuter. La Connexion travaille exactement cette première brique, souvent invisible mais fondatrice.",
      },
      {
        titre: 'La myélinisation, ou comment un geste devient automatique',
        texte: "Chaque répétition consciente d'un geste de coordination renforce la gaine de myéline autour des circuits nerveux sollicités — un mécanisme physiologique qui rend le signal nerveux plus rapide et plus fiable à chaque passage. C'est pour cela qu'un jeu de manipulation qui semble anodin (faire rouler une balle d'une main à l'autre) a un effet réel sur la qualité motrice globale : le système nerveux ne fait pas de distinction entre un geste « utile » et un geste « ludique », il renforce ce qui est répété avec attention.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'brain-work-1', nom: 'Brain work 1', videoUrl: 'https://youtu.be/EdrHn-ipZS0', theme: 'mobilite',
        consigne: "Premier niveau de Brain work : enchaîne la séquence de coordination démontrée en gardant un rythme régulier, quitte à ralentir plutôt que de perdre la précision. La Connexion est un travail interne, complémentaire de la force et de la souplesse, pas une simple répétition de geste.",
        critereValidation: 'Séquence complète réalisée 3 fois de suite sans erreur.',
        outils: [{ nom: 'Brain work 2', videoUrl: 'https://youtu.be/c4J3BNvYmjU' }] },
      { id: 'dribble-2-balles-coordonnees', nom: 'Dribble 2 balles coordonnées', videoUrl: 'https://youtu.be/tjXgfNBTz-M', theme: 'mobilite',
        consigne: "Dribble à deux balles en rythme coordonné (les deux mains ensemble) : regard qui reste devant soi, pas fixé sur les balles. Un cran de complexité au-dessus du dribble simple à une balle.",
        critereValidation: 'Réalisez 30 rebonds enchaînés.',
        outils: [{ nom: 'Connexion — manipulation 1 balle', videoUrl: 'https://youtu.be/qhfai2Nq0dI' }] },
      { id: 'manipulation-1-balle', nom: 'Connexion — manipulation 1 balle', videoUrl: 'https://youtu.be/qhfai2Nq0dI', theme: 'mobilite',
        consigne: "Manipulation libre d'une seule balle : fais-la rouler et passer d'une main à l'autre, autour du corps, sans la laisser tomber. Base du contrôle d'objet, point de départ de toute la famille Manipulation.",
        critereValidation: '1 minute de manipulation continue sans faire tomber la balle.',
        outils: [{ nom: 'Réflexe balle', videoUrl: 'https://youtu.be/4y13rzDMJ2s' }] },
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
    objectifPedagogique: "Approfondir le contrôle du rythme et la coordination avec les pieds, un axe distinct de la coordination des mains.",
    image: '/mentorship/connexion-2.png',
    theorie: [
      {
        titre: 'Une nouvelle coordination : les pieds',
        texte: "Les dribbles de pieds demandent une coordination différente de celle des mains — moins précise dans le détail, mais plus exigeante en équilibre et en anticipation. C'est une occasion de constater que la coordination n'est pas une compétence unique et transférable d'un membre à l'autre : chaque nouvelle combinaison doit être reconstruite.",
      },
      {
        titre: 'Le rythme comme fil conducteur',
        texte: "Les jeux de percussion introduisent une dimension rythmique qui traverse toute la famille Brain work : le contrôle moteur fin devient plus exigeant quand il doit aussi respecter un tempo. Cette même exigence de rythme et de fluidité se retrouve directement en Locomotion, où un mouvement techniquement correct mais mal rythmé perd toute sa qualité visuelle.",
      },
      {
        titre: 'La latéralisation, un chantier discret mais essentiel',
        texte: "Dribbler avec les pieds sollicite la coordination entre les deux hémisphères du cerveau et la latéralisation — la capacité à faire travailler les deux côtés du corps de façon différenciée et complémentaire. C'est une compétence qui se construit dès l'enfance mais qui reste entraînable à tout âge : chaque nouveau pattern moteur difficile au début (dribbler du pied non-dominant, par exemple) muscle littéralement cette capacité de coordination inter-hémisphérique.",
      },
      {
        titre: "Compenser sans dominer",
        texte: "Une pratique statique (comme la Force) mérite des outils dynamiques et en grande amplitude pour compenser ; une pratique en fermeture mérite des outils qui favorisent l'ouverture, et inversement. La Connexion joue souvent ce rôle de compensation dans une semaine d'entraînement chargée en Force ou en Figures : elle repose le corps de l'intensité tout en continuant à progresser sur un axe différent.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'dribbles-pieds-phase-1', nom: 'Dribbles de pieds — phase 1', videoUrl: 'https://youtu.be/q9DWr5q_jd8', theme: 'mobilite',
        consigne: "Contrôle fin du ballon avec les pieds, petites touches successives sans le laisser s'éloigner. Point de départ de la famille Dribble pieds, une coordination distincte de celle des mains.",
        critereValidation: 'Réalisez 30 rebonds enchaînés.',
        outils: [{ nom: 'Dribbles de pieds — progression', videoUrl: 'https://youtu.be/glNItA2wrZk' }] },
      { id: 'dribble-2-balles-2-mains', nom: 'Dribble 2 balles — 2 mains', videoUrl: 'https://youtu.be/ZWTVQqZSTPQ', theme: 'mobilite',
        consigne: "Dribble à deux balles avec les deux mains en simultané puis en alterné, en gardant un rythme stable. Demande de transférer le poids et coordonner le corps par rapport à l'objet.",
        critereValidation: 'Réalisez 30 rebonds enchaînés.',
        outils: [{ nom: 'Dribble 2 balles coordonnées', videoUrl: 'https://youtu.be/tjXgfNBTz-M' }] },
      { id: 'brain-work-3', nom: 'Brain work 3', videoUrl: 'https://youtu.be/8ADflr3ygJk', theme: 'mobilite',
        consigne: "Suite du Brain work : la précision et la concentration demandées augmentent par rapport aux niveaux précédents. Enchaîne la séquence sans ralentir pour compenser la difficulté.",
        critereValidation: 'Séquence complète réalisée 3 fois de suite sans erreur.',
        outils: [{ nom: 'Brain work 4', videoUrl: 'https://youtu.be/oS2ZUqftDfI' }] },
      { id: 'jeux-de-percussion', nom: 'Jeux de percussion', videoUrl: 'https://youtu.be/lHr3wfgUQb0', theme: 'mobilite',
        consigne: "Jeux de rythme et de coordination fine avec les mains, en percussion sur le corps ou un support. Sommet de la famille Brain work, une fois les 4 niveaux précédents acquis.",
        critereValidation: 'Séquence rythmique complète réalisée sans décalage.',
        outils: [{ nom: 'Brain work 5', videoUrl: 'https://youtu.be/Rlan5rrsMUU' }] },
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
    objectifPedagogique: "Comprendre le contrôle moteur fin comme le raffinement final qui distingue la maîtrise de la simple exécution.",
    image: '/mentorship/connexion-3.png',
    theorie: [
      {
        titre: 'Le contrôle moteur fin, dernier raffinement',
        texte: "Manipuler un ballon en équilibre sur le front, ou enchaîner des dribbles inversées, demande un contrôle moteur si subtil qu'il devient presque involontaire chez un pratiquant expérimenté. Ce niveau de finesse ne s'improvise pas : il vient de centaines de répétitions conscientes, où chaque petit ajustement a été senti et corrigé.",
      },
      {
        titre: "Ce que la Connexion offre aux autres branches",
        texte: "Le contrôle psychomoteur fin développé ici se retrouve partout ailleurs, en filigrane : dans la précision d'un appui en Locomotion, dans le dosage exact de tension nécessaire pour tenir une figure sans excès de rigidité, dans la capacité à sentir un déséquilibre avant qu'il ne devienne une chute. La Connexion ne se voit pas toujours à l'œil nu, mais elle conditionne la qualité de tout le reste.",
      },
      {
        titre: "Le soshin, l'esprit du débutant qui reste actif",
        texte: "Même à ce niveau avancé, l'état d'esprit du débutant — ouvert, avide d'expérimenter, non attaché au résultat — reste la meilleure posture face à des tâches aussi exigeantes en précision que le monkey ball ou le ballon en équilibre sur le front. Ces exercices demandent d'accepter l'échec répété sans s'en vexer : c'est justement cette tolérance à l'erreur qui permet au système nerveux d'affiner le geste au fil des tentatives.",
      },
      {
        titre: 'Une compétence qui se nourrit ou qui s\'efface',
        texte: "Le contrôle moteur fin est une compétence périssable : sans pratique régulière, la précision acquise ici se dissipe plus vite que la force ou la souplesse. C'est pourquoi les jeux de manipulation gagnent à être intégrés durablement (en échauffement, en fin de séance) plutôt que traités comme un objectif ponctuel qu'on abandonne une fois validé.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'monkey-ball', nom: 'Monkey ball', videoUrl: 'https://youtu.be/baNnB3pNAgo', theme: 'mobilite',
        consigne: "Jeu de manipulation avancé qui combine plusieurs qualités déjà travaillées dans la famille (contrôle, réflexe, rythme). Laisse le jeu guider la manipulation plutôt qu'un pattern figé.",
        critereValidation: '1 minute de jeu continu sans perdre le contrôle de la balle.',
        outils: [{ nom: 'Manipulation d\'objet — ballon sur le front', videoUrl: 'https://youtu.be/M84UQmSCRJE' }] },
      { id: 'manipulation-ballon-front', nom: "Manipulation d'objet — ballon sur le front", videoUrl: 'https://youtu.be/M84UQmSCRJE', theme: 'mobilite',
        consigne: "Équilibre le ballon sur le front en corrigeant en continu par de petits ajustements de la tête et du cou. Sommet de la famille Manipulation, exige beaucoup de concentration fine.",
        critereValidation: '20 secondes de maintien sans faire tomber le ballon.',
        outils: [{ nom: 'Monkey ball', videoUrl: 'https://youtu.be/baNnB3pNAgo' }] },
      { id: 'brain-work-5', nom: 'Brain work 5', videoUrl: 'https://youtu.be/Rlan5rrsMUU', theme: 'mobilite',
        consigne: "Suite du Brain work, niveau avancé : la séquence combine plusieurs axes de coordination déjà travaillés séparément.",
        critereValidation: 'Séquence complète réalisée 3 fois de suite sans erreur.',
        outils: [{ nom: 'Brain work 6', videoUrl: 'https://youtu.be/0j2mWD2VmgU' }] },
      { id: 'dribbles-pieds-phase-2', nom: 'Dribbles de pieds — phase 2', videoUrl: 'https://youtu.be/BlZQRcE09rE', theme: 'mobilite',
        consigne: "Suite des dribbles de pieds avec davantage de complexité dans les appuis (changements de pied, déplacements). S'entraîne bien à deux, en se renvoyant le ballon.",
        critereValidation: 'Réalisez 30 rebonds enchaînés.',
        outils: [{ nom: 'Dribbles de pieds — progression', videoUrl: 'https://youtu.be/glNItA2wrZk' }] },
      { id: 'dribbles-2-balles-progression', nom: 'Dribbles 2 balles — progression', videoUrl: 'https://youtu.be/ayI2yRrud5Y', theme: 'mobilite',
        consigne: "Progression du dribble à deux balles vers plus de vitesse et de précision, en resserrant l'intervalle entre chaque rebond.",
        critereValidation: 'Réalisez 30 rebonds enchaînés à vitesse soutenue.',
        outils: [{ nom: 'Dribbles inversées', videoUrl: 'https://youtu.be/pJKhMBwCarI' }] },
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
    objectifPedagogique: "Comprendre les figures statiques comme fondement de tout le travail de Figures à venir.",
    image: '/mentorship/figures-1.png',
    theorie: [
      {
        titre: 'Les figures statiques : un fondement, pas un but',
        texte: "Les figures statiques (tenues en isométrie, sans mouvement apparent du corps) développent une force considérable, une stabilité et un contrôle exceptionnels. Le pont, le handstand contre le mur et l'elbow lever en sont les trois piliers de ce premier niveau. Elles servent de fondement solide pour les compétences dynamiques à venir et forgent autant une discipline mentale que physique.",
      },
      {
        titre: 'Pont et handstand : deux inversions complémentaires',
        texte: "Le pont ouvre le corps vers l'arrière (extension), le handstand l'inverse complètement (renversement). Les deux stimulent le système vestibulaire différemment et sollicitent des chaînes musculaires opposées — c'est volontaire : cette branche construit dès le départ un corps capable des deux extrêmes, pas seulement d'un sens de mouvement.",
      },
      {
        titre: 'Fragmenter une figure : identifier ce qu\'elle demande',
        texte: "Avant de tenter une figure complète, on juge le niveau de maîtrise requis puis on identifie les qualités à développer séparément — c'est l'étape Fragmenter du Cycle d'apprentissage. Le handstand contre le mur, par exemple, retire la composante équilibre pour ne travailler que la force d'épaule et l'alignement ; l'elbow diamant retire la difficulté du renversement pour ne travailler que le placement du poids sur les coudes. Chaque figure statique de ce niveau isole ainsi une qualité précise du travail complet à venir.",
      },
      {
        titre: 'Les standards, des repères plutôt que des jugements',
        texte: "Les standards de progression (les critères de validation de chaque exercice) servent d'indicateurs clés : ils permettent de se concentrer sur des améliorations spécifiques et de mesurer ses progrès de façon objective, sans dépendre d'une impression subjective. Atteindre un standard n'est pas une fin, c'est un moyen d'identifier clairement ce qui est acquis et ce qui reste à travailler.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'pont-bas', nom: 'Pont bas', videoUrl: 'https://youtu.be/MD7sDoWnpAc', theme: 'force',
        consigne: "Mouvement d'ouverture (extension) : mains et pieds au sol, bassin poussé vers le haut, poitrine ouverte. Renforce la chaîne postérieure et la mobilité vertébrale. Se complète avec le L-sit (fermeture) pour un corps flexible et fort dans les deux sens.",
        critereValidation: '3x 30 secondes d\'isométrie en pont bas, ou 10 répétitions de Bridge Push Up en pont bas.',
        outils: [{ nom: 'Pont bas — touche épaules', videoUrl: 'https://youtu.be/EAv-Wes9Xdo' }] },
      { id: 'handstand-dos-au-mur', nom: 'Handstand dos au mur', videoUrl: 'https://youtu.be/XOPq9QtH6Lw', theme: 'force',
        consigne: "Dos au mur pour un renversement sécurisé : les mains au sol, monte les jambes jusqu'à toucher le mur avec les talons, bras tendus, épaules engagées. La façon la plus sûre de découvrir la position renversée.",
        critereValidation: '3 tenues de 20 secondes, épaules engagées (pas affaissées entre les oreilles).',
        outils: [{ nom: 'Handstand prep', videoUrl: 'https://youtu.be/MMN2H48qOdI' }, { nom: 'Box walk', videoUrl: 'https://youtu.be/Ti8dfYdrDe8' }] },
      { id: 'elbow-diamant', nom: 'Elbow diamant', videoUrl: 'https://youtu.be/sHHs-rS_Z1s', theme: 'force',
        consigne: "Position de base de l'elbow lever, mains en diamant sous le nombril : le poids du corps est amené sur les coudes, appuyé sur les cuisses. Point de départ de toute la famille des figures sur les coudes.",
        critereValidation: '3 tenues de 15 secondes, poids stable sur les coudes.',
        outils: [{ nom: 'Frog', videoUrl: 'https://youtu.be/YPVYiqCGZfg' }] },
      { id: 'frog', nom: 'Frog', videoUrl: 'https://youtu.be/YPVYiqCGZfg', theme: 'force',
        consigne: "Équilibre sur les mains, genoux posés sur les coudes, regard légèrement devant. Point de départ de toute la famille Frog — comprendre les mécanismes de l'équilibre sur les mains en renforçant le centre et la résilience des poignets.",
        critereValidation: '3x 30 secondes de Frog.',
        outils: [{ nom: 'Frog transition 1', videoUrl: 'https://youtu.be/FobsslhMKeA' }] },
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
    objectifPedagogique: "Comprendre l'ouverture et la fermeture comme deux polarités complémentaires du corps en figure.",
    image: '/mentorship/figures-2.png',
    theorie: [
      {
        titre: 'Ouverture et fermeture : harmonie des mouvements',
        texte: "Les mouvements d'ouverture (extensions, comme le pont) sont équilibrés par des mouvements de fermeture (flexion et compression, comme le L-sit). Cette dualité assure que muscles et articulations ne sont pas seulement flexibles mais aussi forts dans les deux sens — travailler uniquement l'un des deux crée à terme un déséquilibre, exactement comme la chaîne antérieure/postérieure en Force.",
      },
      {
        titre: "L'endurance de position, avant l'autonomie",
        texte: "Le handstand ventre au mur expose davantage à la sensation de bascule que dos au mur — il construit l'endurance de la position avant de chercher à s'en éloigner en niveau 3. C'est la même logique de progression que partout ailleurs dans l'arbre : sécuriser une compétence avant de retirer les aides qui la soutenaient.",
        image: '/mentorship/theorie/progression-handstand-volume.png',
      },
      {
        titre: 'Assembler : la figure prend forme',
        texte: "Ce niveau correspond à l'étape Assembler : les qualités isolées au niveau 1 (force d'épaule, placement des coudes, alignement) sont désormais mises au service d'une figure plus complète — le L-sit exige de tenir simultanément le gainage, la poussée des bras et le contrôle des jambes, plutôt qu'une seule de ces qualités à la fois. Le premier assemblage est souvent imparfait (une version « approximative » de la figure visée) : c'est normal et attendu, pas un échec.",
      },
      {
        titre: "L'appui manuel, une compétence à part entière",
        texte: "Prendre appui sur les mains sollicite une mobilité de poignet particulière, différente de tout ce qui est demandé dans la vie quotidienne. Cette mobilité se construit progressivement avec le volume d'exposition — c'est pour cela que les figures sur les mains (L-sit, elbow lever, handstand) sont réparties sur plusieurs niveaux plutôt que regroupées d'un coup : le poignet a besoin de temps pour s'adapter à cette charge inhabituelle.",
        image: '/mentorship/theorie/repartition-poids-main.png',
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'handstand-ventre-au-mur', nom: 'Handstand ventre au mur', videoUrl: 'https://youtu.be/lNQYdhRlejI', theme: 'force',
        consigne: "Ventre face au mur cette fois, mains posées puis marche des pieds jusqu'au mur. Plus exigeant que dos au mur car il expose davantage à la sensation de bascule — travaille l'endurance de la position avant de chercher à s'en éloigner.",
        critereValidation: '3 tenues de 30 secondes, corps aligné (pas cambré ni plié aux hanches).',
        outils: [{ nom: 'Wall walk', videoUrl: 'https://youtu.be/ZGlbpcyYGUs' }, { nom: 'Box walk', videoUrl: 'https://youtu.be/Ti8dfYdrDe8' }] },
      { id: 'l-sit', nom: 'L-sit', videoUrl: 'https://youtu.be/kO0ntgyhG0E', theme: 'force',
        consigne: "Appui sur les mains, jambes tendues à l'horizontale devant soi (position en L). Mouvement de fermeture (flexion) qui complète le pont — comprendre les mécanismes de l'équilibre sur les mains en renforçant le centre et les poignets.",
        critereValidation: '3x 10 secondes de L-Sit.',
        outils: [{ nom: 'L-sit ring', videoUrl: 'https://youtu.be/2l1Nf2CgRwA' }] },
      { id: 'elbow-split', nom: 'Elbow split', videoUrl: '', theme: 'force', note: 'Vidéo à confirmer — non trouvée dans la bibliothèque classée',
        consigne: "Variante de l'elbow lever jambes en grand écart (split) plutôt qu'en diamant ou en straddle — modifie encore le centre de gravité par rapport aux deux versions précédentes.",
        critereValidation: '3 tenues de 10 secondes, jambes qui restent tendues en écart.',
        outils: [{ nom: 'Elbow diamant', videoUrl: 'https://youtu.be/sHHs-rS_Z1s' }] },
      { id: 'frog-one-leg', nom: 'Frog one leg', videoUrl: 'https://youtu.be/pJWjfbpQvuQ', theme: 'force', note: 'Vidéo retenue : Frog transition 2',
        consigne: "Depuis le frog, décolle une jambe pour ne garder qu'un genou en appui sur le coude — exige plus de contrôle latéral que le frog à deux genoux. Prépare directement le lateral frog en Locomotion.",
        critereValidation: '3 tenues de 10 secondes par côté.',
        outils: [{ nom: 'Frog transition 3', videoUrl: 'https://youtu.be/a5d_or-nXvc' }] },
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
    objectifPedagogique: "Comprendre l'inversion autonome comme perspective complémentaire à la station debout, et les figures dynamiques comme aboutissement du travail statique.",
    image: '/mentorship/figures-3.png',
    theorie: [
      {
        titre: 'Inversion et station debout : perspectives complémentaires',
        texte: "Le handstand libre offre une perspective unique qui défie l'équilibre et la perception habituelle. Il est complété par la station debout, notre état le plus naturel — la pratique de l'inversion stimule le système vestibulaire et les circulations, tandis que la station debout renforce la capacité à s'ancrer et interagir avec l'environnement. Un pratiquant qui ne travaille que l'un des deux perd la complémentarité entre les deux états. Le handstand pousse la flexion d'épaule à son maximum (180°, bras au-dessus de la tête) : c'est cette amplitude, construite dès les premiers niveaux de Figures, qui rend la position tenable sans compensation dans le bas du dos.",
        image: '/mentorship/theorie/flexion-extension-epaule.png',
      },
      {
        titre: 'Des figures statiques aux figures dynamiques',
        texte: "Le QDR et les transitions qui l'accompagnent marquent le passage des figures statiques vers les figures dynamiques : des transitions fluides et contrôlées entre postures, qui demandent en plus de la force et de la stabilité déjà acquises une coordination et une conscience spatiale accrues. Une fois maîtrisées, ces figures se réinjectent directement dans la pratique de la Locomotion — la boucle entre les branches se referme ici.",
      },
      {
        titre: 'Amplifier : la même figure, plus exigeante',
        texte: "Le pont haut n'est pas un mouvement nouveau par rapport au pont bas du niveau 1 — c'est la même figure amplifiée en amplitude et en exigence de flexion d'épaule. C'est une bonne illustration du principe d'Amplifier du Cycle d'apprentissage : augmenter la difficulté d'une compétence déjà acquise plutôt que d'en ajouter sans cesse de nouvelles, pour continuer à progresser sans disperser l'effort.",
      },
      {
        titre: "Les transitions, cœur de la démarche du Mouvement",
        texte: "Les transitions entre figures sont au cœur de cette pratique : elles ne demandent pas seulement la force et la stabilité des figures statiques, mais aussi une agilité et une conscience spatiale que seul l'enchaînement peut développer. C'est en travaillant les transitions, pas seulement les positions elles-mêmes, que les figures cessent d'être des « tricks » isolés pour devenir un vocabulaire de mouvement réellement disponible.",
      },
    ],
    programmation: [],
    qcm: [],
    contenuDefini: false,
    exercices: [
      { id: 'qdr', nom: 'QDR', videoUrl: 'https://youtu.be/1N-KzT5NiUk', theme: 'force',
        consigne: "Isolation de la position de QDR (quadrupédie renversée) : bassin haut, appui sur les mains, jambe libre qui explore l'espace sans casser l'alignement des bras. Compétence statique à maîtriser avant de l'utiliser dynamiquement en Locomotion.",
        critereValidation: '3 tenues de 15 secondes par côté, alignement bras-épaules stable.',
        outils: [{ nom: 'Introduction au QDR', videoUrl: 'https://youtu.be/MORa8Pg1ass' }] },
      { id: 'pont-haut', nom: 'Pont haut', videoUrl: 'https://youtu.be/NcDCSB9dSU0', theme: 'force',
        consigne: "Extension bien plus exigeante que le pont bas, qui demande davantage de flexion d'épaule et d'ouverture de la chaîne antérieure — la poussée se fait ici en fin de flexion d'épaule, d'où l'intérêt du travail de Trap raise/Y raise en Armure Organique.",
        critereValidation: '3 tenues de 15 secondes, bras qui se rapprochent de la verticale.',
        outils: [{ nom: 'Pont haut — iso support', videoUrl: 'https://youtu.be/_ROQncBrQbk' }, { nom: 'Pont haut — push up support', videoUrl: 'https://youtu.be/Z3djPzVE-rg' }] },
      { id: 'elbow-straddle', nom: 'Elbow straddle', videoUrl: 'https://youtu.be/6sKdFFP7qnM', theme: 'force',
        consigne: "Variante straddle (jambes écartées) de l'elbow lever, qui modifie le centre de gravité et l'équilibre par rapport à la version diamant.",
        critereValidation: '3 tenues de 15 secondes, jambes tendues et écartées.',
        outils: [{ nom: 'Elbow diamant', videoUrl: 'https://youtu.be/sHHs-rS_Z1s' }] },
      { id: 'handstand', nom: 'Handstand', videoUrl: 'https://youtu.be/Nx86xgOx0UY', theme: 'force', note: 'Vidéo retenue : Handstand & kick up',
        consigne: "Montée en handstand par un coup de pied (kick up), sans mur ni élan complexe — la façon la plus courante d'entrer dans la position en autonomie complète, une fois le travail au mur maîtrisé.",
        critereValidation: '3 tenues de 10 secondes en équilibre libre, sans toucher le mur.',
        outils: [{ nom: 'Handstand — footwork', videoUrl: 'https://youtu.be/Kbv90BJ93jQ' }, { nom: 'Handstand — référence de posture', videoUrl: 'https://youtu.be/mssnzAHCUY0' }] },
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
