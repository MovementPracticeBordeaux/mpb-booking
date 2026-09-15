// Catalogue central de toutes les formules (source unique de vérité).
// Utilisé par la page tarifs, le checkout Stripe, le webhook et l'admin,
// pour éviter toute incohérence entre ces 4 endroits.
//
// categorie:
//   'planning' -> consomme des séances, réservées sur le planning des cours collectifs
//   'coaching' -> coaching individuel, pas de réservation de créneau : après
//                 achat, l'élève est mis en relation avec Sylvain
//   'mentorat' -> accès à l'espace /mentorship (arbre de compétences)
//
// Chaque élève peut avoir AU PLUS une formule active par catégorie en même
// temps (ex. un pass collectif + un accès mentorat simultanément), mais pas
// deux formules de la même catégorie (ex. deux passs collectifs à la fois).
// Voir la table 'abonnements' — une ligne par catégorie active par élève.
//
// unite: le libellé du quota affiché ('séance' ou 'heure'), null si illimité
// prixIndicatif: utilisé uniquement comme montant par défaut sur les factures
// générées pour une attribution manuelle (Stripe donne le vrai montant payé
// automatiquement, ce prix n'est donc jamais utilisé pour un paiement Stripe)

export type Formule = {
  nom: string;
  categorie: 'planning' | 'coaching' | 'mentorat';
  unite: 'séance' | 'heure' | null;
  quota: number | null; // null = illimité, pas de décompte
  validiteMois: number;
  prixIndicatif: number; // en euros
};

// --- Réglages du Mentorat (refonte en cours) ---
//
// Tant que MENTORAT_OUVERT est à false : la page /tarifs n'affiche plus le
// bouton d'achat/candidature pour le Mentorat (juste un message "en travaux"),
// et /mentorat/candidature refuse les nouvelles candidatures. Les élèves déjà
// actifs gardent l'accès à leur espace Mentorat pendant ce temps.
// -> Repasser à true une fois la refonte terminée.
export const MENTORAT_OUVERT = false;

// Nombre de places ouvertes par session de Mentorat (accompagnement à petit
// volume, cf. décision du 13/08/2026). Purement informatif pour l'instant :
// affiché sur la page, mais pas encore décompté automatiquement en base.
export const MENTORAT_PLACES_PAR_SESSION = 12;

