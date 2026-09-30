// Identifiants des prix Stripe de chaque formule vendue en ligne (partagés
// entre /tarifs et le renouvellement en un clic depuis le profil).
export const PRICE_IDS: Record<string, string> = {
  cours_decouverte: 'price_1U0elPA7uUFwYAcPMLZhjc6x',
  cours_unite: 'price_1UEEqKA7uUFwYAcPLFA44eM9',
  mensuel_4: 'price_1U0fdzA7uUFwYAcPnpkuSxMV',
  mensuel_8: 'price_1U0fegA7uUFwYAcPHADTfVBr',
  illimite: 'price_1U0ffOA7uUFwYAcP4TyQfjQO',
  carnet_5: 'price_1U0fo1A7uUFwYAcP2F2YkcDL',
  carnet_10: 'price_1U0fp7A7uUFwYAcPt5947mOo',
  coaching_unite: 'price_1U0fhDA7uUFwYAcPgbsvDXyA',
  coaching_carnet_3h: 'price_1U0fjMA7uUFwYAcPJ1bm09Wq',
  coaching_carnet_4h: 'price_1U0fkNA7uUFwYAcPPB0ftT8Q',
  coaching_online: 'price_1U0frAA7uUFwYAcPc2PhR6B3',
  // ⚠️ Anciennes formules par branche puis par palier : ne plus vendre,
  // conservées ici uniquement pour que CarteFormule/FORMULES restent
  // cohérents pour les élèves qui les ont déjà (jamais affichées
  // ci-dessous, MENTORAT_OUVERT les a de toute façon retirées de la vente
  // avant la refonte).
  mentorship_1branche_3: 'À_CREER_DANS_STRIPE_mentorship_1branche_3',
  mentorship_1branche_6: 'À_CREER_DANS_STRIPE_mentorship_1branche_6',
  mentorship_1branche_12: 'À_CREER_DANS_STRIPE_mentorship_1branche_12',
  mentorship_2branches_3: 'À_CREER_DANS_STRIPE_mentorship_2branches_3',
  mentorship_2branches_6: 'À_CREER_DANS_STRIPE_mentorship_2branches_6',
  mentorship_2branches_12: 'À_CREER_DANS_STRIPE_mentorship_2branches_12',
  mentorship_armure_3: 'À_CREER_DANS_STRIPE_mentorship_armure_3',
  mentorship_armure_6: 'À_CREER_DANS_STRIPE_mentorship_armure_6',
  mentorship_armure_12: 'À_CREER_DANS_STRIPE_mentorship_armure_12',
  mentorship_niveau1_3: 'À_CREER_DANS_STRIPE_mentorship_niveau1_3',
  mentorship_niveau1_6: 'À_CREER_DANS_STRIPE_mentorship_niveau1_6',
  mentorship_niveau1_12: 'À_CREER_DANS_STRIPE_mentorship_niveau1_12',
  mentorship_niveau2_3: 'À_CREER_DANS_STRIPE_mentorship_niveau2_3',
  mentorship_niveau2_6: 'À_CREER_DANS_STRIPE_mentorship_niveau2_6',
  mentorship_niveau2_12: 'À_CREER_DANS_STRIPE_mentorship_niveau2_12',
  mentorship_complet_3: 'À_CREER_DANS_STRIPE_mentorship_complet_3',
  mentorship_complet_6: 'À_CREER_DANS_STRIPE_mentorship_complet_6',
  mentorship_complet_12: 'À_CREER_DANS_STRIPE_mentorship_complet_12',
  // ⚠️ Nouvelles formules (accès complet, différencié par durée seule) — à
  // créer dans Stripe (Produits > Prix, achat ponctuel) puis remplacer ces
  // 3 valeurs avant réouverture du Mentorat :
  mentorship_3: 'À_CREER_DANS_STRIPE_mentorship_3',
  mentorship_6: 'À_CREER_DANS_STRIPE_mentorship_6',
  mentorship_12: 'À_CREER_DANS_STRIPE_mentorship_12',
  post_mentorship: 'price_1U0ftFA7uUFwYAcPwzVQnERa',
};
