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

export const FORMULES: Record<string, Formule> = {
  // --- Formule de test temporaire (à retirer une fois les vrais tests faits) ---
  test_temporaire: { nom: 'Test (1€)', categorie: 'planning', unite: 'séance', quota: 1, validiteMois: 1, prixIndicatif: 1 },

  // --- Cours collectifs ---
  illimite: { nom: 'Illimité', categorie: 'planning', unite: null, quota: null, validiteMois: 1, prixIndicatif: 89 },
  mensuel_8: { nom: '8 cours / mois', categorie: 'planning', unite: 'séance', quota: 8, validiteMois: 1, prixIndicatif: 69 },
  mensuel_4: { nom: '4 cours / mois', categorie: 'planning', unite: 'séance', quota: 4, validiteMois: 1, prixIndicatif: 39 },
  carnet_10: { nom: 'Carnet 10 cours', categorie: 'planning', unite: 'séance', quota: 10, validiteMois: 6, prixIndicatif: 150 },
  carnet_5: { nom: 'Carnet 5 cours', categorie: 'planning', unite: 'séance', quota: 5, validiteMois: 3, prixIndicatif: 85 },
  cours_decouverte: { nom: 'Cours découverte', categorie: 'planning', unite: 'séance', quota: 1, validiteMois: 1, prixIndicatif: 10 },

  // --- Coaching individuel & mentorship (pas de réservation de créneau) ---
  coaching_online: { nom: 'Coaching Online', categorie: 'coaching', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
  coaching_unite: { nom: 'Coaching 1-to-1 à l\'unité', categorie: 'coaching', unite: 'heure', quota: 1, validiteMois: 1, prixIndicatif: 60 },
  coaching_carnet_3h: { nom: 'Carnet coaching 3h', categorie: 'coaching', unite: 'heure', quota: 3, validiteMois: 3, prixIndicatif: 165 },
  coaching_carnet_4h: { nom: 'Carnet coaching 4h', categorie: 'coaching', unite: 'heure', quota: 4, validiteMois: 1, prixIndicatif: 199 },
  mentorship: { nom: 'Programme Mentorship', categorie: 'coaching', unite: null, quota: null, validiteMois: 3, prixIndicatif: 599 },
  post_mentorship: { nom: 'Suivi Post-Mentorship', categorie: 'coaching', unite: null, quota: null, validiteMois: 1, prixIndicatif: 80 },
};