export const FORMULES: Record<string, Formule> = {
  // --- Cours collectifs ---
  illimite: { nom: 'Illimité', categorie: 'planning', unite: null, quota: null, validiteMois: 1, prixIndicatif: 89 },
  mensuel_8: { nom: '8 cours / mois', categorie: 'planning', unite: 'séance', quota: 8, validiteMois: 1, prixIndicatif: 79 },
  mensuel_4: { nom: '4 cours / mois', categorie: 'planning', unite: 'séance', quota: 4, validiteMois: 1, prixIndicatif: 49 },
  carnet_10: { nom: 'Carnet 10 cours', categorie: 'planning', unite: 'séance', quota: 10, validiteMois: 6, prixIndicatif: 149 },
  carnet_5: { nom: 'Carnet 5 cours', categorie: 'planning', unite: 'séance', quota: 5, validiteMois: 3, prixIndicatif: 85 },
  cours_decouverte: { nom: 'Cours découverte', categorie: 'planning', unite: 'séance', quota: 1, validiteMois: 1, prixIndicatif: 10 },
  // Contrairement au cours découverte (réservé aux nouveaux, 1 seule fois),
  // celui-ci est réachetable librement — utile pour quelqu'un qui a déjà
  // consommé son cours découverte et veut continuer à essayer différentes
  // thématiques avant de s'engager sur un pass plus large.
  cours_unite: { nom: 'Cours à l\'unité', categorie: 'planning', unite: 'séance', quota: 1, validiteMois: 1, prixIndicatif: 20 },

  // --- Coaching individuel & mentorship (pas de réservation de créneau) ---
  // coaching_online n'est plus proposé à la vente (retiré de /tarifs le
  // 11/09/2026) - conservé uniquement pour les élèves qui l'ont déjà en
  // base (factures, accès en cours), même principe que l'ancienne formule
  // Mentorship ci-dessous.
  coaching_online: { nom: 'Coaching Online', categorie: 'coaching', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
  coaching_unite: { nom: 'Coaching 1-to-1 à l\'unité', categorie: 'coaching', unite: 'heure', quota: 1, validiteMois: 1, prixIndicatif: 60 },
  coaching_carnet_3h: { nom: 'Carnet coaching 3h', categorie: 'coaching', unite: 'heure', quota: 3, validiteMois: 3, prixIndicatif: 165 },
  coaching_carnet_4h: { nom: 'Carnet coaching 4h', categorie: 'coaching', unite: 'heure', quota: 4, validiteMois: 1, prixIndicatif: 199 },

  // Ancienne formule Mentorship (un seul pass 3 mois à 599€) : conservée
  // uniquement pour les élèves qui l'ont déjà en base (factures, accès en
  // cours). Ne plus vendre — retirée de la page /tarifs.
  mentorship: { nom: 'Mentorat (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 599 },

  // Anciennes formules Mentorat par branche (1 ou 2 branches au choix) :
  // remplacées par le modèle par palier ci-dessous (déblocage simultané des
  // 5 branches, niveau par niveau, cohérent avec le fonctionnement réel de
  // l'arbre). Conservées uniquement pour les élèves qui les ont déjà en
  // base -- ne plus vendre, retirées de /tarifs et de la page /mentorat.
  mentorship_1branche_3: { nom: 'Mentorat — 1 branche — 3 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 249 },
  mentorship_1branche_6: { nom: 'Mentorat — 1 branche — 6 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 449 },
  mentorship_1branche_12: { nom: 'Mentorat — 1 branche — 12 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 799 },
  mentorship_2branches_3: { nom: 'Mentorat — 2 branches — 3 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 329 },
  mentorship_2branches_6: { nom: 'Mentorat — 2 branches — 6 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 599 },
  mentorship_2branches_12: { nom: 'Mentorat — 2 branches — 12 mois (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 999 },

  // Nouvelles formules Mentorat, par PALIER plutôt que par branche -- cohérent
  // avec le fonctionnement réel de l'arbre : l'Armure Organique d'abord, puis
  // le niveau 1 des 5 branches se débloque en même temps, puis le niveau 2,
  // puis le niveau 3. On ne choisit plus une branche, on achète l'accès
  // jusqu'à un palier donné, sur les 5 branches à la fois.
  // ⚠️ Prix indicatifs -- à confirmer avec Sylvain avant mise en vente réelle.
  mentorship_armure_3: { nom: 'Mentorat — Armure Organique — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 99 },
  mentorship_armure_6: { nom: 'Mentorat — Armure Organique — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 169 },
  mentorship_armure_12: { nom: 'Mentorat — Armure Organique — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 299 },
  mentorship_niveau1_3: { nom: 'Mentorat — Niveau 1 — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 199 },
  mentorship_niveau1_6: { nom: 'Mentorat — Niveau 1 — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 349 },
  mentorship_niveau1_12: { nom: 'Mentorat — Niveau 1 — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 599 },
  mentorship_niveau2_3: { nom: 'Mentorat — Niveau 2 — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 289 },
  mentorship_niveau2_6: { nom: 'Mentorat — Niveau 2 — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 499 },
  mentorship_niveau2_12: { nom: 'Mentorat — Niveau 2 — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 849 },
  mentorship_complet_3: { nom: 'Mentorat — Complet (Niveau 3) — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 379 },
  mentorship_complet_6: { nom: 'Mentorat — Complet (Niveau 3) — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 649 },
  mentorship_complet_12: { nom: 'Mentorat — Complet (Niveau 3) — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 1099 },

  post_mentorship: { nom: 'Suivi Post-Mentorat', categorie: 'mentorat', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
};

// Toutes les clés de formule donnant accès à l'espace /mentorship (ancienne
// + anciennes formules par branche, conservées pour les élèves existants +
// nouvelles formules par palier + suivi post-programme).
export const CLES_ACCES_MENTORAT = [
  'mentorship',
  'mentorship_1branche_3', 'mentorship_1branche_6', 'mentorship_1branche_12',
  'mentorship_2branches_3', 'mentorship_2branches_6', 'mentorship_2branches_12',
  'mentorship_armure_3', 'mentorship_armure_6', 'mentorship_armure_12',
  'mentorship_niveau1_3', 'mentorship_niveau1_6', 'mentorship_niveau1_12',
  'mentorship_niveau2_3', 'mentorship_niveau2_6', 'mentorship_niveau2_12',
  'mentorship_complet_3', 'mentorship_complet_6', 'mentorship_complet_12',
  'post_mentorship',
];

// Les 4 paliers du nouveau modèle -- le niveau maximum accessible sur les 5
// branches à la fois (null = illimité, ancienne formule ou admin). Les clés
// de formule 3/6/12 mois d'un même palier donnent toutes le même palierMax,
// seule la durée change.
export type PalierMentorat = { cle: string; nom: string; palierMax: number; description: string; cles3_6_12: [string, string, string] };
export const PALIERS_MENTORAT: PalierMentorat[] = [
  {
    cle: 'armure', nom: 'Armure Organique', palierMax: 0,
    description: "Les fondations communes à tout le reste : mobilité, respiration, force et souplesse générales. Rien ne s'ouvre encore au-delà.",
    cles3_6_12: ['mentorship_armure_3', 'mentorship_armure_6', 'mentorship_armure_12'],
  },
  {
    cle: 'niveau1', nom: 'Niveau 1', palierMax: 1,
    description: "L'Armure Organique complète, puis le niveau 1 des cinq branches (Force, Figures, Locomotion, Connexion, Flexibilité) débloqué en même temps.",
    cles3_6_12: ['mentorship_niveau1_3', 'mentorship_niveau1_6', 'mentorship_niveau1_12'],
  },
  {
    cle: 'niveau2', nom: 'Niveau 2', palierMax: 2,
    description: "Tout le Niveau 1, plus le niveau 2 des cinq branches débloqué en même temps.",
    cles3_6_12: ['mentorship_niveau2_3', 'mentorship_niveau2_6', 'mentorship_niveau2_12'],
  },
  {
    cle: 'complet', nom: 'Complet', palierMax: 3,
    description: "L'arbre dans son intégralité : les trois niveaux des cinq branches.",
    cles3_6_12: ['mentorship_complet_3', 'mentorship_complet_6', 'mentorship_complet_12'],
  },
];

// Les 5 branches de spécialisation (mêmes clés que le champ `domaine` dans
// lib/mentorship-modules.ts, pour rester cohérent avec le modèle de données
// de l'arbre de compétences). Ne représente plus un choix d'achat (le
// nouveau modèle est par palier, pas par branche) -- gardé comme référence
// des noms/clés de branche pour l'affichage.
export const BRANCHES_MENTORAT: { cle: string; nom: string }[] = [
  { cle: 'force', nom: 'Force' },
  { cle: 'figures', nom: 'Figures' },
  { cle: 'locomotion', nom: 'Locomotion' },
  { cle: 'connexion', nom: 'Connexion' },
  { cle: 'flexibilite', nom: 'Flexibilité' },
];

// Palier maximum accessible sur les 5 branches à la fois, à partir d'une clé
// de formule Mentorat. null = illimité (ancienne formule 'mentorship', ou
// clé inconnue/admin) -- traité comme un accès complet par le reste du code.
// Les anciennes formules par branche (1branche/2branches) sont traitées
// comme 'illimité' : on ne sait plus, avec le nouveau modèle, à quel palier
// les rattacher précisément -- Sylvain les convertira au cas par cas.
export function palierMaxDeFormule(cleFormule: string): number | null {
  for (const p of PALIERS_MENTORAT) {
    if (p.cles3_6_12.includes(cleFormule)) return p.palierMax;
  }
  return null;
}
