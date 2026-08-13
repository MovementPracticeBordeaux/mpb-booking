// Catalogue central de toutes les formules (source unique de vérité).
// Utilisé par la page tarifs, le checkout Stripe, le webhook et l'admin,
// pour éviter toute incohérence entre ces 4 endroits.
//
// categorie:
//   'planning' -> consomme des séances, réservées sur le planning des cours collectifs
//   'coaching' -> pas de réservation de créneau : après achat, l'élève est mis
//                 en relation avec Sylvain pour caler le créneau ensemble
//
// unite: le libellé du quota affiché ('séance' ou 'heure'), null si illimité
// prixIndicatif: utilisé uniquement comme montant par défaut sur les factures
// générées pour une attribution manuelle (Stripe donne le vrai montant payé
// automatiquement, ce prix n'est donc jamais utilisé pour un paiement Stripe)

export type Formule = {
  nom: string;
  categorie: 'planning' | 'coaching';
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
  mentorship: { nom: 'Mentorat (ancienne formule)', categorie: 'coaching', unite: null, quota: null, validiteMois: 3, prixIndicatif: 599 },

  // Nouvelles formules Mentorat, en pass à durée fixe (pas d'abonnement),
  // avec dégressif au mois pour valoriser l'engagement dans la durée.
  // ⚠️ Prix proposés à confirmer avec Sylvain avant mise en vente réelle.
  mentorship_3: { nom: 'Mentorat — 3 mois', categorie: 'coaching', unite: null, quota: null, validiteMois: 3, prixIndicatif: 249 },
  mentorship_6: { nom: 'Mentorat — 6 mois', categorie: 'coaching', unite: null, quota: null, validiteMois: 6, prixIndicatif: 449 },
  mentorship_12: { nom: 'Mentorat — 12 mois', categorie: 'coaching', unite: null, quota: null, validiteMois: 12, prixIndicatif: 799 },

  post_mentorship: { nom: 'Suivi Post-Mentorat', categorie: 'coaching', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
};

// Toutes les clés de formule donnant accès à l'espace /mentorship (ancienne
// + nouvelles formules + suivi post-programme).
export const CLES_ACCES_MENTORAT = ['mentorship', 'mentorship_3', 'mentorship_6', 'mentorship_12', 'post_mentorship'];
