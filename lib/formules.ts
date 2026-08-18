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

  // --- Coaching individuel & mentorship (pas de réservation de créneau) ---
  coaching_online: { nom: 'Coaching Online', categorie: 'coaching', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
  coaching_unite: { nom: 'Coaching 1-to-1 à l\'unité', categorie: 'coaching', unite: 'heure', quota: 1, validiteMois: 1, prixIndicatif: 60 },
  coaching_carnet_3h: { nom: 'Carnet coaching 3h', categorie: 'coaching', unite: 'heure', quota: 3, validiteMois: 3, prixIndicatif: 165 },
  coaching_carnet_4h: { nom: 'Carnet coaching 4h', categorie: 'coaching', unite: 'heure', quota: 4, validiteMois: 1, prixIndicatif: 199 },

  // Ancienne formule Mentorship (un seul pass 3 mois à 599€) : conservée
  // uniquement pour les élèves qui l'ont déjà en base (factures, accès en
  // cours). Ne plus vendre — retirée de la page /tarifs.
  mentorship: { nom: 'Mentorat (ancienne formule)', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 599 },

  // Nouvelles formules Mentorat, en pass à durée fixe (pas d'abonnement).
  // Accès par branche plutôt que global : 1 branche au choix, ou 2 branches
  // au choix (le nombre de branches change peu la charge de suivi réelle,
  // d'où un supplément raisonnable plutôt qu'un doublement du prix).
  // ⚠️ Prix proposés à confirmer avec Sylvain avant mise en vente réelle.
  mentorship_1branche_3: { nom: 'Mentorat — 1 branche — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 249 },
  mentorship_1branche_6: { nom: 'Mentorat — 1 branche — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 449 },
  mentorship_1branche_12: { nom: 'Mentorat — 1 branche — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 799 },
  mentorship_2branches_3: { nom: 'Mentorat — 2 branches — 3 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 3, prixIndicatif: 329 },
  mentorship_2branches_6: { nom: 'Mentorat — 2 branches — 6 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 6, prixIndicatif: 599 },
  mentorship_2branches_12: { nom: 'Mentorat — 2 branches — 12 mois', categorie: 'mentorat', unite: null, quota: null, validiteMois: 12, prixIndicatif: 999 },

  post_mentorship: { nom: 'Suivi Post-Mentorat', categorie: 'mentorat', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
};

// Toutes les clés de formule donnant accès à l'espace /mentorship (ancienne
// + nouvelles formules par branche + suivi post-programme).
export const CLES_ACCES_MENTORAT = [
  'mentorship',
  'mentorship_1branche_3', 'mentorship_1branche_6', 'mentorship_1branche_12',
  'mentorship_2branches_3', 'mentorship_2branches_6', 'mentorship_2branches_12',
  'post_mentorship',
];

// Les 5 branches de spécialisation (mêmes clés que le champ `domaine` dans
// lib/mentorship-modules.ts, pour rester cohérent avec le modèle de données
// de l'arbre de compétences).
export const BRANCHES_MENTORAT: { cle: string; nom: string }[] = [
  { cle: 'force', nom: 'Force' },
  { cle: 'figures', nom: 'Figures' },
  { cle: 'locomotion', nom: 'Locomotion' },
  { cle: 'connexion', nom: 'Connexion' },
  { cle: 'flexibilite', nom: 'Flexibilité' },
];

// Duos recommandés par Sylvain (synergie pédagogique) pour la formule
// "2 branches" — présentés en priorité, mais le choix reste libre.
export const DUOS_RECOMMANDES: [string, string][] = [
  ['force', 'figures'],
  ['force', 'locomotion'],
  ['force', 'flexibilite'],
  ['flexibilite', 'locomotion'],
  ['connexion', 'locomotion'],
  ['figures', 'locomotion'],
];
