// Historique figé de l'ancien site Wix, importé une seule fois le 07/08/2026
// à partir des exports CSV du dashboard Wix (période 08/08/2025-08/08/2026,
// dernier jour d'exploitation avant la bascule vers ce nouveau site).
// Ces données ne bougeront plus jamais (Wix est fermé) : pas besoin de les
// recalculer à chaque affichage, elles sont figées ici en dur.

// Revenus mensuels (Rapport des ventes quotidien, agrégé par mois).
// S'arrête à juillet 2026 : août 2026 est couvert par les vrais paiements
// Stripe du nouveau site, pour ne pas compter deux fois la période de bascule.
export const REVENUS_MENSUELS_WIX: Record<string, number> = {
  '2025-08': 183,
  '2025-09': 1925,
  '2025-10': 1661,
  '2025-11': 2592,
  '2025-12': 1666,
  '2026-01': 1552,
  '2026-02': 1047,
  '2026-03': 1553,
  '2026-04': 1206,
  '2026-05': 1219,
  '2026-06': 1306,
  '2026-07': 639,
};

export const TOTAL_ENCAISSE_WIX = 16698; // somme sur les 12 mois + les premiers jours d'août 2026

// Fréquentation par discipline (réservations confirmées), Rapport de
// réservations par service. Uniquement les 6 disciplines actuelles ; les
// ateliers ponctuels (Handstand Focus, Breathing, etc.) ne sont pas repris.
export const FREQUENTATION_DISCIPLINES_WIX: { nom: string; reservations: number }[] = [
  { nom: 'Handstand', reservations: 430 },
  { nom: 'Calisthenics', reservations: 187 },
  { nom: 'Locomotion', reservations: 182 },
  { nom: 'Mobilité', reservations: 162 },
  { nom: 'Arm Balance', reservations: 122 },
  { nom: 'Altinha', reservations: 5 },
];

// Formules les plus vendues (Rapport des ventes par article), regroupées
// quand une même formule existait en variante "1 fois" et "par mois".
export const FORMULES_VENDUES_WIX: { nom: string; ventes: number; montant: number }[] = [
  { nom: 'Carnet Or (illimité)', ventes: 63, montant: 5607 },
  { nom: 'Carnet 10 cours', ventes: 16, montant: 2384 },
  { nom: 'Carnet Bronze (4 cours)', ventes: 39, montant: 1911 },
  { nom: 'Programme Mentorship', ventes: 2, montant: 1198 },
  { nom: 'Carnet Argent (8 cours)', ventes: 14, montant: 1106 },
  { nom: 'Coaching 1:1', ventes: 4, montant: 796 },
  { nom: 'Cours découverte', ventes: 54, montant: 540 },
];

// Meilleurs créneaux jour + heure (Rapport de sessions), top 5 par nombre
// de places réservées sur la période.
export const MEILLEURS_CRENEAUX_WIX: { jour: string; heure: string; places: number; taux: string }[] = [
  { jour: 'Mardi', heure: '19:30', places: 297, taux: '42 %' },
  { jour: 'Mercredi', heure: '12:15', places: 194, taux: '39 %' },
  { jour: 'Jeudi', heure: '12:15', places: 141, taux: '26 %' },
  { jour: 'Mardi', heure: '12:15', places: 101, taux: '49 %' },
  { jour: 'Vendredi', heure: '11:00', places: 101, taux: '19 %' },
];

// Trafic du site (Rapport sur le trafic), agrégé sur toute la période.
export const TRAFIC_WIX = {
  jours: 364,
  vuesDePage: 12440,
  visiteursUniques: 3981,
};
